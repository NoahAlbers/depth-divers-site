"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/lib/player-context";
import { usePolling } from "@/lib/polling";
import { getGameById } from "@/lib/games/registry";

interface SessionData {
  id: string;
  gameId: string;
  status: string;
  difficulty: string;
  players: string[];
  results: { playerName: string; score: number }[];
  createdAt: string;
}

interface ActiveResponse {
  session: SessionData | null;
  lastUpdated: string;
}

export default function GamesPage() {
  const { currentPlayer, effectivePlayer, effectiveIsDM } = usePlayer();
  const router = useRouter();
  const { data } = usePolling<ActiveResponse>("/api/games/active");
  const [history, setHistory] = useState<SessionData[]>([]);

  const session = data?.session;

  // Fetch game history
  useEffect(() => {
    fetch("/api/games/history")
      .then((r) => r.json())
      .then((data) => setHistory(data.sessions || []))
      .catch(() => {});
  }, []);

  const handleDeleteHistory = async (sessionId: string) => {
    if (!confirm("Delete this game from history?")) return;
    const dmPw = localStorage.getItem("dnd-dm-password") || "";
    await fetch(`/api/games/${sessionId}`, {
      method: "DELETE",
      headers: { "x-dm-password": dmPw },
    });
    setHistory((prev) => prev.filter((s) => s.id !== sessionId));
  };

  if (!currentPlayer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Log in to play games.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-cinzel text-3xl font-bold text-gold">Games</h1>

      {/* Active game */}
      {session ? (
        <div className="mx-auto mb-8 max-w-lg">
          <div
            className="card-glow cursor-pointer rounded-lg border border-gold bg-surface p-6 text-center transition-all hover:shadow-[0_0_30px_rgba(229,192,123,0.2)]"
            onClick={() => router.push(`/games/${session.id}`)}
          >
            <div className="mb-2 text-4xl">
              {getGameById(session.gameId)?.icon || "🎮"}
            </div>
            <h2 className="font-cinzel text-xl font-bold text-gold">
              {getGameById(session.gameId)?.name || session.gameId}
            </h2>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  session.status === "lobby"
                    ? "bg-gold/20 text-gold"
                    : session.status === "active"
                      ? "bg-green-900/30 text-green-400"
                      : "bg-gray-700 text-gray-300"
                }`}
              >
                {session.status.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                {session.players.length} player{session.players.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-gray-500 uppercase">{session.difficulty}</span>
            </div>
            <p className="mt-3 text-sm text-gold">Tap to enter</p>
          </div>
        </div>
      ) : (
        <div className="mb-8 flex min-h-[20vh] flex-col items-center justify-center">
          <div className="mb-4 text-6xl opacity-30">🎮</div>
          <p className="text-lg text-gray-400">No active game right now</p>
          <p className="mt-1 text-sm text-gray-600">
            The DM will launch a game when the time comes.
          </p>
        </div>
      )}

      {/* Game History */}
      {history.length > 0 && (
        <div>
          <h2 className="mb-4 font-cinzel text-xl font-bold text-gold">History</h2>
          <div className="flex flex-col gap-3">
            {history.map((s) => {
              const game = getGameById(s.gameId);
              const sorted = [...s.results].sort((a, b) => {
                const cat = game?.category;
                const lower = cat === "race" || cat === "puzzle";
                return lower ? a.score - b.score : b.score - a.score;
              });

              return (
                <div
                  key={s.id}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{game?.icon || "🎮"}</span>
                      <span className="text-sm font-bold text-gray-200">
                        {game?.name || s.gameId}
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase">
                        {s.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                      {effectiveIsDM && (
                        <button
                          onClick={() => handleDeleteHistory(s.id)}
                          className="text-[10px] text-red-400/40 hover:text-red-400"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  {sorted.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sorted.map((r, i) => (
                        <span
                          key={r.playerName}
                          className="text-xs text-gray-400"
                        >
                          {i + 1}. {r.playerName}: {r.score}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
