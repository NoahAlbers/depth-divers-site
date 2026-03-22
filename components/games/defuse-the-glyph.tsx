"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  generatePuzzle,
  assignPanels,
  checkSolution,
  checkSequence,
  getTimerDuration,
  NODE_COLORS,
  COLOR_HEX,
  PANEL_INFO,
  type PuzzleData,
  type NodeState,
} from "@/lib/games/defuse-the-glyph";

interface DefuseTheGlyphProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  config?: Record<string, unknown>;
  sessionId?: string;
  players?: string[];
  playerName?: string;
  isDM?: boolean;
}

export function DefuseTheGlyph({
  seed,
  difficulty,
  onComplete,
  config = {},
  players = [],
  playerName = "",
  isDM = false,
}: DefuseTheGlyphProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const configTimer = Number(config.timerDuration) || 0;
  const maxAttempts = config.maxAttempts === 0 ? 999 : Number(config.maxAttempts) || 3;

  const puzzle = useMemo(() => generatePuzzle(seed, difficulty), [seed, difficulty]);
  const timerDuration = getTimerDuration(difficulty, configTimer);
  const panelAssignments = useMemo(
    () => assignPanels(players.length > 0 ? players : [playerName || "Player"], seed, config.assignOperator as string | undefined),
    [players, playerName, seed, config.assignOperator]
  );

  // Find this player's panels
  const myAssignment = useMemo(() => {
    if (isDM) return { playerName: "DM", panels: ["operator", "key", "validator", "sequencer", "observer"] };
    return panelAssignments.find((a) => a.playerName === playerName) || { playerName, panels: ["operator"] };
  }, [panelAssignments, playerName, isDM]);

  const myPanels = myAssignment.panels;
  const isOperator = myPanels.includes("operator");

  // Game state
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [nodeStates, setNodeStates] = useState<NodeState[]>(
    Array(puzzle.nodeCount).fill("red")
  );
  const [setOrder, setSetOrder] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<"none" | "success" | "wrong-colors" | "wrong-sequence" | "failed">("none");
  const [wrongNodes, setWrongNodes] = useState<number[]>([]);
  const [timePenalty, setTimePenalty] = useState(0);
  const completedRef = useRef(false);

  // Timer
  useEffect(() => {
    if (result === "success" || result === "failed") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!completedRef.current) {
            completedRef.current = true;
            setResult("failed");
            setTimeout(() => onCompleteRef.current(0, { success: false, timedOut: true, attempts }), 1500);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [result, attempts]);

  // Apply time penalty
  useEffect(() => {
    if (timePenalty > 0) {
      setTimeLeft((prev) => Math.max(0, prev - timePenalty));
      setTimePenalty(0);
    }
  }, [timePenalty]);

  const cycleNode = useCallback((index: number) => {
    if (result === "success" || result === "failed") return;
    if (!isOperator) return;

    setNodeStates((prev) => {
      const next = [...prev];
      const currentIdx = NODE_COLORS.indexOf(next[index]);
      next[index] = NODE_COLORS[(currentIdx + 1) % NODE_COLORS.length];

      // Track set order: if the new color matches the solution and not already tracked
      if (next[index] === puzzle.solution[index]) {
        setSetOrder((prevOrder) => {
          if (!prevOrder.includes(index)) return [...prevOrder, index];
          return prevOrder;
        });
      }

      return next;
    });

    // Clear previous wrong feedback
    if (result === "wrong-colors" || result === "wrong-sequence") {
      setResult("none");
      setWrongNodes([]);
    }
  }, [result, isOperator, puzzle.solution]);

  const handleDefuse = useCallback(() => {
    if (result === "success" || result === "failed" || !isOperator) return;

    const { colorsCorrect, wrongNodes: wrong } = checkSolution(nodeStates, puzzle);

    if (!colorsCorrect) {
      setResult("wrong-colors");
      setWrongNodes(wrong);
      setAttempts((a) => a + 1);
      setTimePenalty(15);

      if (attempts + 1 >= maxAttempts) {
        completedRef.current = true;
        setTimeout(() => {
          setResult("failed");
          setTimeout(() => onCompleteRef.current(0, { success: false, wrongColors: true, attempts: attempts + 1 }), 1500);
        }, 1500);
      } else {
        setTimeout(() => {
          setResult("none");
          setWrongNodes([]);
        }, 2000);
      }
      return;
    }

    const seqOk = checkSequence(setOrder, puzzle, difficulty);
    if (!seqOk) {
      setResult("wrong-sequence");
      setAttempts((a) => a + 1);
      setTimePenalty(15);

      if (attempts + 1 >= maxAttempts) {
        completedRef.current = true;
        setTimeout(() => {
          setResult("failed");
          setTimeout(() => onCompleteRef.current(0, { success: false, wrongSequence: true, attempts: attempts + 1 }), 1500);
        }, 1500);
      } else {
        setTimeout(() => {
          setResult("none");
          setWrongNodes([]);
        }, 2000);
      }
      return;
    }

    // Success!
    completedRef.current = true;
    setResult("success");
    const score = Math.max(0, timeLeft);
    setTimeout(() => onCompleteRef.current(score, { success: true, timeRemaining: timeLeft, attempts: attempts + 1 }), 1500);
  }, [result, isOperator, nodeStates, puzzle, setOrder, difficulty, attempts, maxAttempts, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ===== RENDER =====

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Timer bar */}
      <div className="flex items-center justify-between">
        <span className={`font-cinzel text-2xl font-bold ${timeLeft < 30 ? "text-red-400 animate-pulse" : "text-gold"}`}>
          {formatTime(timeLeft)}
        </span>
        <div className="flex items-center gap-2">
          {myPanels.map((p) => (
            <span key={p} className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold text-gray-400 uppercase">
              {PANEL_INFO[p]?.name || p}
            </span>
          ))}
        </div>
      </div>

      {/* Result banner */}
      {result === "success" && (
        <div className="rounded border border-green-500/30 bg-green-500/10 p-3 text-center">
          <p className="text-lg font-bold text-green-400">DEFUSED!</p>
          <p className="text-xs text-gray-400">Time remaining: {formatTime(timeLeft)}</p>
        </div>
      )}
      {result === "failed" && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-center">
          <p className="text-lg font-bold text-red-400">FAILED!</p>
          <p className="text-xs text-gray-400">{timeLeft <= 0 ? "Time ran out!" : "Too many failed attempts."}</p>
        </div>
      )}
      {result === "wrong-colors" && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-center">
          <p className="text-sm font-bold text-red-400">Wrong colors! -15s penalty</p>
          <p className="text-[10px] text-gray-400">Attempt {attempts}/{maxAttempts === 999 ? "∞" : maxAttempts}</p>
        </div>
      )}
      {result === "wrong-sequence" && (
        <div className="rounded border border-orange-500/30 bg-orange-500/10 p-2 text-center">
          <p className="text-sm font-bold text-orange-400">Correct colors, wrong order! -15s</p>
          <p className="text-[10px] text-gray-400">Attempt {attempts}/{maxAttempts === 999 ? "∞" : maxAttempts}</p>
        </div>
      )}

      {/* DM: show solution */}
      {isDM && (
        <div className="rounded border border-gold/30 bg-gold/5 p-3">
          <p className="mb-1 text-[10px] font-bold uppercase text-gold">Solution (DM Only)</p>
          <div className="flex gap-2">
            {puzzle.solution.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-gray-500">#{i + 1}</span>
                <div className="h-8 w-8 rounded-full border-2" style={{ backgroundColor: COLOR_HEX[color], borderColor: COLOR_HEX[color] }}>
                  <span className="flex h-full items-center justify-center text-[9px] font-bold text-white">{color[0].toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-[9px] text-gray-500">
            Sequence: {puzzle.sequence.map((i) => `#${i + 1}`).join(" → ")}
          </p>
        </div>
      )}

      {/* Role description(s) */}
      {myPanels.map((panel) => (
        <div key={panel} className="rounded border border-gray-700 bg-surface/50 p-2">
          <p className="text-[10px] font-bold text-gold uppercase">{PANEL_INFO[panel]?.name}</p>
          <p className="text-[10px] text-gray-500">{PANEL_INFO[panel]?.description}</p>
        </div>
      ))}

      {/* ===== OPERATOR PANEL ===== */}
      {myPanels.includes("operator") && (
        <div className="rounded-lg border border-border bg-[#1a1a2e] p-4">
          <h3 className="mb-3 text-sm font-bold text-gray-400">Nodes</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {nodeStates.map((state, i) => {
              const isWrong = wrongNodes.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => cycleNode(i)}
                  disabled={result === "success" || result === "failed"}
                  className={`flex h-20 w-20 flex-col items-center justify-center rounded-xl border-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                    isWrong ? "animate-pulse border-red-500" : ""
                  }`}
                  style={{
                    borderColor: isWrong ? "#ef4444" : COLOR_HEX[state],
                    backgroundColor: `${COLOR_HEX[state]}25`,
                  }}
                >
                  <span className="text-3xl font-bold" style={{ color: COLOR_HEX[state] }}>
                    {i + 1}
                  </span>
                  <span className="text-[10px] font-bold uppercase" style={{ color: COLOR_HEX[state] }}>
                    {state}
                  </span>
                </button>
              );
            })}
          </div>

          {/* DEFUSE button */}
          {isOperator && result !== "success" && result !== "failed" && (
            <button
              onClick={handleDefuse}
              className="mt-4 w-full rounded-lg border-2 border-gold bg-gold/10 px-4 py-3 text-lg font-bold text-gold transition-all hover:bg-gold/20 active:scale-95"
            >
              ═══ DEFUSE ═══
            </button>
          )}

          {isOperator && (
            <p className="mt-2 text-center text-[10px] text-gray-500">
              Attempts: {attempts}/{maxAttempts === 999 ? "∞" : maxAttempts}
            </p>
          )}
        </div>
      )}

      {/* ===== KEY READER PANEL ===== */}
      {myPanels.includes("key") && (
        <div className="rounded-lg border border-border bg-[#1a1a2e] p-4">
          <h3 className="mb-3 text-sm font-bold text-gray-400">Symbol Mappings</h3>
          <div className="space-y-1.5">
            {puzzle.keyEntries.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded border border-gray-700 bg-background/50 px-3 py-2"
              >
                <span className="text-xl">{entry.symbol.icon}</span>
                <span className="flex-1 text-xs text-gray-300">{entry.symbol.name}</span>
                <span className="text-gray-500">→</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-4 w-4 rounded-full border border-gray-600"
                    style={{ backgroundColor: COLOR_HEX[entry.color] }}
                  />
                  <span className="text-sm font-bold" style={{ color: COLOR_HEX[entry.color] }}>
                    {entry.color}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-gray-500">
            Read these mappings to your team. Some may be decoys!
          </p>
        </div>
      )}

      {/* ===== VALIDATOR PANEL ===== */}
      {myPanels.includes("validator") && (
        <div className="rounded-lg border border-border bg-[#1a1a2e] p-4">
          <h3 className="mb-3 text-sm font-bold text-gray-400">Your Clues About the Key</h3>
          <div className="space-y-2">
            {puzzle.validatorClues.map((clue, i) => (
              <div
                key={i}
                className="rounded border-l-2 border-purple-500/50 bg-purple-500/5 px-3 py-2"
              >
                <p className="text-xs text-gray-300 italic">&ldquo;{clue}&rdquo;</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-gray-500">
            Tell your team which Key entries to trust and which are decoys.
          </p>
        </div>
      )}

      {/* ===== SEQUENCER PANEL ===== */}
      {myPanels.includes("sequencer") && (
        <div className="rounded-lg border border-border bg-[#1a1a2e] p-4">
          <h3 className="mb-3 text-sm font-bold text-gray-400">Activation Order</h3>
          {difficulty === "easy" ? (
            <p className="text-xs text-gray-400">No specific order required on Easy difficulty. Set all nodes correctly.</p>
          ) : (
            <div className="space-y-1.5">
              {puzzle.sequence.map((nodeIdx, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded border border-gray-700 bg-background/50 px-3 py-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                    {i + 1}
                  </span>
                  <span className="text-xl">{puzzle.symbols[nodeIdx]?.icon}</span>
                  <span className="text-xs text-gray-300">({puzzle.symbols[nodeIdx]?.name})</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] text-gray-500">
            {difficulty === "easy"
              ? "Order doesn't matter on Easy."
              : difficulty === "medium"
                ? "The last 2 nodes must be set in this order."
                : "ALL nodes must be set in this exact order!"}
          </p>
        </div>
      )}

      {/* ===== OBSERVER PANEL ===== */}
      {myPanels.includes("observer") && (
        <div className="rounded-lg border border-border bg-[#1a1a2e] p-4">
          <h3 className="mb-3 text-sm font-bold text-gray-400">What You Know</h3>
          <div className="space-y-2">
            {puzzle.observerHints.map((hint, i) => (
              <div
                key={i}
                className="rounded border-l-2 border-blue-500/50 bg-blue-500/5 px-3 py-2"
              >
                <p className="text-xs text-gray-300">{hint}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-gray-500">
            Share this info to help verify your team&apos;s work.
          </p>
        </div>
      )}
    </div>
  );
}
