"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createRNG } from "@/lib/games/seeded-random";
import {
  generateLevel,
  placePipe,
  tickArcaneConduit,
  getWarningCells,
  getExitDirection,
  type ArcaneConduitState,
  type PipeType,
  type FlowHead,
} from "@/lib/games/arcane-conduit";

interface ArcaneConduitProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  config?: Record<string, unknown>;
}

// Pipe rendering: which lines to draw for each pipe type
// Each connection is from center to edge in a direction (0=up, 1=right, 2=down, 3=left)
const PIPE_DRAW_DIRS: Record<PipeType, number[]> = {
  horizontal: [1, 3],
  vertical: [0, 2],
  "corner-dr": [0, 1],
  "corner-dl": [0, 3],
  "corner-ur": [2, 1],
  "corner-ul": [2, 3],
  cross: [0, 1, 2, 3],
};

const DIR_OFFSETS = [
  [0, -0.5], // up: center → top
  [0.5, 0],  // right: center → right
  [0, 0.5],  // down: center → bottom
  [-0.5, 0], // left: center → left
];

export function ArcaneConduit({
  seed,
  difficulty,
  timeLimit,
  onComplete,
  config = {},
}: ArcaneConduitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const stateRef = useRef<ArcaneConduitState | null>(null);
  const rngRef = useRef<ReturnType<typeof createRNG> | null>(null);
  const [displayState, setDisplayState] = useState({
    score: 0,
    segments: 0,
    minSegments: 10,
    delayTimer: 0,
    gameOver: false,
    penalties: 0,
    queue: [] as PipeType[],
    flowActive: false,
  });
  const [status, setStatus] = useState<"playing" | "overflow" | "complete">("playing");
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [cellSize, setCellSize] = useState(40);

  // Multi-round state
  const rounds = Number(config.rounds) || 1;
  const [currentRound, setCurrentRound] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [showingScoreboard, setShowingScoreboard] = useState(false);

  const effectiveTimeLimit = Number(config.timeLimit) || timeLimit || 0;
  const [elapsedTime, setElapsedTime] = useState(0);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const state = stateRef.current;
      const rng = rngRef.current;
      if (!state || !rng || state.gameOver || showingScoreboard) return;

      stateRef.current = placePipe(state, row, col, rng);
    },
    [showingScoreboard]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const state = stateRef.current;
      if (!canvas || !state) return;

      const rect = canvas.getBoundingClientRect();
      const queueWidth = cellSize * 2;
      const x = (e.clientX - rect.left) * (canvas.width / rect.width) - queueWidth;
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < state.gridSize && col >= 0 && col < state.gridSize) {
        handleCellClick(row, col);
      }
    },
    [cellSize, handleCellClick]
  );

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const state = stateRef.current;
      if (!canvas || !state) return;

      const rect = canvas.getBoundingClientRect();
      const queueWidth = cellSize * 2;
      const x = (e.clientX - rect.left) * (canvas.width / rect.width) - queueWidth;
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row >= 0 && row < state.gridSize && col >= 0 && col < state.gridSize) {
        setHoverCell([row, col]);
      } else {
        setHoverCell(null);
      }
    },
    [cellSize]
  );

  // Initialize round
  const initRound = useCallback(
    (roundNum: number) => {
      const roundSeed = seed + roundNum * 1000;
      const queueSize = 5;
      const state = generateLevel(roundSeed, difficulty, queueSize);
      stateRef.current = state;
      rngRef.current = createRNG(roundSeed + 999);
      setStatus("playing");
      setElapsedTime(0);
      setDisplayState({
        score: state.score,
        segments: state.segmentCount,
        minSegments: state.minSegments,
        delayTimer: state.delayTimer,
        gameOver: false,
        penalties: state.penalties,
        queue: [...state.queue],
        flowActive: false,
      });
    },
    [seed, difficulty]
  );

  useEffect(() => {
    initRound(currentRound);
  }, [currentRound, initRound]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const state = stateRef.current;
    if (!state) return;

    const queueWidth = cellSize * 2;
    const gridPixels = state.gridSize * cellSize;
    canvas.width = gridPixels + queueWidth;
    canvas.height = gridPixels;

    let lastTime = 0;
    let animFrame = 0;
    let completed = false;
    let frameCount = 0;
    let elapsed = 0;

    function gameLoop(timestamp: number) {
      if (lastTime === 0) {
        lastTime = timestamp;
        animFrame = requestAnimationFrame(gameLoop);
        return;
      }
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;
      elapsed += dt;

      let s = stateRef.current!;
      const rng = rngRef.current!;

      // Time limit check
      if (effectiveTimeLimit > 0 && elapsed >= effectiveTimeLimit && !s.gameOver) {
        s = { ...s, gameOver: true };
        stateRef.current = s;
      }

      if (!s.gameOver) {
        s = tickArcaneConduit(s, dt, rng);
        stateRef.current = s;
      }

      // Game over detection
      if (s.gameOver && !completed) {
        completed = true;
        const isComplete = s.segmentCount >= s.minSegments;
        setStatus(isComplete ? "complete" : "overflow");

        // Handle multi-round
        setTimeout(() => {
          const newScores = [...roundScores, s.score];
          setRoundScores(newScores);

          if (currentRound + 1 < rounds) {
            // Show scoreboard then advance
            setShowingScoreboard(true);
            setTimeout(() => {
              setShowingScoreboard(false);
              setCurrentRound((r) => r + 1);
            }, 4000);
          } else {
            // Final round complete
            const totalScore = newScores.reduce((a, b) => a + b, 0);
            onCompleteRef.current(totalScore, {
              rounds: newScores.length,
              perRoundScores: newScores,
              segments: s.segmentCount,
              complete: s.segmentCount >= s.minSegments,
              penalties: s.penalties,
              reachedEndCrystal: s.reachedEndCrystal,
            });
          }
        }, 1500);
      }

      // Update display periodically
      frameCount++;
      if (frameCount % 6 === 0) {
        setDisplayState({
          score: s.score,
          segments: s.segmentCount,
          minSegments: s.minSegments,
          delayTimer: Math.max(0, s.delayTimer),
          gameOver: s.gameOver,
          penalties: s.penalties,
          queue: [...s.queue],
          flowActive: s.flowActive,
        });
        setElapsedTime(elapsed);
      }

      render(ctx, s, cellSize, queueWidth, hoverCell);
      animFrame = requestAnimationFrame(gameLoop);
    }

    animFrame = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSize, currentRound, effectiveTimeLimit]);

  // Responsive cell size
  useEffect(() => {
    const gs = difficulty === "easy" ? 7 : difficulty === "medium" ? 9 : 10;
    const maxSize = Math.min(window.innerWidth - 32, window.innerHeight * 0.6);
    const cs = Math.floor((maxSize - 80) / gs); // subtract queue width
    setCellSize(Math.max(28, Math.min(cs, 50)));
  }, [difficulty]);

  if (showingScoreboard) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="font-cinzel text-xl font-bold text-gold">
          Round {currentRound + 1} Complete!
        </h2>
        <div className="rounded border border-border bg-surface p-4">
          {roundScores.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-400">Round {i + 1}</span>
              <span className="font-bold text-gold">{s} pts</span>
            </div>
          ))}
          <div className="mt-2 border-t border-gray-700 pt-2 flex items-center justify-between gap-4 text-sm font-bold">
            <span className="text-gray-300">Total</span>
            <span className="text-gold">{roundScores.reduce((a, b) => a + b, 0)} pts</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">Next round starting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Score: <span className="font-bold text-gold">{displayState.score}</span>
        </span>
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Segments: <span className={`font-bold ${displayState.segments >= displayState.minSegments ? "text-green-400" : "text-white"}`}>
            {displayState.segments}/{displayState.minSegments}
          </span>
        </span>
        {!displayState.flowActive && displayState.delayTimer > 0 && (
          <span className="rounded bg-purple-900/30 px-3 py-1 text-sm font-bold text-purple-300">
            Flow in {Math.ceil(displayState.delayTimer)}s
          </span>
        )}
        {displayState.flowActive && (
          <span className="rounded bg-green-900/30 px-2 py-1 text-[10px] text-green-400">FLOWING</span>
        )}
        {effectiveTimeLimit > 0 && (
          <span className="rounded bg-surface px-2 py-1 text-xs text-gray-400">
            {Math.max(0, Math.ceil(effectiveTimeLimit - elapsedTime))}s left
          </span>
        )}
        {rounds > 1 && (
          <span className="rounded bg-gray-800 px-2 py-1 text-[10px] text-gray-400">
            Round {currentRound + 1}/{rounds}
          </span>
        )}
        {status === "overflow" && (
          <span className="rounded bg-red-600/20 px-3 py-1 text-sm font-bold text-red-400">Overflow!</span>
        )}
        {status === "complete" && (
          <span className="rounded bg-green-900/30 px-3 py-1 text-sm font-bold text-green-400">Complete!</span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-border touch-none"
        style={{ maxWidth: "100%", maxHeight: "65vh" }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        onMouseLeave={() => setHoverCell(null)}
      />

      <p className="text-xs text-gray-500">
        Tap/click a cell to place the next pipe piece. Build ahead of the flow!
      </p>
    </div>
  );
}

// ===== RENDERING =====

function render(
  ctx: CanvasRenderingContext2D,
  state: ArcaneConduitState,
  cs: number,
  queueWidth: number,
  hoverCell: [number, number] | null,
) {
  const gs = state.gridSize;
  const gridW = gs * cs;
  const totalW = gridW + queueWidth;
  const totalH = gridW;

  // Background
  ctx.fillStyle = "#0d0d14";
  ctx.fillRect(0, 0, totalW, totalH);

  // ===== QUEUE (left side) =====
  ctx.fillStyle = "#111120";
  ctx.fillRect(0, 0, queueWidth, totalH);

  // Queue label
  ctx.fillStyle = "#666";
  ctx.font = `bold ${Math.floor(cs / 3.5)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("NEXT", queueWidth / 2, cs / 2);

  // Queue pipes
  for (let i = 0; i < state.queue.length; i++) {
    const pipe = state.queue[i];
    const x = queueWidth / 2;
    const y = cs * (i + 1) + cs / 2;
    const size = i === 0 ? cs * 0.7 : cs * 0.5;

    // Highlight first piece
    if (i === 0) {
      ctx.strokeStyle = "#e5c07b";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - size / 2 - 4, y - size / 2 - 4, size + 8, size + 8);
    }

    drawPipePreview(ctx, pipe, x, y, size, i === 0 ? "#c678dd" : "#4a4a6a");
  }

  // ===== GRID =====
  const ox = queueWidth; // offset for grid

  // Grid background
  ctx.fillStyle = "#12121e";
  ctx.fillRect(ox, 0, gridW, gridW);

  // Grid lines
  ctx.strokeStyle = "#1a1a28";
  ctx.lineWidth = 1;
  for (let i = 0; i <= gs; i++) {
    ctx.beginPath();
    ctx.moveTo(ox + i * cs, 0);
    ctx.lineTo(ox + i * cs, gridW);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox, i * cs);
    ctx.lineTo(ox + gridW, i * cs);
    ctx.stroke();
  }

  // Warning cells
  const warnings = getWarningCells(state);
  for (const [wr, wc] of warnings) {
    if (wr >= 0 && wr < gs && wc >= 0 && wc < gs) {
      ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + Math.sin(Date.now() / 200) * 0.1})`;
      ctx.fillRect(ox + wc * cs + 1, wr * cs + 1, cs - 2, cs - 2);
    }
  }

  // Draw cells
  for (let r = 0; r < gs; r++) {
    for (let c = 0; c < gs; c++) {
      const cell = state.grid[r][c];
      const x = ox + c * cs;
      const y = r * cs;

      // Special cell backgrounds
      if (cell.state === "blocked") {
        ctx.fillStyle = "#1a1a2a";
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        // Cracked pattern
        ctx.strokeStyle = "#252538";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + cs * 0.3, y + cs * 0.2);
        ctx.lineTo(x + cs * 0.5, y + cs * 0.5);
        ctx.lineTo(x + cs * 0.7, y + cs * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + cs * 0.4, y + cs * 0.6);
        ctx.lineTo(x + cs * 0.6, y + cs * 0.8);
        ctx.stroke();
      } else if (cell.state === "reservoir") {
        ctx.fillStyle = "#0f1a2a";
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        // Glowing pool
        ctx.fillStyle = "rgba(100, 150, 255, 0.1)";
        ctx.fillRect(x + 3, y + 3, cs - 6, cs - 6);
      } else if (cell.state === "source") {
        // Source crystal
        ctx.save();
        ctx.shadowColor = "#c678dd";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#c678dd";
        const cx = x + cs / 2;
        const cy = y + cs / 2;
        drawDiamond(ctx, cx, cy, cs / 3);
        ctx.restore();
        // Arrow showing flow direction
        const [adx, ady] = DIR_OFFSETS[state.sourceExitDir];
        ctx.strokeStyle = "rgba(198, 120, 221, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + adx * cs * 0.8, cy + ady * cs * 0.8);
        ctx.stroke();
      } else if (cell.state === "end-crystal") {
        // End crystal
        ctx.save();
        ctx.shadowColor = "#61afef";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#61afef";
        drawDiamond(ctx, x + cs / 2, y + cs / 2, cs / 3);
        ctx.restore();
      }

      // Draw pipe
      if (cell.pipe) {
        const pipeColor = cell.flowFilled
          ? (cell.flowProgress >= 1 ? "#e5c07b" : "#c678dd")
          : "#4a4a6a";
        drawPipe(ctx, cell.pipe, x + cs / 2, y + cs / 2, cs, pipeColor);

        // Flow fill animation
        if (cell.flowFilled && cell.flowProgress < 1) {
          ctx.fillStyle = `rgba(229, 192, 123, ${0.3 * cell.flowProgress})`;
          ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
        }
      }
    }
  }

  // Ghost preview on hover
  if (hoverCell && state.queue.length > 0 && !state.gameOver) {
    const [hr, hc] = hoverCell;
    const cell = state.grid[hr][hc];
    if (cell.state !== "blocked" && cell.state !== "source" && cell.state !== "end-crystal" && !cell.locked) {
      const x = ox + hc * cs + cs / 2;
      const y = hr * cs + cs / 2;
      ctx.globalAlpha = 0.3;
      drawPipe(ctx, state.queue[0], x, y, cs, "#c678dd");
      ctx.globalAlpha = 1;
    }
  }

  // Game over overlay
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(ox, 0, gridW, gridW);

    const isComplete = state.segmentCount >= state.minSegments;
    if (isComplete) {
      ctx.save();
      ctx.shadowColor = "#98c379";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#98c379";
      ctx.font = `bold ${Math.floor(cs * 1.1)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("COMPLETE!", ox + gridW / 2, gridW / 2 - 10);
      ctx.restore();
    } else {
      ctx.save();
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ef4444";
      ctx.font = `bold ${Math.floor(cs * 1.1)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("OVERFLOW!", ox + gridW / 2, gridW / 2 - 10);
      ctx.restore();
    }

    ctx.fillStyle = "#ccc";
    ctx.font = `${Math.floor(cs * 0.5)}px monospace`;
    ctx.fillText(
      `${state.segmentCount} segments | ${state.score} pts`,
      ox + gridW / 2,
      gridW / 2 + cs * 0.8
    );
  }
}

// ===== DRAW HELPERS =====

function drawPipe(
  ctx: CanvasRenderingContext2D,
  pipe: PipeType,
  cx: number,
  cy: number,
  cs: number,
  color: string
) {
  const dirs = PIPE_DRAW_DIRS[pipe];
  const lineWidth = cs / 4;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  // Center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, lineWidth / 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Lines from center to edges
  for (const dir of dirs) {
    const [dx, dy] = DIR_OFFSETS[dir];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * cs * 0.9, cy + dy * cs * 0.9);
    ctx.stroke();
  }
}

function drawPipePreview(
  ctx: CanvasRenderingContext2D,
  pipe: PipeType,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  drawPipe(ctx, pipe, cx, cy, size, color);
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
  ctx.fill();
}
