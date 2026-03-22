"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createRNG } from "@/lib/games/seeded-random";
import {
  generateLevel,
  createStealthState,
  tickStealth,
  movePlayer,
  getVisionCone,
  type StealthConfig,
  type StealthState,
} from "@/lib/games/stealth-sequence";

interface StealthSequenceProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

export function StealthSequence({ seed, difficulty, onComplete }: StealthSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const configRef = useRef<StealthConfig | null>(null);
  const stateRef = useRef<StealthState | null>(null);
  const [displayBeats, setDisplayBeats] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "caught">("playing");

  const CELL_SIZE = 40;

  const handleTap = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    const config = configRef.current;
    const state = stateRef.current;
    if (!canvas || !config || !state) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = (config.gridSize * CELL_SIZE) / rect.width;
    const scaleY = (config.gridSize * CELL_SIZE) / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX / CELL_SIZE);
    const row = Math.floor((e.clientY - rect.top) * scaleY / CELL_SIZE);

    const dr = row - state.playerRow;
    const dc = col - state.playerCol;

    // Only allow adjacent moves (up/down/left/right)
    if (Math.abs(dr) + Math.abs(dc) === 1) {
      stateRef.current = movePlayer(state, dr, dc, config);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const config = configRef.current;
    const state = stateRef.current;
    if (!config || !state) return;

    let dr = 0, dc = 0;
    if (e.key === "ArrowUp" || e.key === "w") dr = -1;
    else if (e.key === "ArrowDown" || e.key === "s") dr = 1;
    else if (e.key === "ArrowLeft" || e.key === "a") dc = -1;
    else if (e.key === "ArrowRight" || e.key === "d") dc = 1;
    else return;

    e.preventDefault();
    stateRef.current = movePlayer(state, dr, dc, config);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const config = generateLevel(difficulty, seed);
    configRef.current = config;
    const canvasSize = config.gridSize * CELL_SIZE;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    let state = createStealthState(config);
    stateRef.current = state;
    const rng = createRNG(seed + 5000);
    let lastTime = 0;
    let animFrame = 0;
    let completed = false;
    let displayCounter = 0;

    canvas.addEventListener("pointerdown", handleTap);
    window.addEventListener("keydown", handleKeyDown);

    function gameLoop(timestamp: number) {
      if (lastTime === 0) { lastTime = timestamp; animFrame = requestAnimationFrame(gameLoop); return; }
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      state = stateRef.current!;
      state = tickStealth(state, dt, config, rng);
      stateRef.current = state;

      if ((state.caught || state.won) && !completed) {
        completed = true;
        const score = state.won ? state.beatCount : 999;
        setStatus(state.won ? "won" : "caught");
        setDisplayBeats(state.beatCount);
        render(ctx, state, config, CELL_SIZE);
        setTimeout(() => onCompleteRef.current(score, { won: state.won }), 1500);
        return;
      }

      displayCounter++;
      if (displayCounter >= 6) {
        displayCounter = 0;
        setDisplayBeats(state.beatCount);
      }

      render(ctx, state, config, CELL_SIZE);
      animFrame = requestAnimationFrame(gameLoop);
    }

    animFrame = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrame);
      canvas.removeEventListener("pointerdown", handleTap);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [seed, difficulty, handleTap, handleKeyDown]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Beats: <span className="font-bold text-gold">{displayBeats}</span>
        </span>
        {status === "won" && <span className="rounded bg-green-900/30 px-3 py-1 text-sm font-bold text-green-400">Escaped!</span>}
        {status === "caught" && <span className="rounded bg-red-600/20 px-3 py-1 text-sm font-bold text-red-400">Detected!</span>}
      </div>
      <canvas
        ref={canvasRef}
        className="max-w-full rounded-lg border border-border touch-none"
        style={{ maxHeight: "65vh", aspectRatio: "1" }}
      />
      <p className="text-xs text-gray-500">
        Tap adjacent cells to move. Avoid guard vision cones. Reach the gold exit!
      </p>
    </div>
  );
}

function render(ctx: CanvasRenderingContext2D, state: StealthState, config: StealthConfig, cs: number) {
  const gs = config.gridSize;

  // Background
  ctx.fillStyle = "#0d0d14";
  ctx.fillRect(0, 0, gs * cs, gs * cs);

  // Grid lines
  ctx.strokeStyle = "#1a1a24";
  ctx.lineWidth = 1;
  for (let i = 0; i <= gs; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cs, 0);
    ctx.lineTo(i * cs, gs * cs);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cs);
    ctx.lineTo(gs * cs, i * cs);
    ctx.stroke();
  }

  // Walls
  ctx.fillStyle = "#1a1a2a";
  for (const key of config.walls) {
    const [r, c] = key.split(",").map(Number);
    ctx.fillRect(c * cs + 1, r * cs + 1, cs - 2, cs - 2);
  }

  // Beat pulse
  const beatProgress = state.beatTimer / 1.5;
  if (beatProgress < 0.1) {
    ctx.fillStyle = `rgba(229, 192, 123, ${0.1 - beatProgress})`;
    ctx.fillRect(0, 0, gs * cs, gs * cs);
  }

  // Vision cones
  for (const g of state.guards) {
    const cone = getVisionCone(g, gs, config.walls);
    ctx.fillStyle = "rgba(198, 120, 221, 0.15)";
    for (const [cr, cc] of cone) {
      ctx.fillRect(cc * cs + 2, cr * cs + 2, cs - 4, cs - 4);
    }
  }

  // Guards
  for (const g of state.guards) {
    ctx.fillStyle = "#c678dd";
    ctx.beginPath();
    ctx.arc(g.col * cs + cs / 2, g.row * cs + cs / 2, cs / 3, 0, Math.PI * 2);
    ctx.fill();

    // Facing indicator
    const dirOff: Record<string, [number, number]> = {
      N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0],
    };
    const [dx, dy] = dirOff[g.facing];
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.col * cs + cs / 2, g.row * cs + cs / 2);
    ctx.lineTo(g.col * cs + cs / 2 + dx * cs / 3, g.row * cs + cs / 2 + dy * cs / 3);
    ctx.stroke();
  }

  // Exit
  ctx.save();
  ctx.shadowColor = "#e5c07b";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#e5c07b";
  ctx.fillRect(config.exitCol * cs + cs / 4, config.exitRow * cs + cs / 4, cs / 2, cs / 2);
  ctx.restore();

  // Player
  if (!state.caught) {
    ctx.fillStyle = "#61afef";
    ctx.beginPath();
    ctx.arc(state.playerCol * cs + cs / 2, state.playerRow * cs + cs / 2, cs / 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#ef4444";
    ctx.font = `bold ${cs / 2}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("!", state.playerCol * cs + cs / 2, state.playerRow * cs + cs / 2);
  }

  // Status overlay
  if (state.won) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, gs * cs, gs * cs);
    ctx.fillStyle = "#98c379";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("ESCAPED!", (gs * cs) / 2, (gs * cs) / 2);
  }
  if (state.caught) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, gs * cs, gs * cs);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("DETECTED!", (gs * cs) / 2, (gs * cs) / 2);
  }
}
