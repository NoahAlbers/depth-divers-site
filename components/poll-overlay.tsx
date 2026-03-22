"use client";

import { useState, useEffect, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";
import { getPlayerColor } from "@/lib/players";

interface PollData {
  id: string;
  question: string;
  options: string[];
  anonymous: boolean;
  showResults: boolean;
  status: string;
  votes: Record<string, number>;
}

export function PollOverlay() {
  const { effectivePlayer, effectiveIsDM } = usePlayer();
  const [poll, setPoll] = useState<PollData | null>(null);
  const [voted, setVoted] = useState(false);
  const [myVote, setMyVote] = useState<number | null>(null);

  const fetchPoll = useCallback(async () => {
    try {
      const res = await fetch("/api/polls/active");
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          setPoll(data);
          if (effectivePlayer && data.votes && data.votes[effectivePlayer] !== undefined) {
            setVoted(true);
            setMyVote(data.votes[effectivePlayer]);
          }
        } else {
          if (poll) {
            // Poll was closed
            setPoll(null);
            setVoted(false);
            setMyVote(null);
          }
        }
      }
    } catch {}
  }, [effectivePlayer, poll]);

  useEffect(() => {
    fetchPoll();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchPoll();
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchPoll]);

  const handleVote = async (optionIndex: number) => {
    if (!effectivePlayer || voted) return;
    await fetch(`/api/polls/${poll!.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: effectivePlayer, optionIndex }),
    });
    setVoted(true);
    setMyVote(optionIndex);
    fetchPoll();
  };

  // DM doesn't see the overlay — they manage from DM area
  if (effectiveIsDM || !poll || poll.status !== "active") return null;

  const totalVotes = Object.keys(poll.votes).length;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-lg border border-gold/30 bg-surface p-6">
        <p className="mb-1 text-[10px] text-gray-500">Poll from the DM</p>
        <h2 className="mb-4 font-cinzel text-xl font-bold text-gold">
          {poll.question}
        </h2>

        {!voted ? (
          <div className="flex flex-col gap-2">
            {poll.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleVote(i)}
                className="min-h-[48px] rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-bold text-gray-200 transition-colors hover:border-gold hover:bg-gold/10"
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {poll.options.map((option, i) => {
              const count = Object.values(poll.votes).filter((v) => v === i).length;
              const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isMyVote = myVote === i;

              return (
                <div
                  key={i}
                  className={`rounded-lg border px-4 py-3 ${
                    isMyVote
                      ? "border-gold bg-gold/10"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isMyVote ? "text-gold" : "text-gray-300"}`}>
                      {option}
                    </span>
                    {poll.showResults && (
                      <span className="text-xs text-gray-500">{count} ({percent}%)</span>
                    )}
                  </div>
                  {poll.showResults && (
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full bg-gold transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                  {/* Show who voted (non-anonymous) */}
                  {poll.showResults && !poll.anonymous && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(poll.votes)
                        .filter(([, v]) => v === i)
                        .map(([name]) => (
                          <span
                            key={name}
                            className="text-[10px] font-bold"
                            style={{ color: getPlayerColor(name) }}
                          >
                            {name}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}

            {!poll.showResults && (
              <p className="mt-2 text-center text-xs text-gray-500">
                Waiting for results...
              </p>
            )}

            <p className="mt-2 text-center text-[10px] text-gray-600">
              Your vote has been recorded. {voted && "✓"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
