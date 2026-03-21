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
  phase: "idle" | "entry" | "locked";
}

function dmHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-dm-password": localStorage.getItem("dnd-dm-password") || "noah",
  };
}

export default function InitiativePage() {
  const { isDM, currentPlayer, effectivePlayer, effectiveIsDM } = usePlayer();
  const [entries, setEntries] = useState<InitiativeEntry[]>([]);
  const [state, setState] = useState<InitiativeState>({
    round: 1,
    isActive: false,
    phase: "idle",
  });
  const [newName, setNewName] = useState("");
  const [newRoll, setNewRoll] = useState("");
  const [newIsPlayer, setNewIsPlayer] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [myRoll, setMyRoll] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const startEncounter = async (quickAdd: boolean) => {
    await fetch("/api/initiative/start", {
      method: "POST",
      headers: dmHeaders(),
      body: JSON.stringify({ quickAdd }),
    });
    fetchData();
  };

  const submitRoll = async () => {
    if (!effectivePlayer || myRoll === "") return;
    setSubmitting(true);
    await fetch("/api/initiative/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: effectivePlayer, roll: Number(myRoll) }),
    });
    setSubmitting(false);
    fetchData();
  };

  const lockInitiative = async () => {
    await fetch("/api/initiative/lock", {
      method: "POST",
      headers: dmHeaders(),
    });
    fetchData();
  };

  const addEntry = async () => {
    if (!newName.trim() || newRoll === "") return;
    await fetch("/api/initiative", {
      method: "POST",
      headers: dmHeaders(),
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
      headers: { "x-dm-password": localStorage.getItem("dnd-dm-password") || "noah" },
    });
    fetchData();
  };

  const saveEdit = async (id: string) => {
    await fetch(`/api/initiative/${id}`, {
      method: "PUT",
      headers: dmHeaders(),
      body: JSON.stringify({ name: editName, roll: Number(editRoll) }),
    });
    setEditingId(null);
    fetchData();
  };

  const advanceTurn = async () => {
    await fetch("/api/initiative/advance", {
      method: "POST",
      headers: { "x-dm-password": localStorage.getItem("dnd-dm-password") || "noah" },
    });
    fetchData();
  };

  const resetEncounter = async () => {
    await fetch("/api/initiative/reset", {
      method: "POST",
      headers: { "x-dm-password": localStorage.getItem("dnd-dm-password") || "noah" },
    });
    setShowResetConfirm(false);
    fetchData();
  };

  const phase = state.phase || "idle";
  const myEntry = entries.find((e) => e.name === effectivePlayer && e.isPlayer);
  const hasSubmitted = !!myEntry && myEntry.roll !== 0;
  const playerEntries = entries.filter((e) => e.isPlayer);

  return (
    <div>
      <h1 className="mb-2 font-cinzel text-3xl font-bold text-gold">
        Initiative Tracker
      </h1>

      {/* === IDLE PHASE === */}
      {phase === "idle" && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <p className="mb-4 text-lg text-gray-400">
            Waiting for encounter...
          </p>
          <DmGate>
            <div className="flex gap-3">
              <button
                onClick={() => startEncounter(true)}
                className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090]"
              >
                Start Encounter (Quick Add)
              </button>
              <button
                onClick={() => startEncounter(false)}
                className="rounded border border-gold/30 px-4 py-2 text-sm text-gold hover:bg-gold/10"
              >
                Start Empty
              </button>
            </div>
          </DmGate>
        </div>
      )}

      {/* === ENTRY PHASE === */}
      {phase === "entry" && (
        <>
          <div className="mb-4 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
            <p className="text-sm font-bold text-gold">
              Roll Initiative! Submit your roll below.
            </p>
          </div>

          {/* Player self-submission */}
          {effectivePlayer && !effectiveIsDM && (
            <div className="mb-6 rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-3 font-cinzel text-sm font-bold text-gold">
                Your Roll
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className="font-bold"
                  style={{ color: getPlayerColor(effectivePlayer) }}
                >
                  {effectivePlayer}
                </span>
                <input
                  type="number"
                  value={myRoll}
                  onChange={(e) => setMyRoll(e.target.value)}
                  placeholder="Roll"
                  className="w-24 rounded border border-gray-700 bg-background px-3 py-2 text-center text-lg font-bold text-white placeholder-gray-500"
                />
                <button
                  onClick={submitRoll}
                  disabled={myRoll === "" || submitting}
                  className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090] disabled:opacity-50"
                >
                  {hasSubmitted ? "Update" : "Submit"}
                </button>
                {hasSubmitted && (
                  <span className="text-sm text-green-400">
                    &#10003; Submitted ({myEntry!.roll})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submission status */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-bold text-gray-400">
              Submissions
            </h3>
            <div className="flex flex-col gap-2">
              {PLAYERS.map((player) => {
                const entry = playerEntries.find(
                  (e) => e.name === player.name
                );
                const submitted = !!entry && entry.roll !== 0;
                return (
                  <div
                    key={player.name}
                    className="flex items-center gap-3 rounded border border-border bg-surface px-4 py-2"
                  >
                    <span
                      className="font-bold"
                      style={{ color: player.color }}
                    >
                      {player.name}
                    </span>
                    <span className="flex-1" />
                    {submitted ? (
                      <>
                        <span className="text-green-400">&#10003;</span>
                        {effectiveIsDM && (
                          <span className="text-sm font-bold text-white">
                            {entry!.roll}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Waiting...</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DM: Add monsters + Lock */}
          <DmGate>
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-3 font-cinzel text-sm font-bold text-gold">
                Add Monster
              </h3>
              <div className="mb-3 flex flex-wrap gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Monster name"
                  className="flex-1 rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-500"
                />
                <input
                  type="number"
                  value={newRoll}
                  onChange={(e) => setNewRoll(e.target.value)}
                  placeholder="Roll"
                  className="w-20 rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white placeholder-gray-500"
                />
                <button
                  onClick={() => {
                    setNewIsPlayer(false);
                    addEntry();
                  }}
                  disabled={!newName.trim() || newRoll === ""}
                  className="rounded bg-red-600/80 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Add Monster
                </button>
              </div>

              {/* Monster entries */}
              {entries
                .filter((e) => !e.isPlayer)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="mb-1 flex items-center gap-2 text-sm"
                  >
                    <span className="font-bold text-red-400">
                      {entry.name}
                    </span>
                    <span className="text-gray-400">({entry.roll})</span>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}

              <div className="mt-4 flex gap-2 border-t border-gray-700 pt-3">
                <button
                  onClick={lockInitiative}
                  className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090]"
                >
                  Lock &amp; Sort
                </button>
                <button
                  onClick={resetEncounter}
                  className="rounded border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                >
                  Cancel Encounter
                </button>
              </div>
            </div>
          </DmGate>
        </>
      )}

      {/* === LOCKED PHASE === */}
      {phase === "locked" && (
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
                  {entry.isActive && (
                    <span className="text-gold">&#9654;</span>
                  )}

                  <span
                    className="w-10 text-center text-lg font-bold"
                    style={{ color }}
                  >
                    {entry.roll}
                  </span>

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
                    <span className="flex-1 font-bold" style={{ color }}>
                      {entry.name}
                      {!entry.isPlayer && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Monster)
                        </span>
                      )}
                    </span>
                  )}

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
                {showResetConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">
                      Are you sure?
                    </span>
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
