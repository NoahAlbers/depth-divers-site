"use client";

import { useState, useEffect, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";
import { PLAYERS, getPlayerColor, POLL_INTERVAL_MS } from "@/lib/players";
import { DmGate } from "@/components/dm-gate";

interface InitiativeEntry {
  id: string;
  name: string;
  roll: number;
  isPlayer: boolean;
  isActive: boolean;
  order: number;
}

interface InitiativeState {
  round: number;
  isActive: boolean;
}

function dmHeaders(): Record<string, string> {
  return { "x-dm-password": localStorage.getItem("dnd-dm-password") || "noah" };
}

export default function InitiativePage() {
  const { isDM } = usePlayer();
  const [entries, setEntries] = useState<InitiativeEntry[]>([]);
  const [state, setState] = useState<InitiativeState>({
    round: 1,
    isActive: false,
  });
  const [newName, setNewName] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [newIsPlayer, setNewIsPlayer] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/initiative");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setState(data.state);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchData();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const addEntry = async () => {
    if (!newName.trim() || newRoll === "") return;
    await fetch("/api/initiative", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...dmHeaders() },
      body: JSON.stringify({
        name: newName.trim(),
        roll: Number(newRoll),
        isPlayer: newIsPlayer,
      }),
    });
    setNewName("");
    setNewRoll("");
    fetchData();
  };

  const removeEntry = async (id: string) => {
    await fetch(`/api/initiative/${id}`, {
      method: "DELETE",
      headers: dmHeaders(),
    });
    fetchData();
  };

  const saveEdit = async (id: string) => {
    await fetch(`/api/initiative/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...dmHeaders() },
      body: JSON.stringify({ name: editName, roll: Number(editRoll) }),
    });
    setEditingId(null);
    fetchData();
  };

  const advanceTurn = async () => {
    await fetch("/api/initiative/advance", {
      method: "POST",
      headers: dmHeaders(),
    });
    fetchData();
  };

  const resetEncounter = async () => {
    await fetch("/api/initiative/reset", {
      method: "POST",
      headers: dmHeaders(),
    });
    setShowResetConfirm(false);
    fetchData();
  };

  const quickAddPlayers = async () => {
    for (const player of PLAYERS) {
      await fetch("/api/initiative", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...dmHeaders() },
        body: JSON.stringify({
          name: player.name,
          roll: 0,
          isPlayer: true,
        }),
      });
    }
    fetchData();
  };

  return (
    <div>
      <h1 className="mb-2 font-cinzel text-3xl font-bold text-gold">
        Initiative Tracker
      </h1>

      {!state.isActive && entries.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <p className="mb-4 text-lg text-gray-400">
            Waiting for encounter...
          </p>
          <DmGate>
            <div className="flex gap-3">
              <button
                onClick={quickAddPlayers}
                className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090]"
              >
                Quick Add Players
              </button>
            </div>
          </DmGate>
        </div>
      ) : (
        <>
          {/* Round counter */}
          <div className="mb-6 flex items-center gap-4">
            <span className="rounded bg-surface px-3 py-1 text-sm">
              Round{" "}
              <span className="font-bold text-gold">{state.round}</span>
            </span>
            <DmGate>
              <button
                onClick={advanceTurn}
                className="rounded bg-gold px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-[#f0d090]"
              >
                Next Turn
              </button>
            </DmGate>
          </div>

          {/* Initiative list */}
          <div className="mb-6 flex flex-col gap-2">
            {entries.map((entry) => {
              const color = entry.isPlayer
                ? getPlayerColor(entry.name)
                : "#ef4444";
              const isEditing = editingId === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                    entry.isActive
                      ? "border-gold bg-gold/10 shadow-[0_0_15px_rgba(229,192,123,0.2)]"
                      : "border-border bg-surface"
                  }`}
                >
                  {/* Active indicator */}
                  {entry.isActive && (
                    <span className="text-gold">&#9654;</span>
                  )}

                  {/* Roll value */}
                  <span
                    className="w-10 text-center text-lg font-bold"
                    style={{ color }}
                  >
                    {entry.roll}
                  </span>

                  {/* Name */}
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-32 rounded border border-gray-700 bg-background px-2 py-1 text-sm text-white"
                      />
                      <input
                        type="number"
                        value={editRoll}
                        onChange={(e) => setEditRoll(e.target.value)}
                        className="w-16 rounded border border-gray-700 bg-background px-2 py-1 text-sm text-white"
                      />
                      <button
                        onClick={() => saveEdit(entry.id)}
                        className="text-sm text-green-400 hover:text-green-300"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      className="flex-1 font-bold"
                      style={{ color }}
                    >
                      {entry.name}
                      {!entry.isPlayer && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Monster)
                        </span>
                      )}
                    </span>
                  )}

                  {/* DM controls */}
                  <DmGate>
                    {!isEditing && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(entry.id);
                            setEditName(entry.name);
                            setEditRoll(String(entry.roll));
                          }}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </DmGate>
                </div>
              );
            })}
          </div>

          {/* DM: Add entry + controls */}
          <DmGate>
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-3 font-cinzel text-sm font-bold text-gold">
                Add Entry
              </h3>
              <div className="mb-3 flex flex-wrap gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-500"
                />
                <input
                  type="number"
                  value={newRoll}
                  onChange={(e) => setNewRoll(e.target.value)}
                  placeholder="Roll"
                  className="w-20 rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-500"
                />
                <label className="flex items-center gap-1 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={!newIsPlayer}
                    onChange={(e) => setNewIsPlayer(!e.target.checked)}
                    className="rounded"
                  />
                  Monster
                </label>
                <button
                  onClick={addEntry}
                  disabled={!newName.trim() || newRoll === ""}
                  className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090] disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-gray-700 pt-3">
                <button
                  onClick={quickAddPlayers}
                  className="rounded border border-gold/30 px-3 py-1 text-xs text-gold hover:bg-gold/10"
                >
                  Quick Add Players
                </button>
                {showResetConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Are you sure?</span>
                    <button
                      onClick={resetEncounter}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-500"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    Reset Encounter
                  </button>
                )}
              </div>
            </div>
          </DmGate>
        </>
      )}
    </div>
  );
}
