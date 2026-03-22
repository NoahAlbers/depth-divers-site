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
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
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
  const stateRef = useRef<GameState>(createInitialState());
  const rngRef = useRef(createRNG(seed));
  const configRef = useRef(getDifficultyConfig(difficulty));
  const inputRef = useRef({ targetX: GAME_WIDTH / 2 });
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(0);
  const completedRef = useRef(false);
  const [displayTime, setDisplayTime] = useState(0);
  const [dead, setDead] = useState(false);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    inputRef.current.targetX = Math.max(0, Math.min(GAME_WIDTH, (e.clientX - rect.left) * scaleX));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const step = 18;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      inputRef.current.targetX = Math.max(0, inputRef.current.targetX - step);
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      inputRef.current.targetX = Math.min(GAME_WIDTH, inputRef.current.targetX + step);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);

    stateRef.current = createInitialState();
    rngRef.current = createRNG(seed);
    configRef.current = getDifficultyConfig(difficulty);
    accumulatorRef.current = 0;
    lastTimeRef.current = 0;
    completedRef.current = false;

    const ctx = canvas.getContext("2d")!;

    function gameLoop(timestamp: number) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        animFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const delta = Math.min(timestamp - lastTimeRef.current, 100); // cap to prevent spiral
      lastTimeRef.current = timestamp;
      accumulatorRef.current += delta;

      // Fixed timestep simulation
      while (accumulatorRef.current >= TICK_RATE) {
        stateRef.current = tick(
          stateRef.current,
          inputRef.current,
          rngRef.current,
          configRef.current
        );
        accumulatorRef.current -= TICK_RATE;

        if (!stateRef.current.alive && !completedRef.current) {
          completedRef.current = true;
          const finalScore = Math.round(stateRef.current.survivalTime * 10) / 10;
          setDead(true);
          setDisplayTime(finalScore);
          render(ctx, stateRef.current);
          setTimeout(() => onComplete(finalScore), 1500);
          return;
        }
      }

      setDisplayTime(Math.round(stateRef.current.survivalTime * 10) / 10);
      render(ctx, stateRef.current);
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [seed, difficulty, onComplete, handlePointerMove, handleKeyDown]);

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
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, "#080810");
  grad.addColorStop(0.4, "#0d1117");
  grad.addColorStop(1, "#101820");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Parallax cave texture (distant layer)
  ctx.strokeStyle = "#141820";
  ctx.lineWidth = 1;
  const parallaxOffset = (state.survivalTime * 5) % 40;
  for (let x = -20; x < GAME_WIDTH + 20; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + parallaxOffset, 0);
    ctx.lineTo(x + 15 + parallaxOffset, GAME_HEIGHT);
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
    // Death effect
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
  ctx.fillText(`×${state.speedMultiplier.toFixed(1)}`, 10, 34);
}

function renderObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  ctx.save();

  if (o.type === "stalactite") {
    // Pointed rock shape
    ctx.fillStyle = "#3a3050";
    ctx.beginPath();
    ctx.moveTo(o.x - o.width / 2, o.y);
    ctx.lineTo(o.x + o.width / 2, o.y);
    ctx.lineTo(o.x + o.width / 4, o.y + o.height * 0.7);
    ctx.lineTo(o.x, o.y + o.height);
    ctx.lineTo(o.x - o.width / 4, o.y + o.height * 0.7);
    ctx.closePath();
    ctx.fill();
    // Glow edge
    ctx.strokeStyle = "rgba(198, 120, 221, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (o.type === "bolt") {
    // Glowing energy bolt
    ctx.shadowColor = "#c678dd";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#c678dd";
    ctx.beginPath();
    ctx.arc(o.x, o.y + o.height / 2, o.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // Wide cave debris
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(o.x - o.width / 2, o.y, o.width, o.height);
    ctx.strokeStyle = "rgba(100, 100, 120, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(o.x - o.width / 2, o.y, o.width, o.height);
  }

  ctx.restore();
}

function renderPlayer(ctx: CanvasRenderingContext2D, px: number) {
  // Head
  ctx.fillStyle = "#e5c07b";
  ctx.beginPath();
  ctx.arc(px, PLAYER_Y + 7, 7, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = "#d19a66";
  ctx.fillRect(px - 5, PLAYER_Y + 14, 10, 14);

  // Cloak
  ctx.fillStyle = "rgba(97, 175, 239, 0.4)";
  ctx.beginPath();
  ctx.moveTo(px - PLAYER_WIDTH / 2 + 2, PLAYER_Y + 12);
  ctx.lineTo(px + PLAYER_WIDTH / 2 - 2, PLAYER_Y + 12);
  ctx.lineTo(px + PLAYER_WIDTH / 2 - 4, PLAYER_Y + PLAYER_HEIGHT);
  ctx.lineTo(px - PLAYER_WIDTH / 2 + 4, PLAYER_Y + PLAYER_HEIGHT);
  ctx.closePath();
  ctx.fill();

  // Legs
  ctx.fillStyle = "#888";
  ctx.fillRect(px - 4, PLAYER_Y + 28, 3, 8);
  ctx.fillRect(px + 1, PLAYER_Y + 28, 3, 8);
}
