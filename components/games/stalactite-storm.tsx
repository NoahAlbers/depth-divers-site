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
} from "@/lib/games/stalactite-storm";

interface StalactiteStormProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

export function StalactiteStorm({
  seed,
  difficulty,
  onComplete,
}: StalactiteStormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const rngRef = useRef(createRNG(seed));
  const configRef = useRef(getDifficultyConfig(difficulty));
  const inputRef = useRef({ targetX: GAME_WIDTH / 2 });
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [dead, setDead] = useState(false);
  const completedRef = useRef(false);

  // Handle input
  const handlePointerMove = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    inputRef.current.targetX = Math.max(0, Math.min(GAME_WIDTH, x));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      inputRef.current.targetX = Math.max(0, inputRef.current.targetX - 20);
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      inputRef.current.targetX = Math.min(GAME_WIDTH, inputRef.current.targetX + 20);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerMove);
    window.addEventListener("keydown", handleKeyDown);

    // Reset state
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

      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;
      accumulatorRef.current += deltaTime;

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
          const finalScore =
            Math.round(stateRef.current.survivalTime * 10) / 10;
          setDead(true);
          setDisplayTime(finalScore);
          setTimeout(() => onComplete(finalScore), 1500);
          return;
        }
      }

      setDisplayTime(
        Math.round(stateRef.current.survivalTime * 10) / 10
      );

      // Render
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
        style={{
          maxHeight: "70vh",
          aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`,
          imageRendering: "pixelated",
        }}
      />

      <p className="text-xs text-gray-500">
        Move left/right to dodge. Touch: drag. Keyboard: Arrow keys or A/D.
      </p>
    </div>
  );
}

function render(ctx: CanvasRenderingContext2D, state: GameState) {
  // Background — dark cavern gradient
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, "#0a0a14");
  grad.addColorStop(0.5, "#0d1117");
  grad.addColorStop(1, "#121820");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Cave ceiling texture lines
  ctx.strokeStyle = "#1a1a2a";
  ctx.lineWidth = 1;
  for (let x = 0; x < GAME_WIDTH; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 10, 15);
    ctx.stroke();
  }

  // Ground line
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, GAME_HEIGHT - 20, GAME_WIDTH, 20);

  // Stalactites
  for (const s of state.stalactites) {
    // Glow
    ctx.shadowColor = "#c678dd";
    ctx.shadowBlur = 8;

    // Main body
    ctx.fillStyle = "#4a3a5e";
    ctx.beginPath();
    ctx.moveTo(s.x - s.width / 2, s.y);
    ctx.lineTo(s.x + s.width / 2, s.y);
    ctx.lineTo(s.x + s.width / 4, s.y + s.height * 0.7);
    ctx.lineTo(s.x, s.y + s.height);
    ctx.lineTo(s.x - s.width / 4, s.y + s.height * 0.7);
    ctx.closePath();
    ctx.fill();

    // Highlight
    ctx.fillStyle = "#c678dd40";
    ctx.beginPath();
    ctx.moveTo(s.x - s.width / 4, s.y);
    ctx.lineTo(s.x, s.y);
    ctx.lineTo(s.x - s.width / 8, s.y + s.height * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  // Player
  const px = state.playerX;
  const py = PLAYER_Y;

  if (state.alive) {
    // Body
    ctx.fillStyle = "#e5c07b";
    ctx.fillRect(
      px - PLAYER_WIDTH / 2 + 5,
      py + 10,
      PLAYER_WIDTH - 10,
      PLAYER_HEIGHT - 15
    );

    // Head
    ctx.beginPath();
    ctx.arc(px, py + 8, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#e5c07b";
    ctx.fill();

    // Cloak
    ctx.fillStyle = "#d19a6680";
    ctx.beginPath();
    ctx.moveTo(px - PLAYER_WIDTH / 2, py + 12);
    ctx.lineTo(px + PLAYER_WIDTH / 2, py + 12);
    ctx.lineTo(px + PLAYER_WIDTH / 2 - 3, py + PLAYER_HEIGHT);
    ctx.lineTo(px - PLAYER_WIDTH / 2 + 3, py + PLAYER_HEIGHT);
    ctx.closePath();
    ctx.fill();
  } else {
    // Death flash
    ctx.fillStyle = "#ef444480";
    ctx.beginPath();
    ctx.arc(px, py + PLAYER_HEIGHT / 2, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("X", px, py + PLAYER_HEIGHT / 2 + 7);
  }
}
