"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createRNG } from "@/lib/games/seeded-random";
import {
  generateLevel,
  createStealthState,
  tickStealth,
  movePlayer,
  getVisionCone,
  getNextBeatVisionCells,
  DIR_OFFSETS,
  type StealthConfig,
  type StealthState,
} from "@/lib/games/stealth-sequence";

interface StealthSequenceProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  config?: Record<string, unknown>;
}

// Guard type colors
const GUARD_COLORS = {
  patrol: "#9b59b6",
  rotating: "#e67e22",
  erratic: "#e74c3c",
};

export function StealthSequence({ seed, difficulty, onComplete }: StealthSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const configRef = useRef<StealthConfig | null>(null);
  const stateRef = useRef<StealthState | null>(null);
  const rngRef = useRef<ReturnType<typeof createRNG> | null>(null);
  const [displayBeats, setDisplayBeats] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "caught">("playing");
  const [closeCalls, setCloseCalls] = useState(0);
  const [cellSize, setCellSize] = useState(40);

  // Swipe tracking
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMove = useCallback((dr: number, dc: number) => {
    const config = configRef.current;
    const state = stateRef.current;
    if (!config || !state) return;
    stateRef.current = movePlayer(state, dr, dc, config);
  }, []);

  const handleTap = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    const config = configRef.current;
    const state = stateRef.current;
    if (!canvas || !config || !state) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const col = Math.floor(((e.clientX - rect.left) * scaleX) / cellSize);
    const row = Math.floor(((e.clientY - rect.top) * scaleY) / cellSize);

    const dr = row - state.playerRow;
    const dc = col - state.playerCol;

    if (Math.abs(dr) + Math.abs(dc) === 1) {
      handleMove(dr, dc);
    }
  }, [cellSize, handleMove]);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const start = pointerStartRef.current;
    if (!start) return;
    pointerStartRef.current = null;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      // Tap, not swipe — handle via handleTap
      return;
    }

    // Swipe detected
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(0, dx > 0 ? 1 : -1);
    } else {
      handleMove(dy > 0 ? 1 : -1, 0);
    }
  }, [handleMove]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    let dr = 0, dc = 0;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") dr = -1;
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") dr = 1;
    else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") dc = -1;
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dc = 1;
    else return;

    e.preventDefault();
    handleMove(dr, dc);
  }, [handleMove]);

  // Calculate cell size to fit screen
  useEffect(() => {
    const config = configRef.current;
    if (!config) {
      // Pre-compute grid size to set initial cell size
      const gs = difficulty === "easy" ? 7 : difficulty === "medium" ? 9 : 11;
      const maxSize = Math.min(window.innerWidth - 32, window.innerHeight * 0.6);
      setCellSize(Math.floor(maxSize / gs));
    }
  }, [difficulty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const config = generateLevel(difficulty, seed);
    configRef.current = config;

    // Calculate responsive cell size
    const maxSize = Math.min(window.innerWidth - 32, window.innerHeight * 0.6);
    const cs = Math.floor(maxSize / config.gridSize);
    setCellSize(cs);

    const canvasSize = config.gridSize * cs;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const rng = createRNG(seed + 5000);
    rngRef.current = rng;

    let state = createStealthState(config);
    stateRef.current = state;
    let lastTime = 0;
    let animFrame = 0;
    let completed = false;
    let displayCounter = 0;

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("click", handleTap as unknown as EventListener);
    window.addEventListener("keydown", handleKeyDown);

    function gameLoop(timestamp: number) {
      if (lastTime === 0) {
        lastTime = timestamp;
        animFrame = requestAnimationFrame(gameLoop);
        return;
      }
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      state = stateRef.current!;
      state = tickStealth(state, dt, config, rng);
      stateRef.current = state;

      if ((state.caught || state.won) && !completed) {
        completed = true;
        const progress = config.startPos[0] > 0
          ? Math.round(((config.startPos[0] - state.furthestRow) / (config.startPos[0] - config.exitPos[0])) * 100)
          : 0;
        const score = state.won ? state.beatCount : 999;
        setStatus(state.won ? "won" : "caught");
        setDisplayBeats(state.beatCount);
        render(ctx, state, config, cs, rng);
        setTimeout(() => onCompleteRef.current(score, {
          won: state.won,
          caught: state.caught,
          progress,
          beats: state.beatCount,
        }), 1500);
        return;
      }

      displayCounter++;
      if (displayCounter >= 6) {
        displayCounter = 0;
        setDisplayBeats(state.beatCount);
        setCloseCalls(state.closeCalls);
      }

      render(ctx, state, config, cs, rng);
      animFrame = requestAnimationFrame(gameLoop);
    }

    animFrame = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrame);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("click", handleTap as unknown as EventListener);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [seed, difficulty, handleTap, handleKeyDown, handlePointerDown, handlePointerUp]);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3">
      {/* Beat counter and status */}
      <div className="flex items-center gap-3">
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Beats: <span className="font-bold text-gold">{displayBeats}</span>
        </span>
        {closeCalls > 0 && (
          <span className="rounded bg-yellow-900/30 px-2 py-1 text-xs text-yellow-400">
            Close calls: {closeCalls}
          </span>
        )}
        {status === "won" && (
          <span className="rounded bg-green-900/30 px-3 py-1 text-sm font-bold text-green-400">
            Escaped!
          </span>
        )}
        {status === "caught" && (
          <span className="rounded bg-red-600/20 px-3 py-1 text-sm font-bold text-red-400">
            Detected!
          </span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-border touch-none"
        style={{ maxWidth: "100%", maxHeight: "65vh" }}
      />

      {/* Controls hint */}
      <p className="text-xs text-gray-500">
        WASD / Arrows / Tap adjacent cells / Swipe to move. Avoid vision cones. Reach the gold exit!
      </p>
    </div>
  );
}

function render(
  ctx: CanvasRenderingContext2D,
  state: StealthState,
  config: StealthConfig,
  cs: number,
  rng: ReturnType<typeof createRNG>
) {
  const gs = config.gridSize;
  const w = gs * cs;

  // Background
  ctx.fillStyle = "#0d0d14";
  ctx.fillRect(0, 0, w, w);

  // Grid lines
  ctx.strokeStyle = "#15151f";
  ctx.lineWidth = 1;
  for (let i = 0; i <= gs; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cs, 0);
    ctx.lineTo(i * cs, w);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cs);
    ctx.lineTo(w, i * cs);
    ctx.stroke();
  }

  // Draw cells
  for (let r = 0; r < gs; r++) {
    for (let c = 0; c < gs; c++) {
      const cell = config.grid[r][c];
      const x = c * cs;
      const y = r * cs;

      if (cell === "wall") {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        // Subtle border
        ctx.strokeStyle = "#252540";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);
      } else if (cell === "cover") {
        // Cover: dark blue-purple with diagonal stripes
        ctx.fillStyle = "#161630";
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        // Diagonal stripes
        ctx.strokeStyle = "#222250";
        ctx.lineWidth = 1;
        for (let d = -cs; d < cs; d += 6) {
          ctx.beginPath();
          ctx.moveTo(x + 1 + d, y + 1);
          ctx.lineTo(x + 1 + d + cs, y + cs - 1);
          ctx.stroke();
        }
      }
    }
  }

  // Patrol path indicators (faint dotted lines)
  for (const g of state.guards) {
    if (g.type === "patrol" && g.patrolPath.length >= 2) {
      ctx.strokeStyle = "rgba(155, 89, 182, 0.12)";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      const [startR, startC] = g.patrolPath[0];
      ctx.moveTo(startC * cs + cs / 2, startR * cs + cs / 2);
      for (let i = 1; i < g.patrolPath.length; i++) {
        const [pr, pc] = g.patrolPath[i];
        ctx.lineTo(pc * cs + cs / 2, pr * cs + cs / 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Beat progress / warning flash
  const beatProgress = state.beatTimer / config.beatInterval;
  const warningWindow = state.warningFlashDuration / config.beatInterval;

  // Warning flash: show next-beat danger zones
  if (beatProgress < warningWindow && !state.caught && !state.won) {
    const nextCells = getNextBeatVisionCells(state, config, rng);
    ctx.fillStyle = "rgba(230, 180, 50, 0.15)";
    for (const key of nextCells) {
      const [r, c] = key.split(",").map(Number);
      ctx.fillRect(c * cs + 2, r * cs + 2, cs - 4, cs - 4);
    }
  }

  // Vision cones
  for (const g of state.guards) {
    const cone = getVisionCone(g, config);
    const color = g.type === "erratic"
      ? "rgba(231, 76, 60, 0.18)"
      : "rgba(155, 89, 182, 0.18)";
    ctx.fillStyle = color;
    for (const [cr, cc] of cone) {
      ctx.fillRect(cc * cs + 2, cr * cs + 2, cs - 4, cs - 4);
    }
  }

  // Guards
  for (const g of state.guards) {
    const cx = g.col * cs + cs / 2;
    const cy = g.row * cs + cs / 2;
    const guardColor = GUARD_COLORS[g.type];

    // Body
    ctx.fillStyle = guardColor;
    ctx.beginPath();
    ctx.arc(cx, cy, cs / 3, 0, Math.PI * 2);
    ctx.fill();

    // Facing arrow
    const [dx, dy] = DIR_OFFSETS[g.facing];
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dy * cs * 0.35, cy + dx * cs * 0.35);
    ctx.stroke();

    // Small dot for type indicator
    if (g.type === "rotating") {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (g.type === "erratic") {
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${cs / 4}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", cx, cy);
    }
  }

  // Exit glow
  {
    const ex = config.exitPos[1] * cs + cs / 2;
    const ey = config.exitPos[0] * cs + cs / 2;
    ctx.save();
    ctx.shadowColor = "#e5c07b";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#e5c07b";
    ctx.fillRect(config.exitPos[1] * cs + cs / 4, config.exitPos[0] * cs + cs / 4, cs / 2, cs / 2);
    // Second pass for stronger glow
    ctx.fillRect(config.exitPos[1] * cs + cs / 4, config.exitPos[0] * cs + cs / 4, cs / 2, cs / 2);
    ctx.restore();
  }

  // Start indicator
  {
    ctx.fillStyle = "rgba(97, 175, 239, 0.15)";
    ctx.fillRect(config.startPos[1] * cs + 2, config.startPos[0] * cs + 2, cs - 4, cs - 4);
  }

  // Player
  if (!state.caught) {
    const px = state.playerCol * cs + cs / 2;
    const py = state.playerRow * cs + cs / 2;

    // Outer glow
    ctx.fillStyle = "rgba(97, 175, 239, 0.2)";
    ctx.beginPath();
    ctx.arc(px, py, cs / 3, 0, Math.PI * 2);
    ctx.fill();

    // Player circle
    ctx.fillStyle = "#61afef";
    ctx.beginPath();
    ctx.arc(px, py, cs / 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const px = state.playerCol * cs + cs / 2;
    const py = state.playerRow * cs + cs / 2;
    ctx.fillStyle = "#ef4444";
    ctx.font = `bold ${cs / 2}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", px, py);
  }

  // Beat pulse effect
  if (beatProgress > 0.92) {
    const pulseAlpha = (1 - beatProgress) / 0.08 * 0.08;
    ctx.fillStyle = `rgba(229, 192, 123, ${pulseAlpha})`;
    ctx.fillRect(0, 0, w, w);
  }

  // Beat timer bar at top
  {
    const barH = 3;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, w, barH);
    ctx.fillStyle = beatProgress < 0.2 ? "#ef4444" : "#e5c07b";
    ctx.fillRect(0, 0, w * beatProgress, barH);
  }

  // Close call flash
  if (state.closeCalls > 0 && !state.caught) {
    // Brief red border flash — we use a persistent indicator instead
  }

  // Status overlays
  if (state.won) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, w, w);
    ctx.save();
    ctx.shadowColor = "#98c379";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#98c379";
    ctx.font = `bold ${Math.floor(cs * 1.2)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ESCAPED!", w / 2, w / 2);
    ctx.restore();
  }
  if (state.caught) {
    ctx.fillStyle = "rgba(40, 0, 0, 0.6)";
    ctx.fillRect(0, 0, w, w);
    ctx.save();
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ef4444";
    ctx.font = `bold ${Math.floor(cs * 1.2)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DETECTED!", w / 2, w / 2);
    ctx.restore();
  }
}
