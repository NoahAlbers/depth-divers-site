"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getPlayerColor } from "@/lib/players";
import { OnlineStatus } from "@/components/online-status";
import { usePlayerColors } from "@/lib/player-colors-context";
import Link from "next/link";

interface ProfileData {
  name: string;
  color: string | null;
  onlineStatus: "online" | "away" | "offline";
  lastOnline: string | null;
  characterSheet: {
    characterName: string;
    race: string | null;
    class: string | null;
    level: number;
    movementSpeed: number;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  } | null;
  achievementCount: number;
  recentAchievements: Array<{
    achievementSlug: string;
    awardedAt: string;
    definition: {
      name: string;
      icon: string;
      description: string;
    } | null;
  }>;
  gameStats: {
    totalGames: number;
    wins: number;
    highestScores: Record<string, number>;
  };
  memberId: string;
}

function abilityMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function ProfilePage() {
  const params = useParams();
  const playerName = params.playerName as string;
  const { getColor } = usePlayerColors();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${encodeURIComponent(playerName)}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerName]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Player not found.</p>
      </div>
    );
  }

  const color = getColor(profile.name) || getPlayerColor(profile.name);
  const cs = profile.characterSheet;
  const abilities = cs
    ? [
        { name: "STR", score: cs.strength },
        { name: "DEX", score: cs.dexterity },
        { name: "CON", score: cs.constitution },
        { name: "INT", score: cs.intelligence },
        { name: "WIS", score: cs.wisdom },
        { name: "CHA", score: cs.charisma },
      ]
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="mt-1 h-12 w-12 flex-shrink-0 rounded-full border-2"
          style={{ backgroundColor: color + "30", borderColor: color }}
        />
        <div className="flex-1">
          <h1 className="font-cinzel text-3xl font-bold" style={{ color }}>
            {profile.name}
          </h1>
          {cs?.characterName && (
            <p className="text-lg text-gray-400">{cs.characterName}</p>
          )}
          {cs?.race && cs?.class && (
            <p className="text-sm text-gray-500">
              Level {cs.level} {cs.race} {cs.class}
            </p>
          )}
          {(!cs?.race || !cs?.class) && cs && (
            <p className="text-sm text-gray-500">Level {cs.level}</p>
          )}
          <div className="mt-1">
            <OnlineStatus status={profile.onlineStatus} lastOnline={profile.lastOnline} />
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      {cs && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">Ability Scores</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {abilities.map((a) => {
              const mod = Math.floor((a.score - 10) / 2);
              return (
                <div
                  key={a.name}
                  className="flex flex-col items-center rounded border border-border bg-background p-2"
                >
                  <span className="text-[10px] font-bold text-gray-500">{a.name}</span>
                  <span className="text-xl font-bold text-white">{a.score}</span>
                  <span
                    className={`text-xs font-bold ${
                      mod >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {abilityMod(a.score)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-cinzel text-lg font-bold text-gold">Achievements</h2>
          <Link href="/achievements" className="text-sm text-gold hover:underline">
            View all
          </Link>
        </div>
        <p className="mb-3 text-sm text-gray-400">
          {profile.achievementCount} achievement{profile.achievementCount !== 1 ? "s" : ""} earned
        </p>
        {profile.recentAchievements.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.recentAchievements.map((a) => (
              <div
                key={a.achievementSlug}
                className="flex items-center gap-1.5 rounded border border-gold/30 bg-gold/10 px-2.5 py-1.5 text-sm"
              >
                <span>{a.definition?.icon || "🏆"}</span>
                <span className="text-gold">{a.definition?.name || a.achievementSlug}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No achievements yet.</p>
        )}
      </div>

      {/* Game Stats */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">Game Stats</h2>
        {profile.gameStats.totalGames > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold text-white">{profile.gameStats.totalGames}</p>
              <p className="text-xs text-gray-500">Games Played</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold">{profile.gameStats.wins}</p>
              <p className="text-xs text-gray-500">Wins</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {Object.keys(profile.gameStats.highestScores).length}
              </p>
              <p className="text-xs text-gray-500">Games Tried</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No games played yet.</p>
        )}
      </div>
    </div>
  );
}
