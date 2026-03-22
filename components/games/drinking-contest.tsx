"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createDrinkingState,
  setupRound,
  tickDrinking,
  handleDrinkTap,
  BAR_WIDTH,
  BAR_HEIGHT,
  type DrinkingState,
} from "@/lib/games/drinking-contest";

interface DrinkingContestProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

const CANVAS_W = 400;
const CANVAS_H = 300;

export function DrinkingContest({ onComplete }: DrinkingContestProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const stateRef = useRef<DrinkingState>(createDrinkingState());
  const [displayRound, setDisplayRound] = useState(1);
  const [displayStumbles, setDisplayStumbles] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const handleTap = useCallback(() => {
    stateRef.current = handleDrinkTap(stateRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let state = setupRound(createDrinkingState());
    stateRef.current = state;
    let lastTime = 0;
    let animFrame = 0;
    let completed = false;
    let displayCounter = 0;

    canvas.addEventListener("pointerdown", handleTap);
    window.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") handleTap();
    });

    function gameLoop(timestamp: number) {
      if (lastTime === 0) { lastTime = timestamp; animFrame = requestAnimationFrame(gameLoop); return; }
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;

      state = stateRef.current;
      state = tickDrinking(state, dt);
      stateRef.current = state;

      if (!state.alive && !completed) {
        completed = true;
        setGameOver(true);
        setDisplayRound(state.round);
        setDisplayStumbles(state.stumbles);
        render(ctx, state);
        setTimeout(() => onCompleteRef.current(state.round - 1, { stumbles: state.stumbles }), 1500);
        return;
      }

      displayCounter++;
      if (displayCounter >= 6) {
        displayCounter = 0;
        setDisplayRound(state.round);
        setDisplayStumbles(state.stumbles);
      }

      render(ctx, state);
      animFrame = requestAnimationFrame(gameLoop);
    }

    animFrame = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrame);
      canvas.removeEventListener("pointerdown", handleTap);
    };
  }, [handleTap]);

  const drunk = stateRef.current.drunkLevel;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Round: <span className="font-bold text-gold">{displayRound}</span>
        </span>
        <span className="rounded bg-surface px-3 py-1 text-sm">
          Stumbles: <span className={`font-bold ${displayStumbles >= 2 ? "text-red-400" : "text-white"}`}>{displayStumbles}/3</span>
        </span>
        {gameOver && <span className="rounded bg-red-600/20 px-3 py-1 text-sm font-bold text-red-400">Passed Out!</span>}
      </div>
      <div
        style={{
          transform: `rotate(${Math.sin(Date.now() / 800) * drunk * 3}deg)`,
          filter: `blur(${drunk * 1.5}px) hue-rotate(${drunk * 30}deg)`,
          transition: "transform 0.3s, filter 0.3s",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="max-w-full rounded-lg border border-border touch-none cursor-pointer"
          style={{ maxHeight: "50vh" }}
        />
      </div>
      <p className="text-xs text-gray-500">
        Tap when the mug is in the gold zone! Don&apos;t tap during &quot;WAIT!&quot; rounds.
      </p>
    </div>
  );
}

function render(ctx: CanvasRenderingContext2D, state: DrinkingState) {
  // Tavern background
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, "#2a1a0a");
  grad.addColorStop(1, "#1a0e04");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Wood grain lines
  ctx.strokeStyle = "#3a2a1a";
  ctx.lineWidth = 1;
  for (let y = 0; y < CANVAS_H; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.1) * 3);
    ctx.lineTo(CANVAS_W, y + Math.sin(y * 0.1 + 2) * 3);
    ctx.stroke();
  }

  const barX = (CANVAS_W - BAR_WIDTH) / 2;
  const barY = CANVAS_H / 2 - BAR_HEIGHT / 2;

  // Bar background
  ctx.fillStyle = "#3a2810";
  ctx.fillRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);
  ctx.strokeStyle = "#5a4020";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);

  // Sweet spot
  const sweetLeft = barX + state.sweetSpotCenter - state.sweetSpotWidth / 2;
  ctx.fillStyle = "rgba(229, 192, 123, 0.25)";
  ctx.fillRect(sweetLeft, barY, state.sweetSpotWidth, BAR_HEIGHT);
  ctx.strokeStyle = "#e5c07b";
  ctx.lineWidth = 1;
  ctx.strokeRect(sweetLeft, barY, state.sweetSpotWidth, BAR_HEIGHT);

  // Marker (mug)
  const markerX = barX + state.markerPosition;
  const markerY = barY + BAR_HEIGHT / 2;

  ctx.fillStyle = "#d4a537";
  ctx.fillRect(markerX - 8, markerY - 12, 16, 24);
  ctx.fillStyle = "#f0d870";
  ctx.fillRect(markerX - 6, markerY - 8, 12, 16);
  // Handle
  ctx.strokeStyle = "#d4a537";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(markerX + 10, markerY, 6, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Round result
  if (state.roundResult !== "none" && state.roundResultTimer > 0) {
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    if (state.roundResult === "hit") {
      ctx.fillStyle = "#98c379";
      ctx.fillText("DRINK!", CANVAS_W / 2, barY - 20);
    } else if (state.roundResult === "miss") {
      ctx.fillStyle = "#ef4444";
      ctx.fillText("STUMBLE!", CANVAS_W / 2, barY - 20);
    } else if (state.roundResult === "burp-ok") {
      ctx.fillStyle = "#98c379";
      ctx.fillText("HELD IT!", CANVAS_W / 2, barY - 20);
    } else if (state.roundResult === "burp-fail") {
      ctx.fillStyle = "#ef4444";
      ctx.fillText("BURP FAIL!", CANVAS_W / 2, barY - 20);
    }
  }

  // Burp indicator
  if (state.isBurpRound && state.burpTimer > 0) {
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.fillText("WAIT!", CANVAS_W / 2, barY - 25);
    ctx.font = "14px monospace";
    ctx.fillStyle = "#ef444480";
    ctx.fillText("Don't tap!", CANVAS_W / 2, barY + BAR_HEIGHT + 30);
  }

  // Round and stumbles
  ctx.fillStyle = "#e5c07b";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`Round ${state.round}`, 10, 22);
  ctx.textAlign = "right";
  ctx.fillStyle = state.stumbles >= 2 ? "#ef4444" : "#888";
  ctx.fillText(`${state.stumbles}/${state.maxStumbles} stumbles`, CANVAS_W - 10, 22);

  // Game over
  if (!state.alive) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 32px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PASSED OUT!", CANVAS_W / 2, CANVAS_H / 2);
    ctx.fillStyle = "#888";
    ctx.font = "16px monospace";
    ctx.fillText(`Survived ${state.round - 1} rounds`, CANVAS_W / 2, CANVAS_H / 2 + 30);
  }
}
