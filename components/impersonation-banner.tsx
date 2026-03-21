"use client";

import { usePlayer } from "@/lib/player-context";
import { getPlayerColor } from "@/lib/players";

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedPlayer, stopImpersonating } = usePlayer();

  if (!isImpersonating || !impersonatedPlayer) return null;

  const color = getPlayerColor(impersonatedPlayer);

  return (
    <div
      className="sticky top-0 z-[60] flex items-center justify-center gap-3 px-4 py-2 text-sm"
      style={{
        backgroundColor: `${color}15`,
        borderBottom: `2px solid ${color}40`,
      }}
    >
      <span className="text-gray-300">
        👁 Viewing as{" "}
        <span className="font-bold" style={{ color }}>
          {impersonatedPlayer}
        </span>
      </span>
      <span className="text-gray-600">—</span>
      <button
        onClick={stopImpersonating}
        className="font-bold text-red-400 transition-colors hover:text-red-300"
      >
        Exit
      </button>
    </div>
  );
}
