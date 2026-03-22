"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createRNG } from "@/lib/games/seeded-random";
import {
  generateLevel,
  placePipe,
  tickArcaneConduit,
  getWarningCells,
  type ArcaneConduitState,
  type PipeType,
} from "@/lib/games/arcane-conduit";

interface ArcaneConduitProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  config?: Record<string, unknown>;
}

// Pipe rendering: which lines to draw for each pipe type
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
  [0, -0.5], // up
  [0.5, 0],  // right
  [0, 0.5],  // down
  [-0.5, 0], // left
];

const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

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
    score: 0, segments: 0, minSegments: 10, delayTimer: 0,
    gameOver: false, penalties: 0, queue: [] as PipeType[], flowActive: false,
  });
  const [status, setStatus] = useState<"playing" | "overflow" | "complete">("playing");
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [cellSize, setCellSize] = useState(40);
  const [isMobile, setIsMobile] = useState(false);

  // Multi-round state
  const rounds = Number(config.rounds) || 1;
  const [currentRound, setCurrentRound] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [showingScoreboard, setShowingScoreboard] = useState(false);

  const effectiveTimeLimit = Number(config.timeLimit) || timeLimit || 0;
  const [elapsedTime, setElapsedTime] = useState(0);

  // First-time hint + replacement toast tracking
  const firstPipePlacedRef = useRef(false);
  const showReplacementHintRef = useRef(true);
  const replaceToastRef = useRef<{ row: number; col: number; timer: number } | null>(null);
  const replaceAnimRef = useRef<{ row: number; col: number; oldPipe: PipeType; timer: number } | null>(null);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const state = stateRef.current;
      const rng = rngRef.current;
      if (!state || !rng || state.gameOver || showingScoreboard) return;

      const hadPipe = state.grid[row][col].pipe;
      const newState = placePipe(state, row, col, rng);

      if (newState !== state) {
        firstPipePlacedRef.current = true;

        // Track replacement animation
        if (newState.lastReplaced) {
          if (hadPipe) {
            replaceAnimRef.current = { row, col, oldPipe: hadPipe, timer: 0.3 };
          }
          if (showReplacementHintRef.current) {
            replaceToastRef.current = { row, col, timer: 2.0 };
            showReplacementHintRef.current = false;
          }
        }

        stateRef.current = newState;
      }
    },
    [showingScoreboard]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const state = stateRef.current;
      if (!canvas || !state) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let col: number, row: number;
      if (isMobile) {
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        col = Math.floor(x / cellSize);
        row = Math.floor(y / cellSize);
      } else {
        const queueWidth = cellSize * 2.5;
        const x = (e.clientX - rect.left) * scaleX - queueWidth;
        const y = (e.clientY - rect.top) * scaleY;
        col = Math.floor(x / cellSize);
        row = Math.floor(y / cellSize);
      }

      if (row >= 0 && row < state.gridSize && col >= 0 && col < state.gridSize) {
        handleCellClick(row, col);
      }
    },
    [cellSize, handleCellClick, isMobile]
  );

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const state = stateRef.current;
      if (!canvas || !state) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let col: number, row: number;
      if (isMobile) {
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        col = Math.floor(x / cellSize);
        row = Math.floor(y / cellSize);
      } else {
        const queueWidth = cellSize * 2.5;
        const x = (e.clientX - rect.left) * scaleX - queueWidth;
        const y = (e.clientY - rect.top) * scaleY;
        col = Math.floor(x / cellSize);
        row = Math.floor(y / cellSize);
      }

      if (row >= 0 && row < state.gridSize && col >= 0 && col < state.gridSize) {
        setHoverCell([row, col]);
      } else {
        setHoverCell(null);
      }
    },
    [cellSize, isMobile]
  );

  // Initialize round
  const initRound = useCallback(
    (roundNum: number) => {
      const roundSeed = seed + roundNum * 1000;
      const state = generateLevel(roundSeed, difficulty, 5);
      stateRef.current = state;
      rngRef.current = createRNG(roundSeed + 999);
      firstPipePlacedRef.current = false;
      showReplacementHintRef.current = true;
      replaceToastRef.current = null;
      replaceAnimRef.current = null;
      setStatus("playing");
      setElapsedTime(0);
      setDisplayState({
        score: state.score, segments: state.segmentCount, minSegments: state.minSegments,
        delayTimer: state.delayTimer, gameOver: false, penalties: state.penalties,
        queue: [...state.queue], flowActive: false,
      });
    },
    [seed, difficulty]
  );

  useEffect(() => { initRound(currentRound); }, [currentRound, initRound]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 500);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Cell size
  useEffect(() => {
    const gs = difficulty === "easy" ? 7 : difficulty === "medium" ? 9 : 10;
    const maxW = window.innerWidth - 32;
    const maxH = window.innerHeight * 0.6;
    let cs: number;
    if (isMobile) {
      cs = Math.floor(maxW / gs);
    } else {
      cs = Math.floor((Math.min(maxW, maxH) - 100) / gs);
    }
    setCellSize(Math.max(28, Math.min(cs, 50)));
  }, [difficulty, isMobile]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const state = stateRef.current;
    if (!state) return;

    const qw = isMobile ? 0 : cellSize * 2.5;
    const gridPx = state.gridSize * cellSize;
    const queueH = isMobile ? cellSize * 1.8 : 0;
    canvas.width = gridPx + (isMobile ? 0 : qw);
    canvas.height = gridPx + queueH;

    let lastTime = 0;
    let animFrame = 0;
    let completed = false;
    let frameCount = 0;
    let elapsed = 0;

    function gameLoop(timestamp: number) {
      if (lastTime === 0) { lastTime = timestamp; animFrame = requestAnimationFrame(gameLoop); return; }
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;
      elapsed += dt;

      let s = stateRef.current!;
      const rng = rngRef.current!;

      // Time limit
      if (effectiveTimeLimit > 0 && elapsed >= effectiveTimeLimit && !s.gameOver) {
        s = { ...s, gameOver: true };
        stateRef.current = s;
      }

      if (!s.gameOver) {
        s = tickArcaneConduit(s, dt, rng);
        stateRef.current = s;
      }

      // Tick toast/anim timers
      if (replaceToastRef.current) {
        replaceToastRef.current.timer -= dt;
        if (replaceToastRef.current.timer <= 0) replaceToastRef.current = null;
      }
      if (replaceAnimRef.current) {
        replaceAnimRef.current.timer -= dt;
        if (replaceAnimRef.current.timer <= 0) replaceAnimRef.current = null;
      }

      if (s.gameOver && !completed) {
        completed = true;
        const isComplete = s.segmentCount >= s.minSegments;
        setStatus(isComplete ? "complete" : "overflow");

        setTimeout(() => {
          const newScores = [...roundScores, s.score];
          setRoundScores(newScores);

          if (currentRound + 1 < rounds) {
            setShowingScoreboard(true);
            setTimeout(() => {
              setShowingScoreboard(false);
              setCurrentRound((r) => r + 1);
            }, 4000);
          } else {
            const totalScore = newScores.reduce((a, b) => a + b, 0);
            onCompleteRef.current(totalScore, {
              rounds: newScores.length, perRoundScores: newScores,
              segments: s.segmentCount, complete: isComplete,
              penalties: s.penalties, reachedEndCrystal: s.reachedEndCrystal,
            });
          }
        }, 1500);
      }

      frameCount++;
      if (frameCount % 6 === 0) {
        setDisplayState({
          score: s.score, segments: s.segmentCount, minSegments: s.minSegments,
          delayTimer: Math.max(0, s.delayTimer), gameOver: s.gameOver,
          penalties: s.penalties, queue: [...s.queue], flowActive: s.flowActive,
        });
        setElapsedTime(elapsed);
      }

      render(ctx, s, cellSize, isMobile, hoverCell, firstPipePlacedRef.current, replaceToastRef.current, replaceAnimRef.current);
      animFrame = requestAnimationFrame(gameLoop);
    }

    animFrame = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSize, currentRound, effectiveTimeLimit, isMobile]);

  if (showingScoreboard) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="font-cinzel text-xl font-bold text-gold">Round {currentRound + 1} Complete!</h2>
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
          <span className={`rounded px-3 py-1 text-sm font-bold ${
            displayState.delayTimer <= 1 ? "bg-red-900/30 text-red-300" :
            displayState.delayTimer <= 3 ? "bg-orange-900/30 text-orange-300" :
            "bg-purple-900/30 text-purple-300"
          }`}>
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

      <canvas
        ref={canvasRef}
        className="rounded-lg border border-border touch-none"
        style={{ maxWidth: "100%", maxHeight: "70vh" }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        onMouseLeave={() => setHoverCell(null)}
      />

      <p className="text-xs text-gray-500">
        Tap a cell to place the next pipe. You can replace unused pipes (-1 pt).
      </p>
    </div>
  );
}

// ===== RENDERING =====

function render(
  ctx: CanvasRenderingContext2D,
  state: ArcaneConduitState,
  cs: number,
  isMobile: boolean,
  hoverCell: [number, number] | null,
  firstPipePlaced: boolean,
  replaceToast: { row: number; col: number; timer: number } | null,
  replaceAnim: { row: number; col: number; oldPipe: PipeType; timer: number } | null,
) {
  const gs = state.gridSize;
  const gridW = gs * cs;
  const qw = isMobile ? 0 : cs * 2.5;
  const queueH = isMobile ? cs * 1.8 : 0;
  const totalW = gridW + qw;
  const totalH = gridW + queueH;
  const now = Date.now();

  ctx.fillStyle = "#0d0d14";
  ctx.fillRect(0, 0, totalW, totalH);

  // ===== QUEUE =====
  if (isMobile) {
    // Queue below grid (horizontal)
    const qy = gridW + 4;
    ctx.fillStyle = "#111120";
    ctx.fillRect(0, qy, gridW, queueH - 4);

    ctx.fillStyle = "#e5c07b";
    ctx.font = `bold ${Math.floor(cs / 3)}px monospace`;
    ctx.textAlign = "left";
    ctx.fillText("NEXT", 6, qy + queueH / 2 + 4);

    const startX = cs * 1.8;
    for (let i = 0; i < state.queue.length; i++) {
      const px = startX + i * cs * 1.3;
      const py = qy + queueH / 2;
      const size = i === 0 ? cs * 0.8 : cs * 0.4;

      if (i === 0) {
        ctx.strokeStyle = "#e5c07b";
        ctx.lineWidth = 2;
        ctx.strokeRect(px - size / 2 - 3, py - size / 2 - 3, size + 6, size + 6);
      }
      drawPipe(ctx, state.queue[i], px, py, size, i === 0 ? "#c678dd" : "#4a4a6a");
    }

    // Animated arrow from first piece toward grid
    if (state.queue.length > 0) {
      const arrowX = startX;
      const arrowY = qy - 4 + Math.sin(now / 400) * 3;
      ctx.fillStyle = "#e5c07b";
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 5, arrowY + 8);
      ctx.lineTo(arrowX + 5, arrowY + 8);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Queue on left (vertical)
    ctx.fillStyle = "#111120";
    ctx.fillRect(0, 0, qw, gridW);

    ctx.fillStyle = "#e5c07b";
    ctx.font = `bold ${Math.floor(cs / 3)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("NEXT", qw / 2, cs * 0.6);

    for (let i = 0; i < state.queue.length; i++) {
      const px = qw / 2;
      const py = cs * (i + 1.2) + cs / 2;
      const size = i === 0 ? cs * 0.8 : cs * 0.4;

      if (i === 0) {
        ctx.strokeStyle = "#e5c07b";
        ctx.lineWidth = 2;
        ctx.strokeRect(px - size / 2 - 4, py - size / 2 - 4, size + 8, size + 8);
      }
      drawPipe(ctx, state.queue[i], px, py, size, i === 0 ? "#c678dd" : "#4a4a6a");
    }

    // Animated arrow pointing toward grid
    if (state.queue.length > 0) {
      const arrowX = qw - 4 + Math.sin(now / 400) * 3;
      const arrowY = cs * 1.7 + cs / 2;
      ctx.fillStyle = "#e5c07b";
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 8, arrowY - 5);
      ctx.lineTo(arrowX - 8, arrowY + 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ===== GRID =====
  const ox = isMobile ? 0 : qw;

  ctx.fillStyle = "#12121e";
  ctx.fillRect(ox, 0, gridW, gridW);

  // Grid lines
  ctx.strokeStyle = "#1a1a28";
  ctx.lineWidth = 1;
  for (let i = 0; i <= gs; i++) {
    ctx.beginPath(); ctx.moveTo(ox + i * cs, 0); ctx.lineTo(ox + i * cs, gridW); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, i * cs); ctx.lineTo(ox + gridW, i * cs); ctx.stroke();
  }

  // Warning cells
  const warnings = getWarningCells(state);
  for (const [wr, wc] of warnings) {
    if (wr >= 0 && wr < gs && wc >= 0 && wc < gs) {
      ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + Math.sin(now / 200) * 0.1})`;
      ctx.fillRect(ox + wc * cs + 1, wr * cs + 1, cs - 2, cs - 2);
    }
  }

  // First-time hint: highlight cell adjacent to source
  if (!firstPipePlaced && !state.flowActive) {
    const hintR = state.sourcePos[0] + DR[state.sourceExitDir];
    const hintC = state.sourcePos[1] + DC[state.sourceExitDir];
    if (hintR >= 0 && hintR < gs && hintC >= 0 && hintC < gs) {
      const pulse = 0.3 + Math.sin(now / 300) * 0.15;
      ctx.strokeStyle = `rgba(229, 192, 123, ${pulse + 0.3})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(ox + hintC * cs + 2, hintR * cs + 2, cs - 4, cs - 4);

      ctx.fillStyle = `rgba(229, 192, 123, ${pulse + 0.2})`;
      ctx.font = `bold ${Math.floor(cs / 4)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("Build here", ox + hintC * cs + cs / 2, hintR * cs + cs / 2);
    }
  }

  // Draw cells
  for (let r = 0; r < gs; r++) {
    for (let c = 0; c < gs; c++) {
      const cell = state.grid[r][c];
      const x = ox + c * cs;
      const y = r * cs;

      if (cell.state === "blocked") {
        ctx.fillStyle = "#1a1a2a";
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
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
        ctx.fillStyle = "rgba(100, 150, 255, 0.12)";
        ctx.fillRect(x + 3, y + 3, cs - 6, cs - 6);
      } else if (cell.state === "source") {
        // Purple cell background
        ctx.fillStyle = "rgba(198, 120, 221, 0.1)";
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

        // Pulsing diamond
        const pulse = 1.0 + 0.2 * Math.sin(now / 400);
        ctx.save();
        ctx.shadowColor = "#c678dd";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#c678dd";
        drawDiamond(ctx, x + cs / 2, y + cs / 2, cs / 3 * pulse);
        ctx.restore();

        // Thick arrow with arrowhead
        const [adx, ady] = DIR_OFFSETS[state.sourceExitDir];
        const cx = x + cs / 2;
        const cy = y + cs / 2;
        const ax = cx + adx * cs * 0.9;
        const ay = cy + ady * cs * 0.9;
        ctx.strokeStyle = "rgba(198, 120, 221, 0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        // Arrowhead
        ctx.fillStyle = "rgba(198, 120, 221, 0.6)";
        ctx.beginPath();
        if (state.sourceExitDir === 0) { // up
          ctx.moveTo(ax, ay); ctx.lineTo(ax - 4, ay + 6); ctx.lineTo(ax + 4, ay + 6);
        } else if (state.sourceExitDir === 1) { // right
          ctx.moveTo(ax, ay); ctx.lineTo(ax - 6, ay - 4); ctx.lineTo(ax - 6, ay + 4);
        } else if (state.sourceExitDir === 2) { // down
          ctx.moveTo(ax, ay); ctx.lineTo(ax - 4, ay - 6); ctx.lineTo(ax + 4, ay - 6);
        } else { // left
          ctx.moveTo(ax, ay); ctx.lineTo(ax + 6, ay - 4); ctx.lineTo(ax + 6, ay + 4);
        }
        ctx.closePath();
        ctx.fill();

        // "START" label
        ctx.fillStyle = "#c678dd";
        ctx.font = `bold ${Math.floor(cs / 5)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("START", cx, y + cs + cs / 5);
      } else if (cell.state === "end-crystal") {
        // Blue cell background
        ctx.fillStyle = "rgba(97, 175, 239, 0.1)";
        ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);

        // Pulsing diamond
        const pulse = 1.0 + 0.2 * Math.sin(now / 400);
        ctx.save();
        ctx.shadowColor = "#61afef";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#61afef";
        drawDiamond(ctx, x + cs / 2, y + cs / 2, cs / 3 * pulse);
        ctx.restore();

        // "END" label
        ctx.fillStyle = "#61afef";
        ctx.font = `bold ${Math.floor(cs / 5)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("END", x + cs / 2, y + cs + cs / 5);
      }

      // Draw pipe
      if (cell.pipe) {
        // Replacement fade-out animation
        if (replaceAnim && replaceAnim.row === r && replaceAnim.col === c) {
          const fadeAlpha = replaceAnim.timer / 0.3;
          if (fadeAlpha > 0) {
            ctx.globalAlpha = fadeAlpha * 0.5;
            drawPipe(ctx, replaceAnim.oldPipe, x + cs / 2, y + cs / 2, cs, "#ef4444");
            ctx.globalAlpha = 1;
          }
        }

        const pipeColor = cell.flowFilled
          ? (cell.flowProgress >= 1 ? "#e5c07b" : "#c678dd")
          : "#4a4a6a";
        drawPipe(ctx, cell.pipe, x + cs / 2, y + cs / 2, cs, pipeColor);

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
      ctx.globalAlpha = 0.3;
      drawPipe(ctx, state.queue[0], ox + hc * cs + cs / 2, hr * cs + cs / 2, cs, "#c678dd");
      ctx.globalAlpha = 1;
    }
  }

  // Replacement toast
  if (replaceToast) {
    const tx = ox + replaceToast.col * cs + cs / 2;
    const ty = replaceToast.row * cs - 8;
    const alpha = Math.min(1, replaceToast.timer / 0.5);
    ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
    ctx.font = `bold ${Math.floor(cs / 4)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("Replaced! (-1)", tx, ty);
  }

  // Countdown overlay (before flow starts)
  if (!state.flowActive && state.delayTimer > 0 && !state.gameOver) {
    const secs = Math.ceil(state.delayTimer);
    const pulse = 1.0 + 0.08 * Math.sin(now / 300);

    let color: string;
    if (secs <= 1) color = "#ef4444";
    else if (secs <= 3) color = "#f59e0b";
    else color = "#e5c07b";

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = color;
    const fontSize = cs * 1.3 * pulse;
    ctx.font = `bold ${Math.floor(fontSize)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.85;
    ctx.fillText(`${secs}`, ox + gridW / 2, gridW / 2 - cs * 0.3);
    ctx.font = `bold ${Math.floor(cs * 0.5)}px monospace`;
    ctx.globalAlpha = 0.5;
    ctx.fillText("FLOW STARTS IN", ox + gridW / 2, gridW / 2 + cs * 0.5);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Game over overlay
  if (state.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(ox, 0, gridW, gridW);

    const isComplete = state.segmentCount >= state.minSegments;
    ctx.save();
    ctx.shadowColor = isComplete ? "#98c379" : "#ef4444";
    ctx.shadowBlur = 15;
    ctx.fillStyle = isComplete ? "#98c379" : "#ef4444";
    ctx.font = `bold ${Math.floor(cs * 1.1)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isComplete ? "COMPLETE!" : "OVERFLOW!", ox + gridW / 2, gridW / 2 - 10);
    ctx.restore();

    ctx.fillStyle = "#ccc";
    ctx.font = `${Math.floor(cs * 0.5)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`${state.segmentCount} segments | ${state.score} pts`, ox + gridW / 2, gridW / 2 + cs * 0.8);
  }
}

// ===== DRAW HELPERS =====

function drawPipe(ctx: CanvasRenderingContext2D, pipe: PipeType, cx: number, cy: number, cs: number, color: string) {
  const dirs = PIPE_DRAW_DIRS[pipe];
  const lineWidth = cs / 4;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, lineWidth / 2.5, 0, Math.PI * 2);
  ctx.fill();

  for (const dir of dirs) {
    const [dx, dy] = DIR_OFFSETS[dir];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * cs * 0.9, cy + dy * cs * 0.9);
    ctx.stroke();
  }
}

function drawDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx + size, cy);
  ctx.lineTo(cx, cy + size);
  ctx.lineTo(cx - size, cy);
  ctx.closePath();
  ctx.fill();
}
