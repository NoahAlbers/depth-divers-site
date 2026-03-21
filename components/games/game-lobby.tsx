"use client";

import { PLAYERS, getPlayerColor } from "@/lib/players";
import { getGameById } from "@/lib/games/registry";

interface GameLobbyProps {
  gameId: string;
  difficulty: string;
  players: string[];
  isDM: boolean;
  currentPlayer: string;
  onJoin: () => void;
  onStart: () => void;
}

export function GameLobby({
  gameId,
  difficulty,
  players,
  isDM,
  currentPlayer,
  onJoin,
  onStart,
}: GameLobbyProps) {
  const game = getGameById(gameId);
  const hasJoined = players.includes(currentPlayer);

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <div className="mb-3 text-5xl">{game?.icon || "🎮"}</div>
        <h2 className="mb-1 font-cinzel text-2xl font-bold text-gold">
          {game?.name || gameId}
        </h2>
        <p className="mb-4 text-sm text-gray-400">{game?.description}</p>

        <div className="mb-6 inline-block rounded bg-surface-light px-3 py-1 text-xs font-bold uppercase text-gray-300">
          {difficulty}
        </div>

        {/* Player list */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-bold text-gray-400">Players</h3>
          <div className="flex flex-col gap-2">
            {PLAYERS.map((p) => {
              const joined = players.includes(p.name);
              return (
                <div
                  key={p.name}
                  className={`flex items-center gap-3 rounded border px-4 py-2 ${
                    joined
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border bg-background"
                  }`}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span
                    className="flex-1 text-left text-sm font-bold"
                    style={{ color: p.color }}
                  >
                    {p.name}
                  </span>
                  {joined ? (
                    <span className="text-xs text-green-400">Joined</span>
                  ) : (
                    <span className="text-xs text-gray-600">Waiting...</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!isDM && !hasJoined && (
            <button
              onClick={onJoin}
              className="w-full rounded bg-gold px-4 py-3 text-sm font-bold text-background transition-colors hover:bg-[#f0d090]"
            >
              Join Game
            </button>
          )}
          {!isDM && hasJoined && (
            <p className="text-sm text-green-400">
              You&apos;re in! Waiting for DM to start...
            </p>
          )}
          {isDM && (
            <button
              onClick={onStart}
              disabled={players.length === 0}
              className="w-full rounded bg-gold px-4 py-3 text-sm font-bold text-background transition-colors hover:bg-[#f0d090] disabled:opacity-50"
            >
              Start Game ({players.length} player{players.length !== 1 ? "s" : ""})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
