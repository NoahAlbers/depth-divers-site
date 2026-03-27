"use client";

import { useState, useEffect, useMemo } from "react";
import { getPlayerColor } from "@/lib/players";

const PLAYER_NAMES = ["Mykolov", "Brent", "Jonathan", "Justin", "Eric", "Matthew", "Noah"];

interface AchievementDef {
  slug: string;
  name: string;
  description: string;
  category: string;
  hidden: boolean;
  icon: string;
}

interface PlayerAward {
  playerName: string;
  achievementSlug: string;
  awardedAt: string;
}

interface AchievementManagerProps {
  dmPassword: string;
}

export function AchievementManager({ dmPassword }: AchievementManagerProps) {
  const [definitions, setDefinitions] = useState<AchievementDef[]>([]);
  const [awards, setAwards] = useState<PlayerAward[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [sessionNum, setSessionNum] = useState("");
  const [awarding, setAwarding] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  // Create custom achievement state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Custom");
  const [newHidden, setNewHidden] = useState(false);
  const [newIcon, setNewIcon] = useState("🏆");

  const fetchData = () => {
    Promise.all([
      fetch("/api/achievements").then((r) => r.json()),
      fetch("/api/achievements/players").then((r) => r.json()),
    ]).then(([d, a]) => {
      setDefinitions(d.definitions || []);
      setAwards(a.awards || []);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const awardedByPlayer = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const a of awards) {
      if (!map[a.playerName]) map[a.playerName] = new Set();
      map[a.playerName].add(a.achievementSlug);
    }
    return map;
  }, [awards]);

  // Filter: unearned by ALL selected players
  const filteredDefs = useMemo(() => {
    let defs = definitions;
    if (selectedPlayers.length > 0) {
      defs = defs.filter((d) =>
        selectedPlayers.some((p) => !awardedByPlayer[p]?.has(d.slug))
      );
    }
    if (search) {
      const q = search.toLowerCase();
      defs = defs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }
    return defs;
  }, [definitions, selectedPlayers, search, awardedByPlayer]);

  const handleAward = async (slug: string) => {
    if (selectedPlayers.length === 0) return;
    setAwarding(slug);
    await fetch("/api/achievements/award", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dm-password": dmPassword,
      },
      body: JSON.stringify({
        playerNames: selectedPlayers,
        achievementSlug: slug,
        note: note || null,
        sessionNumber: sessionNum ? parseInt(sessionNum) : null,
      }),
    });
    setAwarding(null);
    setNote("");
    setSessionNum("");
    fetchData();
  };

  const handleRevoke = async (playerName: string, slug: string) => {
    await fetch("/api/achievements/revoke", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-dm-password": dmPassword,
      },
      body: JSON.stringify({ playerName, achievementSlug: slug }),
    });
    fetchData();
  };

  const handleCreate = async () => {
    if (!newName || !newDesc) return;
    await fetch("/api/achievements/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dm-password": dmPassword,
      },
      body: JSON.stringify({
        name: newName,
        description: newDesc,
        category: newCategory,
        hidden: newHidden,
        icon: newIcon,
      }),
    });
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    fetchData();
  };

  const togglePlayer = (name: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h2 className="font-cinzel text-lg font-bold text-gold">Achievements</h2>
        </div>
        <span className="text-gray-500">{collapsed ? "▸" : "▾"}</span>
      </button>

      {!collapsed && (
        <div className="mt-4 space-y-4">
          {/* Player selection */}
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-400">
              Select Player(s) to Award
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLAYER_NAMES.map((name) => (
                <button
                  key={name}
                  onClick={() => togglePlayer(name)}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition-colors ${
                    selectedPlayers.includes(name)
                      ? "ring-1"
                      : "bg-surface-light text-gray-400"
                  }`}
                  style={
                    selectedPlayers.includes(name)
                      ? {
                          backgroundColor: getPlayerColor(name) + "20",
                          color: getPlayerColor(name),
                        }
                      : undefined
                  }
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Optional note + session */}
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="DM note (optional)"
              className="flex-1 rounded border border-gray-700 bg-background px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-gold focus:outline-none"
            />
            <input
              value={sessionNum}
              onChange={(e) => setSessionNum(e.target.value)}
              placeholder="Session #"
              type="number"
              className="w-20 rounded border border-gray-700 bg-background px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-gold focus:outline-none"
            />
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search achievements..."
            className="w-full rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none"
          />

          {/* Achievement list */}
          <div className="max-h-[400px] space-y-1 overflow-y-auto">
            {filteredDefs.map((def) => {
              const isAwarded = selectedPlayers.length > 0 &&
                selectedPlayers.every((p) => awardedByPlayer[p]?.has(def.slug));
              return (
                <div
                  key={def.slug}
                  className="flex items-center justify-between rounded border border-border bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span>{def.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-200">
                        {def.name}
                        {def.hidden && (
                          <span className="ml-1 text-[10px] text-gray-500">🔒</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-gray-500">{def.description}</p>
                    </div>
                  </div>
                  {isAwarded ? (
                    <button
                      onClick={() =>
                        selectedPlayers.forEach((p) => handleRevoke(p, def.slug))
                      }
                      className="ml-2 flex-shrink-0 rounded bg-red-600/20 px-2 py-1 text-xs font-bold text-red-400 hover:bg-red-600/30"
                    >
                      Revoke
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAward(def.slug)}
                      disabled={selectedPlayers.length === 0 || awarding === def.slug}
                      className="ml-2 flex-shrink-0 rounded bg-gold/20 px-2 py-1 text-xs font-bold text-gold hover:bg-gold/30 disabled:opacity-30"
                    >
                      {awarding === def.slug ? "..." : "Award"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create custom */}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-xs font-bold text-gold hover:underline"
          >
            + Create Custom Achievement
          </button>

          {showCreate && (
            <div className="space-y-2 rounded border border-border bg-background p-3">
              <div className="flex gap-2">
                <input
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-12 rounded border border-gray-700 bg-surface px-2 py-1 text-center text-lg"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Achievement name"
                  className="flex-1 rounded border border-gray-700 bg-surface px-2 py-1 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description"
                className="w-full rounded border border-gray-700 bg-surface px-2 py-1 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none"
              />
              <div className="flex items-center gap-3">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category"
                  className="flex-1 rounded border border-gray-700 bg-surface px-2 py-1 text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none"
                />
                <label className="flex items-center gap-1 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={newHidden}
                    onChange={(e) => setNewHidden(e.target.checked)}
                    className="rounded"
                  />
                  Hidden
                </label>
              </div>
              <button
                onClick={handleCreate}
                disabled={!newName || !newDesc}
                className="rounded bg-gold px-3 py-1.5 text-xs font-bold text-background hover:bg-[#f0d090] disabled:opacity-50"
              >
                Create
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
