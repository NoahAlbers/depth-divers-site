"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  generatePuzzle,
  getRoles,
  getTimerDuration,
  checkSolution,
  NODE_STATES,
  type PuzzleTemplate,
  type NodeState,
  type PlayerRole,
} from "@/lib/games/defuse-the-glyph";

interface DefuseTheGlyphProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}

// Determine this player's role based on their index in the session
function getPlayerIndex(playerName: string, players: string[]): number {
  return players.indexOf(playerName);
}

export function DefuseTheGlyph({ seed, difficulty, onComplete }: DefuseTheGlyphProps) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [puzzle] = useState(() => generatePuzzle(seed, difficulty));
  const timerDuration = getTimerDuration(difficulty);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [nodeStates, setNodeStates] = useState<NodeState[]>(
    Array(puzzle.nodeCount).fill("red")
  );
  const [result, setResult] = useState<"none" | "success" | "failure">("none");
  const [roleIndex] = useState(0); // Default to Grid role for solo/testing
  const roles = getRoles(4); // Show all 4 roles for the display
  const currentRole = roles[Math.min(roleIndex, roles.length - 1)];

  // Timer
  useEffect(() => {
    if (result !== "none") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setResult("failure");
          setTimeout(() => onCompleteRef.current(0, { success: false, timedOut: true }), 1500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const cycleNode = (index: number) => {
    if (result !== "none") return;
    setNodeStates((prev) => {
      const next = [...prev];
      const currentIdx = NODE_STATES.indexOf(next[index]);
      next[index] = NODE_STATES[(currentIdx + 1) % NODE_STATES.length];
      return next;
    });
  };

  const handleDefuse = () => {
    if (result !== "none") return;
    const success = checkSolution(nodeStates, puzzle);
    setResult(success ? "success" : "failure");
    const score = success ? Math.round(timerDuration - timeLeft) : 0;
    setTimeout(
      () => onCompleteRef.current(score, { success, timeRemaining: timeLeft }),
      1500
    );
  };

  const colorMap: Record<NodeState, string> = {
    red: "#ef4444",
    blue: "#61afef",
    green: "#98c379",
    purple: "#c678dd",
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-lg">
      {/* Timer */}
      <div className="mb-4 flex items-center justify-between">
        <span className={`font-cinzel text-2xl font-bold ${timeLeft < 30 ? "text-red-400" : "text-gold"}`}>
          {formatTime(timeLeft)}
        </span>
        <span className="rounded bg-surface px-3 py-1 text-xs text-gray-400">
          {currentRole.roleName}
        </span>
        {result === "success" && <span className="text-lg font-bold text-green-400">DEFUSED!</span>}
        {result === "failure" && <span className="text-lg font-bold text-red-400">FAILED!</span>}
      </div>

      {/* Role description */}
      <div className="mb-4 rounded border border-gold/20 bg-gold/5 p-3">
        <p className="text-xs text-gold">{currentRole.description}</p>
      </div>

      {/* The Grid panel — always shown (in solo, player controls all) */}
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-bold text-gray-400">Nodes</h3>
        <div className="flex flex-wrap gap-3">
          {nodeStates.map((state, i) => (
            <button
              key={i}
              onClick={() => cycleNode(i)}
              disabled={result !== "none"}
              className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{
                borderColor: colorMap[state],
                backgroundColor: `${colorMap[state]}20`,
              }}
            >
              <span className="text-2xl" style={{ color: colorMap[state] }}>
                {i + 1}
              </span>
              <span className="text-[9px]" style={{ color: colorMap[state] }}>
                {state}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={handleDefuse}
          disabled={result !== "none"}
          className="mt-3 w-full rounded bg-gold px-4 py-3 text-sm font-bold text-background hover:bg-[#f0d090] disabled:opacity-50"
        >
          DEFUSE
        </button>
      </div>

      {/* The Key panel */}
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-bold text-gray-400">Key Mappings</h3>
        <div className="flex flex-col gap-1">
          {puzzle.keyMappings.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded border border-border bg-surface px-3 py-1.5"
            >
              <span className="text-lg">{m.symbol}</span>
              <span className="text-xs">→</span>
              <span
                className="text-sm font-bold"
                style={{ color: colorMap[m.color] }}
              >
                {m.color}
              </span>
              {m.isDecoy && (
                <span className="ml-auto text-[9px] text-yellow-500">
                  (shown to Validator)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Validator Clues */}
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-bold text-gray-400">Validator Clues</h3>
        <div className="flex flex-col gap-1">
          {puzzle.validatorClues.map((clue, i) => (
            <p key={i} className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-gray-300">
              {clue}
            </p>
          ))}
        </div>
      </div>

      {/* Sequence */}
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-bold text-gray-400">Activation Sequence</h3>
        <div className="flex gap-2">
          {puzzle.sequenceOrder.map((nodeIdx, i) => (
            <div
              key={i}
              className="flex h-10 w-10 items-center justify-center rounded border border-border bg-surface text-sm font-bold text-gold"
            >
              {puzzle.keyMappings[nodeIdx]?.symbol || nodeIdx + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
