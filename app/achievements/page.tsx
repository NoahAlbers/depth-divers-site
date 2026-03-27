"use client";

import { useState, useEffect, useMemo } from "react";
import { usePlayer } from "@/lib/player-context";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { AchievementDetail } from "@/components/achievements/achievement-detail";
import { getPlayerColor } from "@/lib/players";

interface AchievementDef {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  hidden: boolean;
  icon: string;
  order: number;
}

interface PlayerAward {
  id: string;
  playerName: string;
  achievementSlug: string;
  awardedAt: string;
  awardedBy: string;
  note: string | null;
  sessionNumber: number | null;
}

const PLAYER_NAMES = ["Mykolov", "Brent", "Jonathan", "Justin", "Eric", "Matthew", "Noah"];

export default function AchievementsPage() {
  const { currentPlayer } = usePlayer();
  const [definitions, setDefinitions] = useState<AchievementDef[]>([]);
  const [awards, setAwards] = useState<PlayerAward[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/achievements").then((r) => r.json()),
      fetch("/api/achievements/players").then((r) => r.json()),
    ]).then(([defsData, awardsData]) => {
      setDefinitions(defsData.definitions || []);
      setAwards(awardsData.awards || []);
      setLoading(false);
    });
  }, []);

  // Group awards by slug
  const awardsBySlug = useMemo(() => {
    const map: Record<string, PlayerAward[]> = {};
    for (const award of awards) {
      if (!map[award.achievementSlug]) map[award.achievementSlug] = [];
      map[award.achievementSlug].push(award);
    }
    return map;
  }, [awards]);

  // Determine which achievements are unlocked for the filter
  const isUnlocked = (slug: string): boolean => {
    if (filter === "All") {
      return (awardsBySlug[slug]?.length || 0) > 0;
    }
    return (awardsBySlug[slug] || []).some((a) => a.playerName === filter);
  };

  // Group definitions by category
  const categories = useMemo(() => {
    const catMap: Record<string, AchievementDef[]> = {};
    for (const def of definitions) {
      if (!catMap[def.category]) catMap[def.category] = [];
      catMap[def.category].push(def);
    }
    return Object.entries(catMap);
  }, [definitions]);

  // Progress bar: visible achievements only
  const visibleDefs = definitions.filter((d) => !d.hidden);
  const filterAwards = filter === "All" ? awards : awards.filter((a) => a.playerName === filter);
  const unlockedVisible = visibleDefs.filter((d) =>
    filterAwards.some((a) => a.achievementSlug === d.slug)
  ).length;
  const progressPct = visibleDefs.length > 0 ? Math.round((unlockedVisible / visibleDefs.length) * 100) : 0;

  const selectedDef = selectedSlug ? definitions.find((d) => d.slug === selectedSlug) : null;

  if (!currentPlayer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Log in to view achievements.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-cinzel text-3xl font-bold text-gold">Achievements</h1>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("All")}
          className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${
            filter === "All"
              ? "bg-gold/20 text-gold ring-1 ring-gold/50"
              : "bg-surface text-gray-400 hover:text-gray-200"
          }`}
        >
          All
        </button>
        {PLAYER_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => setFilter(name)}
            className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${
              filter === name
                ? "ring-1"
                : "bg-surface text-gray-400 hover:text-gray-200"
            }`}
            style={
              filter === name
                ? {
                    backgroundColor: getPlayerColor(name) + "20",
                    color: getPlayerColor(name),
                    borderColor: getPlayerColor(name) + "50",
                  }
                : undefined
            }
          >
            {name}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {filter === "All" ? "Global" : filter} Progress
          </span>
          <span className="text-sm font-bold text-gold">
            {unlockedVisible}/{visibleDefs.length} ({progressPct}%)
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      {categories.map(([category, defs]) => (
        <div key={category}>
          <h2 className="mb-3 font-cinzel text-lg font-bold text-gray-300">
            {category}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {defs.map((def) => (
              <AchievementCard
                key={def.slug}
                slug={def.slug}
                name={def.name}
                description={def.description}
                icon={def.icon}
                hidden={def.hidden}
                unlocked={isUnlocked(def.slug)}
                earners={awardsBySlug[def.slug]?.map((a) => a.playerName)}
                onClick={() => isUnlocked(def.slug) && setSelectedSlug(def.slug)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Detail Modal */}
      {selectedDef && (
        <AchievementDetail
          name={selectedDef.name}
          description={selectedDef.description}
          icon={selectedDef.icon}
          hidden={selectedDef.hidden}
          category={selectedDef.category}
          awards={awardsBySlug[selectedDef.slug] || []}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
