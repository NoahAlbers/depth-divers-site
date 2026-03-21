"use client";

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
}

interface ActiveResponse {
  session: SessionData | null;
  lastUpdated: string;
}

export default function GamesPage() {
  const { currentPlayer, effectivePlayer } = usePlayer();
  const router = useRouter();
  const { data } = usePolling<ActiveResponse>("/api/games/active");

  const session = data?.session;

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

      {session ? (
        <div className="mx-auto max-w-lg">
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
                {session.players.length} player
                {session.players.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-gray-500 uppercase">
                {session.difficulty}
              </span>
            </div>
            <p className="mt-3 text-sm text-gold">Tap to enter</p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <div className="mb-4 text-6xl opacity-30">🎮</div>
          <p className="text-lg text-gray-400">No active game right now</p>
          <p className="mt-1 text-sm text-gray-600">
            The DM will launch a game when the time comes.
          </p>
        </div>
      )}
    </div>
  );
}
