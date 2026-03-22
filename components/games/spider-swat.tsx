"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createRNG } from "@/lib/games/seeded-random";
import {
  createInitialState,
  tickSpiderSwat,
  handleTap,
  GAME_DURATION,
  GAME_WIDTH,
  GAME_HEIGHT,
  type SpiderSwatState,
  type Creature,
} from "@/lib/games/spider-swat";

interface SpiderSwatProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

export function SpiderSwat({ seed, onComplete }: SpiderSwatProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayTime, setDisplayTime] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const stateRef = useRef<SpiderSwatState>(createInitialState());

  const handleCanvasTap = useCallback((e: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    stateRef.current = handleTap(stateRef.current, x, y);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let state = createInitialState();
    stateRef.current = state;
    const rng = createRNG(seed);
    let lastTime = 0;
    let animFrame = 0;
    let completed = false;
    let displayCounter = 0;

    canvas.addEventListener("pointerdown", handleCanvasTap);

    function gameLoop(timestamp: number) {
      if (lastTime === 0) {
        lastTime = timestamp;
        animFrame = requestAnimationFrame(gameLoop);
        return;
      }

      const delta = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      // Use the latest state (may have been updated by tap handler)
      state = stateRef.current;
      state = tickSpiderSwat(state, delta, rng);
      stateRef.current = state;

      if (state.gameOver && !completed) {
        completed = true;
        setGameOver(true);
        setDisplayScore(state.score);
        setDisplayTime(0);
        render(ctx, state);
        setTimeout(() => onCompleteRef.current(state.score), 1500);
        return;
      }

      displayCounter++;
      if (displayCounter >= 6) {
        displayCounter = 0;
        setDisplayScore(state.score);
        setDisplayTime(Math.max(0, GAME_DURATION - state.time));
      }

      render(ctx, state);
      animFrame = requestAnimationFrame(gameLoop);
    }

    animFrame = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrame);
      canvas.removeEventListener("pointerdown", handleCanvasTap);
    };
  }, [seed, handleCanvasTap]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Score: <span className="font-bold text-gold">{displayScore}</span>
        </span>
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Time: <span className={`font-bold ${displayTime < 5 ? "text-red-400" : "text-white"}`}>{displayTime.toFixed(1)}s</span>
        </span>
        {gameOver && (
          <span className="rounded bg-gold/20 px-3 py-1 text-sm font-bold text-gold">
            Done!
          </span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        className="max-w-full rounded-lg border border-border touch-none cursor-crosshair"
        style={{ maxHeight: "65vh", aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
      />
      <p className="text-xs text-gray-500">
        Tap spiders to swat them! Avoid the mushrooms (-3 pts).
      </p>
    </div>
  );
}

function render(ctx: CanvasRenderingContext2D, state: SpiderSwatState) {
  // Background — cave ceiling
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, "#0a0a10");
  grad.addColorStop(0.5, "#0d0d18");
  grad.addColorStop(1, "#101018");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Texture cracks
  ctx.strokeStyle = "#181820";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const x1 = (i * 53) % GAME_WIDTH;
    const y1 = (i * 37) % GAME_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + 40, y1 + 60);
    ctx.stroke();
  }

  // Timer bar at top
  const progress = Math.max(0, 1 - state.time / GAME_DURATION);
  ctx.fillStyle = progress > 0.25 ? "#e5c07b" : "#ef4444";
  ctx.fillRect(0, 0, GAME_WIDTH * progress, 4);

  // Creatures
  for (const c of state.creatures) {
    if (!c.alive) continue;
    renderCreature(ctx, c);
  }

  // Score
  ctx.fillStyle = "#e5c07b";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${state.score} pts`, GAME_WIDTH - 10, 24);
}

function renderCreature(ctx: CanvasRenderingContext2D, c: Creature) {
  const fadeOut = c.age > c.lifespan * 0.7 ? 1 - (c.age - c.lifespan * 0.7) / (c.lifespan * 0.3) : 1;
  ctx.globalAlpha = fadeOut;

  if (c.type === "spider") {
    // Dark spider with red eyes
    ctx.fillStyle = "#2a2030";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size / 2, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.strokeStyle = "#3a3040";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + Math.cos(angle) * c.size, c.y + Math.sin(angle) * c.size * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x - Math.cos(angle) * c.size, c.y + Math.sin(angle) * c.size * 0.8);
      ctx.stroke();
    }
    // Eyes
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(c.x - 4, c.y - 3, 2, 0, Math.PI * 2);
    ctx.arc(c.x + 4, c.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (c.type === "glowing") {
    ctx.save();
    ctx.shadowColor = "#c678dd";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#6a4a8a";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#c678dd";
    ctx.beginPath();
    ctx.arc(c.x - 3, c.y - 2, 2, 0, Math.PI * 2);
    ctx.arc(c.x + 3, c.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (c.type === "scuttler") {
    ctx.fillStyle = "#4a3050";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.size / 2, c.size / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(c.x - 3, c.y, 2, 0, Math.PI * 2);
    ctx.arc(c.x + 3, c.y, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (c.type === "swarm") {
    ctx.fillStyle = "#201820";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(c.x - 1, c.y - 1, 2, 2);
  } else if (c.type === "mushroom") {
    // Friendly mushroom — green tint
    ctx.fillStyle = "#2a4a2a";
    ctx.beginPath();
    ctx.arc(c.x, c.y - c.size / 4, c.size / 2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#1a3a1a";
    ctx.fillRect(c.x - 4, c.y, 8, c.size / 3);
    // Spots
    ctx.fillStyle = "#4a8a4a";
    ctx.beginPath();
    ctx.arc(c.x - 4, c.y - c.size / 4, 3, 0, Math.PI * 2);
    ctx.arc(c.x + 5, c.y - c.size / 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
