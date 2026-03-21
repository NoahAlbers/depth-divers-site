"use client";

import { useState, useEffect, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";
import { PLAYERS, getPlayerColor, POLL_INTERVAL_MS } from "@/lib/players";
import { GAMES } from "@/lib/games/registry";

interface SeatingLockData {
  locked: boolean;
  seats?: Record<number, string>;
  lockedBy?: string;
  lockedAt?: string;
}

interface InitiativeEntry {
  id: string;
  name: string;
  roll: number;
  isPlayer: boolean;
  isActive: boolean;
}

interface InitiativeData {
  entries: InitiativeEntry[];
  state: { round: number; isActive: boolean; phase: string };
}

function dmHeaders(password: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-dm-password": password,
  };
}

export default function DMAreaPage() {
  const { isDM, dmPassword } = usePlayer();

  if (!isDM) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">
          This area is restricted to the Dungeon Master.
        </p>
      </div>
    );
  }

  return <DMDashboard dmPassword={dmPassword || "noah"} />;
}

function DMDashboard({ dmPassword }: { dmPassword: string }) {
  const headers = useCallback(
    () => dmHeaders(dmPassword),
    [dmPassword]
  );

  return (
    <div>
      <h1 className="mb-6 font-cinzel text-3xl font-bold text-gold">
        DM Area
      </h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <RecapRandomizer />
        <SeatingControls headers={headers} />
        <InitiativeControls headers={headers} />
        <GameLauncher headers={headers} />
        <PlaceholderCard title="Session Notes" icon="📝" />
      </div>
    </div>
  );
}

/* ===== RECAP RANDOMIZER ===== */

type Player = { name: string; color: string };

function RecapRandomizer() {
  const [order, setOrder] = useState<Player[] | null>(null);
  const [spinning, setSpinning] = useState(false);

  const shuffle = () => {
    setSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5) as Player[];
      setOrder(shuffled);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 100);
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
        Recap Order
      </h2>
      <button
        onClick={shuffle}
        disabled={spinning}
        className="mb-4 rounded bg-gold px-4 py-2 text-sm font-bold text-background transition-colors hover:bg-[#f0d090] disabled:opacity-50"
      >
        {order ? "Re-roll" : "Randomize Recap Order"}
      </button>
      {order && (
        <ol className="flex flex-col gap-1">
          {order.map((player, i) => (
            <li key={player.name} className="flex items-center gap-3 text-sm">
              <span className="w-6 text-right font-bold text-gray-500">
                {i + 1}.
              </span>
              <span
                className="font-bold"
                style={{ color: player.color }}
              >
                {player.name}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ===== SEATING CONTROLS ===== */

function SeatingControls({
  headers,
}: {
  headers: () => Record<string, string>;
}) {
  const [lockData, setLockData] = useState<SeatingLockData | null>(null);

  const fetchLock = useCallback(async () => {
    try {
      const res = await fetch("/api/seating/lock");
      if (res.ok) setLockData(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchLock();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchLock();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchLock]);

  const handleUnlock = async () => {
    await fetch("/api/seating/lock", {
      method: "DELETE",
      headers: headers(),
    });
    fetchLock();
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
        Seating Lock
      </h2>
      {lockData?.locked && lockData.seats ? (
        <>
          <div className="mb-3 flex gap-4">
            <div className="flex flex-col gap-1">
              {[3, 2, 1].map((seat) => (
                <div
                  key={seat}
                  className="flex items-center gap-1 text-sm"
                >
                  <span className="text-xs text-gray-500">{seat}</span>
                  <span
                    className="font-bold"
                    style={{ color: getPlayerColor(lockData.seats![seat]) }}
                  >
                    {lockData.seats![seat]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {[4, 5, 6].map((seat) => (
                <div
                  key={seat}
                  className="flex items-center gap-1 text-sm"
                >
                  <span className="text-xs text-gray-500">{seat}</span>
                  <span
                    className="font-bold"
                    style={{ color: getPlayerColor(lockData.seats![seat]) }}
                  >
                    {lockData.seats![seat]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleUnlock}
            className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
          >
            Unlock Seating
          </button>
        </>
      ) : (
        <p className="text-sm text-gray-500">
          No seating locked. Visit{" "}
          <a href="/seating" className="text-gold hover:underline">
            /seating
          </a>{" "}
          to lock an arrangement.
        </p>
      )}
    </div>
  );
}

/* ===== INITIATIVE CONTROLS ===== */

function InitiativeControls({
  headers,
}: {
  headers: () => Record<string, string>;
}) {
  const [data, setData] = useState<InitiativeData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/initiative");
      if (res.ok) setData(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchData();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const phase = data?.state?.phase || "idle";

  const startEncounter = async (quickAdd: boolean) => {
    await fetch("/api/initiative/start", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ quickAdd }),
    });
    fetchData();
  };

  const lockInitiative = async () => {
    await fetch("/api/initiative/lock", {
      method: "POST",
      headers: headers(),
    });
    fetchData();
  };

  const resetEncounter = async () => {
    await fetch("/api/initiative/reset", {
      method: "POST",
      headers: headers(),
    });
    fetchData();
  };

  const advanceTurn = async () => {
    await fetch("/api/initiative/advance", {
      method: "POST",
      headers: headers(),
    });
    fetchData();
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
        Initiative
      </h2>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-gray-500">Phase:</span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold ${
            phase === "idle"
              ? "bg-gray-700 text-gray-300"
              : phase === "entry"
                ? "bg-gold/20 text-gold"
                : "bg-green-900/30 text-green-400"
          }`}
        >
          {phase.toUpperCase()}
        </span>
        {phase === "locked" && data?.state && (
          <span className="text-xs text-gray-400">
            Round {data.state.round}
          </span>
        )}
      </div>

      {/* Entries preview */}
      {data?.entries && data.entries.length > 0 && (
        <div className="mb-3 flex flex-col gap-1">
          {data.entries.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-2 text-sm ${
                entry.isActive ? "text-gold" : ""
              }`}
            >
              {entry.isActive && <span>&#9654;</span>}
              <span
                className="font-bold"
                style={{
                  color: entry.isPlayer
                    ? getPlayerColor(entry.name)
                    : "#ef4444",
                }}
              >
                {entry.name}
              </span>
              <span className="text-gray-500">{entry.roll}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls based on phase */}
      <div className="flex flex-wrap gap-2">
        {phase === "idle" && (
          <>
            <button
              onClick={() => startEncounter(true)}
              className="rounded bg-gold px-3 py-1 text-xs font-bold text-background hover:bg-[#f0d090]"
            >
              Start (Quick Add)
            </button>
            <button
              onClick={() => startEncounter(false)}
              className="rounded border border-gold/30 px-3 py-1 text-xs text-gold hover:bg-gold/10"
            >
              Start Empty
            </button>
          </>
        )}
        {phase === "entry" && (
          <>
            <button
              onClick={lockInitiative}
              className="rounded bg-gold px-3 py-1 text-xs font-bold text-background hover:bg-[#f0d090]"
            >
              Lock &amp; Sort
            </button>
            <button
              onClick={resetEncounter}
              className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
            >
              Cancel
            </button>
          </>
        )}
        {phase === "locked" && (
          <>
            <button
              onClick={advanceTurn}
              className="rounded bg-gold px-3 py-1 text-xs font-bold text-background hover:bg-[#f0d090]"
            >
              Next Turn
            </button>
            <button
              onClick={resetEncounter}
              className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== PLACEHOLDER ===== */

/* ===== GAME LAUNCHER ===== */

interface ActiveSession {
  id: string;
  gameId: string;
  status: string;
  players: string[];
  results: { playerName: string; score: number }[];
}

function GameLauncher({
  headers,
}: {
  headers: () => Record<string, string>;
}) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [launching, setLaunching] = useState(false);

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch("/api/games/active");
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchActive();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchActive]);

  const handleLaunch = async () => {
    if (!selectedGame) return;
    setLaunching(true);
    await fetch("/api/games/launch", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ gameId: selectedGame, difficulty }),
    });
    setSelectedGame(null);
    setLaunching(false);
    fetchActive();
  };

  const handleStart = async () => {
    if (!activeSession) return;
    await fetch(`/api/games/${activeSession.id}/start`, {
      method: "POST",
      headers: headers(),
    });
    fetchActive();
  };

  const handleEnd = async () => {
    if (!activeSession) return;
    await fetch(`/api/games/${activeSession.id}/end`, {
      method: "POST",
      headers: headers(),
    });
    fetchActive();
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
        Game Launcher
      </h2>

      {/* Active session */}
      {activeSession && (
        <div className="mb-4 rounded border border-gold/30 bg-gold/5 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gold">
                {GAMES.find((g) => g.id === activeSession.gameId)?.name || activeSession.gameId}
              </p>
              <p className="text-xs text-gray-400">
                {activeSession.status.toUpperCase()} — {activeSession.players.length} players
              </p>
            </div>
            <div className="flex gap-2">
              {activeSession.status === "lobby" && (
                <button
                  onClick={handleStart}
                  className="rounded bg-gold px-3 py-1 text-xs font-bold text-background hover:bg-[#f0d090]"
                >
                  Start
                </button>
              )}
              <button
                onClick={handleEnd}
                className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
              >
                End
              </button>
            </div>
          </div>
          {activeSession.results.length > 0 && (
            <div className="mt-2 border-t border-gray-700 pt-2">
              {activeSession.results.map((r) => (
                <div key={r.playerName} className="flex items-center gap-2 text-xs">
                  <span className="font-bold" style={{ color: getPlayerColor(r.playerName) }}>
                    {r.playerName}
                  </span>
                  <span className="text-gray-400">{r.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Launch new game */}
      {!activeSession && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`rounded border p-2 text-left transition-colors ${
                  selectedGame === game.id
                    ? "border-gold bg-gold/10"
                    : "border-border hover:border-gray-600"
                }`}
              >
                <div className="text-lg">{game.icon}</div>
                <p className="text-xs font-bold text-gray-200">{game.name}</p>
                <p className="text-[10px] text-gray-500">{game.category}</p>
              </button>
            ))}
          </div>

          {selectedGame && (
            <div className="flex items-center gap-2">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="rounded border border-gray-700 bg-background px-2 py-1 text-xs text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="rounded bg-gold px-3 py-1 text-xs font-bold text-background hover:bg-[#f0d090] disabled:opacity-50"
              >
                {launching ? "Launching..." : "Launch"}
              </button>
            </div>
          )}
        </>
      )}

      {!activeSession && !selectedGame && (
        <p className="text-xs text-gray-500">Select a game to launch.</p>
      )}
    </div>
  );
}

/* ===== PLACEHOLDER ===== */

function PlaceholderCard({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 opacity-50">
      <h2 className="mb-2 font-cinzel text-lg font-bold text-gold">
        {icon} {title}
      </h2>
      <p className="text-sm text-gray-500">Coming soon in a future update.</p>
    </div>
  );
}
