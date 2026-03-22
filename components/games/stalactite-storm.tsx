"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createRNG } from "@/lib/games/seeded-random";
import {
  createInitialState,
  tick,
  getDifficultyConfig,
  TICK_RATE,
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_Y,
  type GameState,
  type Obstacle,
} from "@/lib/games/stalactite-storm";

interface StalactiteStormProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

export function StalactiteStorm({ seed, difficulty, onComplete }: StalactiteStormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayTime, setDisplayTime] = useState(0);
  const [dead, setDead] = useState(false);

  // Store onComplete in a ref so it doesn't cause the game loop to restart
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Store input in a ref — mutated by event handlers, read by game loop
  const inputRef = useRef({ targetX: GAME_WIDTH / 2 });

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    inputRef.current.targetX = Math.max(0, Math.min(GAME_WIDTH, (e.clientX - rect.left) * scaleX));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const step = 20;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      inputRef.current.targetX = Math.max(0, inputRef.current.targetX - step);
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      inputRef.current.targetX = Math.min(GAME_WIDTH, inputRef.current.targetX + step);
    }
  }, []);

  // The game loop effect — only depends on seed and difficulty (stable values)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    // Initialize game state (all local to this effect, no refs that cause re-runs)
    let gameState = createInitialState();
    const rng = createRNG(seed);
    const config = getDifficultyConfig(difficulty);
    let accumulator = 0;
    let lastTime = 0;
    let animFrame = 0;
    let completed = false;
    let displayUpdateCounter = 0;

    // Event listeners
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);

    function gameLoop(timestamp: number) {
      if (lastTime === 0) {
        lastTime = timestamp;
        animFrame = requestAnimationFrame(gameLoop);
        return;
      }

      const delta = Math.min(timestamp - lastTime, 100);
      lastTime = timestamp;
      accumulator += delta;

      // Fixed timestep simulation
      while (accumulator >= TICK_RATE) {
        gameState = tick(gameState, inputRef.current, rng, config);
        accumulator -= TICK_RATE;

        if (!gameState.alive && !completed) {
          completed = true;
          const finalScore = Math.round(gameState.survivalTime * 10) / 10;
          setDead(true);
          setDisplayTime(finalScore);
          render(ctx, gameState);
          setTimeout(() => onCompleteRef.current(finalScore), 1500);
          return;
        }
      }

      // Update React display time only every ~10 frames to avoid excessive re-renders
      displayUpdateCounter++;
      if (displayUpdateCounter >= 10) {
        displayUpdateCounter = 0;
        setDisplayTime(Math.round(gameState.survivalTime * 10) / 10);
      }

      render(ctx, gameState);
      animFrame = requestAnimationFrame(gameLoop);
    }

    animFrame = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrame);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [seed, difficulty, handlePointerMove, handleKeyDown]); // NO onComplete here

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Time:{" "}
          <span className={`font-bold ${dead ? "text-red-400" : "text-gold"}`}>
            {displayTime.toFixed(1)}s
          </span>
        </span>
        {dead && (
          <span className="rounded bg-red-600/20 px-3 py-1 text-sm font-bold text-red-400">
            Hit!
          </span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="max-w-full rounded-lg border border-border touch-none"
        style={{ maxHeight: "70vh", aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
      />
      <p className="text-xs text-gray-500">
        Dodge falling obstacles. Touch: drag. Keyboard: Arrow keys / A-D.
      </p>
    </div>
  );
}

function render(ctx: CanvasRenderingContext2D, state: GameState) {
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, "#080810");
  grad.addColorStop(0.4, "#0d1117");
  grad.addColorStop(1, "#101820");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Parallax lines
  ctx.strokeStyle = "#141820";
  ctx.lineWidth = 1;
  const offset = (state.survivalTime * 5) % 40;
  for (let x = -20; x < GAME_WIDTH + 20; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + offset, 0);
    ctx.lineTo(x + 15 + offset, GAME_HEIGHT);
    ctx.stroke();
  }

  // Ground
  ctx.fillStyle = "#161b22";
  ctx.fillRect(0, GAME_HEIGHT - 15, GAME_WIDTH, 15);

  // Obstacles
  for (const o of state.obstacles) {
    renderObstacle(ctx, o);
  }

  // Player
  if (state.alive) {
    renderPlayer(ctx, state.playerX);
  } else {
    ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
    ctx.beginPath();
    ctx.arc(state.playerX, PLAYER_Y + PLAYER_HEIGHT / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("✕", state.playerX, PLAYER_Y + PLAYER_HEIGHT / 2 + 8);
  }

  // HUD
  ctx.fillStyle = "#e5c07b";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`${state.survivalTime.toFixed(1)}s`, 10, 20);
  ctx.fillStyle = "#666";
  ctx.font = "10px monospace";
  ctx.fillText(`x${state.speedMultiplier.toFixed(1)}`, 10, 34);
}

function renderObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  if (o.type === "stalactite") {
    ctx.fillStyle = "#3a3050";
    ctx.beginPath();
    ctx.moveTo(o.x - o.width / 2, o.y);
    ctx.lineTo(o.x + o.width / 2, o.y);
    ctx.lineTo(o.x + o.width / 4, o.y + o.height * 0.7);
    ctx.lineTo(o.x, o.y + o.height);
    ctx.lineTo(o.x - o.width / 4, o.y + o.height * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(198, 120, 221, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (o.type === "bolt") {
    ctx.save();
    ctx.shadowColor = "#c678dd";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#c678dd";
    ctx.beginPath();
    ctx.arc(o.x, o.y + o.height / 2, o.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(o.x - o.width / 2, o.y, o.width, o.height);
    ctx.strokeStyle = "rgba(100, 100, 120, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(o.x - o.width / 2, o.y, o.width, o.height);
  }
}

function renderPlayer(ctx: CanvasRenderingContext2D, px: number) {
  ctx.fillStyle = "#e5c07b";
  ctx.beginPath();
  ctx.arc(px, PLAYER_Y + 7, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#d19a66";
  ctx.fillRect(px - 5, PLAYER_Y + 14, 10, 14);

  ctx.fillStyle = "rgba(97, 175, 239, 0.4)";
  ctx.beginPath();
  ctx.moveTo(px - PLAYER_WIDTH / 2 + 2, PLAYER_Y + 12);
  ctx.lineTo(px + PLAYER_WIDTH / 2 - 2, PLAYER_Y + 12);
  ctx.lineTo(px + PLAYER_WIDTH / 2 - 4, PLAYER_Y + PLAYER_HEIGHT);
  ctx.lineTo(px - PLAYER_WIDTH / 2 + 4, PLAYER_Y + PLAYER_HEIGHT);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#888";
  ctx.fillRect(px - 4, PLAYER_Y + 28, 3, 8);
  ctx.fillRect(px + 1, PLAYER_Y + 28, 3, 8);
}
