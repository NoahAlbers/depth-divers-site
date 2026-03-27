"use client";

import { useEffect } from "react";
import { getPlayerColor } from "@/lib/players";

interface Award {
  playerName: string;
  awardedAt: string;
  note: string | null;
  sessionNumber: number | null;
}

interface AchievementDetailProps {
  name: string;
  description: string;
  icon: string;
  hidden: boolean;
  category: string;
  awards: Award[];
  onClose: () => void;
}

export function AchievementDetail({
  name,
  description,
  icon,
  hidden,
  category,
  awards,
  onClose,
}: AchievementDetailProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border-2 border-gold/40 bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="text-4xl">{icon}</span>
          <div className="flex-1">
            <h2 className="font-cinzel text-xl font-bold text-gold">{name}</h2>
            {hidden && (
              <span className="text-xs font-bold text-gold/70">🔓 Secret Achievement</span>
            )}
            <p className="mt-1 text-sm text-gray-300">{description}</p>
            <p className="mt-1 text-xs text-gray-500">{category}</p>
          </div>
        </div>

        {awards.length > 0 && (
          <div className="border-t border-border pt-3">
            <h3 className="mb-2 text-xs font-bold uppercase text-gray-500">
              Earned by
            </h3>
            <div className="space-y-2">
              {awards.map((award) => (
                <div key={award.playerName} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: getPlayerColor(award.playerName) }}
                  />
                  <span
                    className="text-sm font-bold"
                    style={{ color: getPlayerColor(award.playerName) }}
                  >
                    {award.playerName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(award.awardedAt).toLocaleDateString()}
                  </span>
                  {award.sessionNumber && (
                    <span className="text-xs text-gray-600">
                      Session #{award.sessionNumber}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {awards.some((a) => a.note) && (
              <div className="mt-3 space-y-1">
                {awards
                  .filter((a) => a.note)
                  .map((a) => (
                    <p key={a.playerName} className="text-xs italic text-gray-400">
                      &quot;{a.note}&quot; — {a.playerName}
                    </p>
                  ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded bg-surface-light py-2 text-sm text-gray-300 hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
