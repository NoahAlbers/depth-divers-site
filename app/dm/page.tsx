"use client";

import { useState, useEffect, useCallback } from "react";
import { usePlayer } from "@/lib/player-context";
import { PLAYERS, getPlayerColor, POLL_INTERVAL_MS } from "@/lib/players";

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
        <PlaceholderCard title="Game Launcher" icon="🎮" />
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
