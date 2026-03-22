"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { POLL_INTERVAL_MS } from "@/lib/players";
import { DrawingCanvas } from "./drawing-canvas";
import { WritingPhase } from "./writing-phase";
import {
  type Chain,
  generateAutoPrompts,
  getRoundType,
  getTotalRounds,
} from "@/lib/games/underdark-telephone";

interface UnderdarkTelephoneProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  config?: Record<string, unknown>;
  sessionId: string;
  players: string[];
  playerName: string;
}

interface RoundStatus {
  currentRound: number;
  totalRounds: number;
  roundType: "write" | "draw";
  submittedPlayers: string[];
  totalPlayers: number;
  assignment: {
    chainIndex: number;
    type: "write" | "draw";
    previousContent?: string;
  } | null;
  isReveal: boolean;
  chains?: Chain[];
  status: string;
}

export function UnderdarkTelephone({
  seed,
  onComplete,
  config = {},
  sessionId,
  players,
  playerName,
}: UnderdarkTelephoneProps) {
  const [roundStatus, setRoundStatus] = useState<RoundStatus | null>(null);
  const [phase, setPhase] = useState<"playing" | "waiting" | "reveal">("playing");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [revealIndex, setRevealIndex] = useState(0); // which chain to reveal
  const [revealStep, setRevealStep] = useState(0); // which entry in the chain
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const promptMode = (config.promptMode as string) || "player";
  const drawTime = (config.drawTime as number) || 60;
  const writeTime = (config.writeTime as number) || 30;

  // Poll round status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/games/${sessionId}/round-status?player=${encodeURIComponent(playerName)}`
      );
      if (res.ok) {
        const data: RoundStatus = await res.json();
        setRoundStatus(data);

        if (data.isReveal) {
          setPhase("reveal");
        } else if (data.status === "finished") {
          setPhase("reveal");
        }
      }
    } catch {}
  }, [sessionId, playerName]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchStatus();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Reset submitted state when round changes
  useEffect(() => {
    if (!roundStatus) return;
    const submitted = roundStatus.submittedPlayers.includes(playerName);
    if (submitted) {
      setHasSubmitted(true);
      setPhase("waiting");
    } else if (!roundStatus.isReveal) {
      setHasSubmitted(false);
      setPhase("playing");
    }
  }, [roundStatus?.currentRound, roundStatus?.submittedPlayers, playerName, roundStatus?.isReveal]);

  const handleSubmit = useCallback(
    async (content: string) => {
      if (!roundStatus || hasSubmitted) return;
      setHasSubmitted(true);
      setPhase("waiting");

      await fetch(`/api/games/${sessionId}/round-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          round: roundStatus.currentRound,
          type: roundStatus.roundType,
          content,
        }),
      });

      fetchStatus();
    },
    [roundStatus, hasSubmitted, sessionId, playerName, fetchStatus]
  );

  if (!roundStatus) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-400">Loading game...</p>
      </div>
    );
  }

  // ===== REVEAL PHASE =====
  if (phase === "reveal" && roundStatus.chains) {
    const chains = roundStatus.chains;
    const currentChain = chains[revealIndex];

    if (!currentChain) {
      // All chains revealed — show summary
      return (
        <div className="flex flex-col items-center gap-4">
          <h2 className="font-cinzel text-2xl font-bold text-gold">
            All Chains Revealed!
          </h2>
          <div className="w-full max-w-lg space-y-6">
            {chains.map((chain, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <p className="mb-2 text-xs font-bold text-gold">
                  Chain {i + 1} — started by {chain.startPlayer}
                </p>
                <div className="space-y-2">
                  {chain.entries.map((entry, j) => (
                    <div key={j} className="rounded bg-background/50 p-2">
                      <p className="text-[10px] text-gray-500">
                        {entry.playerName} — {entry.type}
                      </p>
                      {entry.type === "write" ? (
                        <p className="text-sm text-gray-200">
                          {entry.content}
                        </p>
                      ) : entry.content === "[skipped]" ? (
                        <p className="text-sm italic text-gray-500">
                          [skipped]
                        </p>
                      ) : (
                        <img
                          src={entry.content}
                          alt={`Drawing by ${entry.playerName}`}
                          className="mt-1 max-h-48 rounded border border-border"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Game complete! Results have been recorded.
          </p>
        </div>
      );
    }

    const visibleEntries = currentChain.entries.slice(0, revealStep + 1);

    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="font-cinzel text-xl font-bold text-gold">
          Chain {revealIndex + 1} of {chains.length}
        </h2>
        <p className="text-xs text-gray-400">
          Started by {currentChain.startPlayer}
        </p>

        <div className="w-full max-w-lg space-y-3">
          {visibleEntries.map((entry, j) => (
            <div
              key={j}
              className="rounded-lg border border-border bg-surface p-3 animate-in fade-in"
            >
              <p className="mb-1 text-[10px] text-gray-500">
                {entry.playerName} — Round {entry.round + 1} ({entry.type})
              </p>
              {entry.type === "write" ? (
                <p className="text-sm text-gray-200">{entry.content}</p>
              ) : entry.content === "[skipped]" ? (
                <p className="text-sm italic text-gray-500">[skipped]</p>
              ) : (
                <img
                  src={entry.content}
                  alt={`Drawing by ${entry.playerName}`}
                  className="mt-1 w-full max-h-64 rounded border border-border object-contain"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {revealStep < currentChain.entries.length - 1 ? (
            <button
              onClick={() => setRevealStep((s) => s + 1)}
              className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090]"
            >
              Next Entry
            </button>
          ) : revealIndex < chains.length - 1 ? (
            <button
              onClick={() => {
                setRevealIndex((i) => i + 1);
                setRevealStep(0);
              }}
              className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090]"
            >
              Next Chain
            </button>
          ) : (
            <button
              onClick={() => setRevealIndex(chains.length)} // trigger summary view
              className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090]"
            >
              View Summary
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== WAITING PHASE =====
  if (phase === "waiting") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <p className="text-lg text-gold">Waiting for others...</p>
        <p className="text-sm text-gray-400">
          {roundStatus.submittedPlayers.length}/{roundStatus.totalPlayers}{" "}
          players have submitted
        </p>
        <div className="flex flex-wrap gap-1.5">
          {players.map((p) => (
            <span
              key={p}
              className={`rounded px-2 py-0.5 text-xs ${
                roundStatus.submittedPlayers.includes(p)
                  ? "bg-green-900/30 text-green-400"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {p} {roundStatus.submittedPlayers.includes(p) && "✓"}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Round {roundStatus.currentRound + 1} of {roundStatus.totalRounds}
        </p>
      </div>
    );
  }

  // ===== PLAYING PHASE =====
  const assignment = roundStatus.assignment;
  if (!assignment) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-gray-400">Waiting for assignment...</p>
      </div>
    );
  }

  // Round 0 with auto-generated prompts
  if (roundStatus.currentRound === 0 && promptMode === "auto") {
    const autoPrompts = generateAutoPrompts(seed, players.length);
    const playerIndex = players.indexOf(playerName);
    const autoPrompt = autoPrompts[playerIndex] || "Draw something from the Underdark";

    return (
      <div className="flex flex-col items-center gap-3">
        <h2 className="font-cinzel text-lg font-bold text-gold">
          Round 1 — Write
        </h2>
        <p className="text-xs text-gray-400">
          Your prompt has been auto-generated. Describe it in your own words:
        </p>
        <WritingPhase
          prompt={autoPrompt}
          timeLimit={writeTime}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // Writing round
  if (assignment.type === "write") {
    return (
      <div className="flex flex-col items-center gap-3">
        <h2 className="font-cinzel text-lg font-bold text-gold">
          Round {roundStatus.currentRound + 1} — Write
        </h2>
        <p className="text-xs text-gray-400">
          {roundStatus.currentRound === 0
            ? "Write a creative prompt for someone to draw"
            : "Describe what you see in the drawing below"}
        </p>
        <WritingPhase
          previousImage={
            assignment.previousContent && assignment.previousContent !== "[skipped]"
              ? assignment.previousContent
              : undefined
          }
          prompt={
            roundStatus.currentRound === 0
              ? "Write something fun for someone to draw!"
              : undefined
          }
          timeLimit={writeTime}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // Drawing round
  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="font-cinzel text-lg font-bold text-gold">
        Round {roundStatus.currentRound + 1} — Draw
      </h2>
      <p className="text-xs text-gray-400">
        Draw what the prompt describes!
      </p>
      <DrawingCanvas
        timeLimit={drawTime}
        prompt={assignment.previousContent || "Draw something creative!"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
