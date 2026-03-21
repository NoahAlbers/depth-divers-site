"use client";

import { getPlayerColor } from "@/lib/players";
import { getGameById } from "@/lib/games/registry";

interface GameResult {
  playerName: string;
  score: number;
  completedAt: string;
  metadata?: Record<string, unknown>;
}

interface GameLeaderboardProps {
  gameId: string;
  results: GameResult[];
  category: string;
}

export function GameLeaderboard({
  gameId,
  results,
  category,
}: GameLeaderboardProps) {
  const game = getGameById(gameId);

  // Sort: for "race" and "puzzle" lower is better (time); for "reflex" and "memory" higher is better
  const lowerIsBetter = category === "race" || category === "puzzle";
  const sorted = [...results].sort((a, b) =>
    lowerIsBetter ? a.score - b.score : b.score - a.score
  );

  const rankColors = ["#e5c07b", "#c0c0c0", "#cd7f32"]; // gold, silver, bronze

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="mb-4 text-center">
          <div className="mb-2 text-4xl">{game?.icon || "🏆"}</div>
          <h2 className="font-cinzel text-xl font-bold text-gold">Results</h2>
          <p className="text-sm text-gray-500">{game?.name || gameId}</p>
        </div>

        {sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No results yet...
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((result, i) => {
              const color = getPlayerColor(result.playerName);
              const rankColor = i < 3 ? rankColors[i] : undefined;

              return (
                <div
                  key={result.playerName}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    i === 0
                      ? "border-gold/30 bg-gold/5"
                      : "border-border bg-background"
                  }`}
                >
                  <span
                    className="w-8 text-center text-lg font-bold"
                    style={{ color: rankColor || "#666" }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 font-bold" style={{ color }}>
                    {result.playerName}
                  </span>
                  <span className="text-sm font-bold text-gray-300">
                    {lowerIsBetter
                      ? `${result.score.toFixed(1)}s`
                      : result.score}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
