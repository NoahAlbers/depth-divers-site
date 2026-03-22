"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  generateMaze,
  getMazeConfig,
  cellToPixel,
  checkWallCollision,
  GAME_WIDTH,
  GAME_HEIGHT,
  type MazeCell,
  type MazeConfig,
  type LockpickingState,
} from "@/lib/games/lockpicking";

interface LockpickingProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

export function Lockpicking({ seed, difficulty, timeLimit, onComplete }: LockpickingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [displayStrikes, setDisplayStrikes] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "failed">("playing");

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    // Offset upward so finger doesn't cover the pick on mobile
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY - 20;
    (canvas as unknown as { _targetX: number; _targetY: number })._targetX = x;
    (canvas as unknown as { _targetX: number; _targetY: number })._targetY = y;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const config = getMazeConfig(difficulty, seed);
    const maze = generateMaze(config.gridRows, config.gridCols, seed);

    // Start and exit positions
    const start = cellToPixel(Math.floor(config.gridRows / 2), 0, config);
    const exit = cellToPixel(Math.floor(config.gridRows / 2), config.gridCols - 1, config);

    const pickRadius = Math.max(3, config.corridorWidth / 4);

    let state: LockpickingState = {
      pickX: start.x + 10,
      pickY: start.y,
      startX: start.x,
      startY: start.y,
      exitX: exit.x,
      exitY: exit.y,
      strikes: 0,
      maxStrikes: 3,
      alive: true,
      won: false,
      startTime: Date.now(),
      elapsedTime: 0,
      strikeFlash: 0,
    };

    (canvas as unknown as { _targetX: number; _targetY: number })._targetX = state.pickX;
    (canvas as unknown as { _targetX: number; _targetY: number })._targetY = state.pickY;

    let lastColliding = false;
    let animFrame = 0;
    let lastTime = 0;
    let completed = false;
    let displayCounter = 0;

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerMove);

    function gameLoop(timestamp: number) {
      if (lastTime === 0) { lastTime = timestamp; animFrame = requestAnimationFrame(gameLoop); return; }
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      if (state.alive && !state.won) {
        state.elapsedTime = (Date.now() - state.startTime) / 1000;

        // Time limit check
        if (timeLimit > 0 && state.elapsedTime >= timeLimit) {
          state.alive = false;
        }

        // Move pick toward target
        const target = canvas as unknown as { _targetX: number; _targetY: number };
        const maxSpeed = 300 * dt;
        const dx = target._targetX - state.pickX;
        const dy = target._targetY - state.pickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxSpeed) {
          state.pickX += (dx / dist) * maxSpeed;
          state.pickY += (dy / dist) * maxSpeed;
        } else {
          state.pickX = target._targetX;
          state.pickY = target._targetY;
        }

        // Clamp
        state.pickX = Math.max(pickRadius, Math.min(GAME_WIDTH - pickRadius, state.pickX));
        state.pickY = Math.max(pickRadius, Math.min(GAME_HEIGHT - pickRadius, state.pickY));

        // Wall collision
        const colliding = checkWallCollision(state.pickX, state.pickY, pickRadius, maze, config);
        if (colliding && !lastColliding) {
          state.strikes++;
          state.strikeFlash = 0.3;
          if (state.strikes >= state.maxStrikes) {
            state.alive = false;
          }
        }
        lastColliding = colliding;

        // Strike flash decay
        if (state.strikeFlash > 0) state.strikeFlash = Math.max(0, state.strikeFlash - dt);

        // Check exit
        const exitDist = Math.sqrt(
          (state.pickX - state.exitX) ** 2 + (state.pickY - state.exitY) ** 2
        );
        if (exitDist < config.corridorWidth) {
          state.won = true;
        }
      }

      // Complete
      if ((state.won || !state.alive) && !completed) {
        completed = true;
        const score = Math.round(state.elapsedTime * 10) / 10;
        setGameStatus(state.won ? "won" : "failed");
        setDisplayTime(score);
        setDisplayStrikes(state.strikes);
        render(ctx, state, maze, config, pickRadius);
        setTimeout(() => onCompleteRef.current(score, { won: state.won, strikes: state.strikes }), 1500);
        return;
      }

      displayCounter++;
      if (displayCounter >= 10) {
        displayCounter = 0;
        setDisplayTime(Math.round(state.elapsedTime * 10) / 10);
        setDisplayStrikes(state.strikes);
      }

      render(ctx, state, maze, config, pickRadius);
      animFrame = requestAnimationFrame(gameLoop);
    }

    animFrame = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrame);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerMove);
    };
  }, [seed, difficulty, timeLimit, handlePointerMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Time: <span className="font-bold text-gold">{displayTime.toFixed(1)}s</span>
        </span>
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Strikes: <span className={`font-bold ${displayStrikes >= 2 ? "text-red-400" : "text-white"}`}>{displayStrikes}/3</span>
        </span>
        {gameStatus === "won" && <span className="rounded bg-green-900/30 px-3 py-1 text-sm font-bold text-green-400">Unlocked!</span>}
        {gameStatus === "failed" && <span className="rounded bg-red-600/20 px-3 py-1 text-sm font-bold text-red-400">Pick Broke!</span>}
      </div>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="max-w-full rounded-lg border border-border touch-none cursor-none"
        style={{ maxHeight: "65vh", aspectRatio: "1" }}
      />
      <p className="text-xs text-gray-500">
        Guide the pick to the exit. Don&apos;t touch the walls!
      </p>
    </div>
  );
}

function render(
  ctx: CanvasRenderingContext2D,
  state: LockpickingState,
  maze: MazeCell[][],
  config: MazeConfig,
  pickRadius: number
) {
  const cellW = GAME_WIDTH / config.gridCols;
  const cellH = GAME_HEIGHT / config.gridRows;

  // Background
  ctx.fillStyle = "#1a1a1e";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Maze walls
  const wallColor = state.strikeFlash > 0 ? "#8b4513" : "#6b5a3a";
  ctx.fillStyle = wallColor;

  for (let r = 0; r < config.gridRows; r++) {
    for (let c = 0; c < config.gridCols; c++) {
      const x = c * cellW;
      const y = r * cellH;
      const cell = maze[r][c];
      const wt = config.wallThickness;

      if (cell.walls.top) ctx.fillRect(x, y, cellW, wt);
      if (cell.walls.bottom) ctx.fillRect(x, y + cellH - wt, cellW, wt);
      if (cell.walls.left) ctx.fillRect(x, y, wt, cellH);
      if (cell.walls.right) ctx.fillRect(x + cellW - wt, y, wt, cellH);
    }
  }

  // Exit glow
  ctx.save();
  ctx.shadowColor = "#e5c07b";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#e5c07b";
  ctx.beginPath();
  ctx.arc(state.exitX, state.exitY, config.corridorWidth / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Pick
  if (state.alive) {
    ctx.save();
    ctx.shadowColor = state.strikeFlash > 0 ? "#ef4444" : "#e5c07b";
    ctx.shadowBlur = 8;
    ctx.fillStyle = state.strikeFlash > 0 ? "#ef4444" : "#e5c07b";
    ctx.beginPath();
    ctx.arc(state.pickX, state.pickY, pickRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Strike indicators
  for (let i = 0; i < state.maxStrikes; i++) {
    ctx.fillStyle = i < state.strikes ? "#ef4444" : "#333";
    ctx.beginPath();
    ctx.arc(15 + i * 18, 15, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Time
  ctx.fillStyle = "#e5c07b";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${state.elapsedTime.toFixed(1)}s`, GAME_WIDTH - 10, 18);
}
