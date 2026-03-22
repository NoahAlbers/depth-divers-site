"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePlayer } from "@/lib/player-context";
import { PLAYERS, getPlayerColor, POLL_INTERVAL_MS } from "@/lib/players";
import { GAMES, type GameDefinition, type GameConfigOption } from "@/lib/games/registry";
import { DEFAULT_SKILL_MAPPINGS, ALL_SKILL_OPTIONS } from "@/lib/games/difficulty";

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
      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-cinzel text-3xl font-bold text-gold">
          DM Area
        </h1>
        <EnvironmentBadge />
      </div>
      {/* Live Message Feed - full width */}
      <LiveMessageFeed dmPassword={dmPassword} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ImpersonateSection />
        <RecapRandomizer />
        <SeatingControls headers={headers} />
        <InitiativeControls headers={headers} />
        <GameLauncher headers={headers} />
        <TimerLauncherSection headers={headers} />
        <PollLauncherSection headers={headers} />
        <PlaceholderCard title="Session Notes" icon="📝" />
      </div>
    </div>
  );
}

/* ===== LIVE MESSAGE FEED ===== */

interface FeedMessage {
  id: string;
  from: string;
  body: string;
  tag: string | null;
  createdAt: string;
  conversationId: string;
  conversationName: string | null;
  conversationType: string;
  conversationMembers: string[];
}

function LiveMessageFeed({ dmPassword }: { dmPassword: string }) {
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dm-feed-collapsed") === "true";
    }
    return false;
  });
  const [feedHeight, setFeedHeight] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dm-feed-height");
      return stored ? Number(stored) : 400;
    }
    return 400;
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/feed?limit=50", {
        headers: { "x-dm-password": dmPassword },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {}
  }, [dmPassword]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchFeed();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  function getRecipientLabel(msg: FeedMessage): string {
    if (msg.conversationType === "group") {
      return `\u2192 ${msg.conversationName || "Group"}`;
    }
    const other = msg.conversationMembers.find((m) => m !== msg.from);
    return `\u2192 ${other || "?"}`;
  }

  function relTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("dm-feed-collapsed", String(next));
  };

  return (
    <div className="rounded-lg border border-border bg-surface">
      <button
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between border-b border-border px-4 py-2 text-left"
      >
        <h2 className="font-cinzel text-sm font-bold text-gold">
          Live Message Feed
        </h2>
        <div className="flex items-center gap-2">
          {!collapsed && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setAutoScroll(!autoScroll);
              }}
              className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                autoScroll
                  ? "bg-green-900/30 text-green-400"
                  : "bg-gray-700 text-gray-400"
              }`}
            >
              {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
            </span>
          )}
          <span
            className={`text-gray-500 transition-transform ${collapsed ? "" : "rotate-180"}`}
          >
            ▼
          </span>
        </div>
      </button>
      {!collapsed && (
      <div
        ref={scrollRef}
        className="overflow-y-auto p-2"
        style={{
          height: feedHeight,
          minHeight: 200,
          maxHeight: "80vh",
          resize: "vertical",
        }}
        onMouseUp={() => {
          if (scrollRef.current) {
            const h = scrollRef.current.offsetHeight;
            if (h !== feedHeight) {
              setFeedHeight(h);
              localStorage.setItem("dm-feed-height", String(h));
            }
          }
        }}
      >
        {messages.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-600">
            No messages yet
          </p>
        ) : (
          messages.map((msg) => (
            <a
              key={msg.id}
              href={`/messages?conversation=${msg.conversationId}&message=${msg.id}`}
              className="flex items-start gap-2 rounded px-2 py-1 text-xs hover:bg-surface-light cursor-pointer"
            >
              <span className="flex-shrink-0 text-gray-600">
                {relTime(msg.createdAt)}
              </span>
              <span
                className="flex-shrink-0 font-bold"
                style={{ color: getPlayerColor(msg.from) }}
              >
                {msg.from}
              </span>
              <span className="flex-shrink-0 text-gray-600">
                {getRecipientLabel(msg)}
              </span>
              <span className="min-w-0 flex-1 truncate text-gray-400">
                {msg.body.length > 100
                  ? msg.body.slice(0, 100) + "..."
                  : msg.body}
              </span>
              {msg.tag && (
                <span
                  className={`flex-shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${
                    msg.tag === "IC"
                      ? "bg-purple-600/30 text-purple-300"
                      : "bg-blue-600/30 text-blue-300"
                  }`}
                >
                  {msg.tag}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (confirm("Delete this message?")) {
                    fetch(`/api/messages/${msg.id}`, {
                      method: "DELETE",
                      headers: { "x-dm-password": dmPassword },
                    }).then(() => fetchFeed());
                  }
                }}
                className="flex-shrink-0 text-red-400/30 hover:text-red-400"
                title="Delete message"
              >
                🗑️
              </button>
            </a>
          ))
        )}
      </div>
      )}
    </div>
  );
}

/* ===== IMPERSONATE SECTION ===== */

function ImpersonateSection() {
  const { isImpersonating, impersonatedPlayer, startImpersonating, stopImpersonating } = usePlayer();
  const [selected, setSelected] = useState<string>(PLAYERS[0].name);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
        Impersonate Player
      </h2>

      {isImpersonating ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Viewing as{" "}
            <span
              className="font-bold"
              style={{ color: getPlayerColor(impersonatedPlayer || "") }}
            >
              {impersonatedPlayer}
            </span>
          </span>
          <button
            onClick={stopImpersonating}
            className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
          >
            Stop Impersonating
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 rounded border border-gray-700 bg-background px-3 py-2 text-sm text-white"
          >
            {PLAYERS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => startImpersonating(selected)}
            className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090]"
          >
            View as {selected}
          </button>
        </div>
      )}

      <p className="mt-2 text-[10px] text-gray-600">
        See the site exactly as this player does. Clears when you close the tab.
      </p>
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
  difficulty: string;
  players: string[];
  results: { playerName: string; score: number; metadata?: Record<string, unknown> }[];
  currentRound: number;
  roundData: string;
  config: Record<string, unknown>;
  retryRequests: { playerName: string; requestedAt: string }[];
}

interface RetryRequest {
  sessionId: string;
  gameId: string;
  gameName: string;
  playerName: string;
  score: number | null;
  requestedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  puzzle: "bg-blue-500/20 text-blue-300",
  reflex: "bg-red-500/20 text-red-300",
  memory: "bg-purple-500/20 text-purple-300",
  race: "bg-yellow-500/20 text-yellow-300",
  cooperative: "bg-green-500/20 text-green-300",
  rhythm: "bg-pink-500/20 text-pink-300",
  timing: "bg-cyan-500/20 text-cyan-300",
  party: "bg-orange-500/20 text-orange-300",
};

function GameLauncher({
  headers,
}: {
  headers: () => Record<string, string>;
}) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [view, setView] = useState<"selection" | "config">("selection");
  const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState(0);
  const [gameConfig, setGameConfig] = useState<Record<string, unknown>>({});
  const [launching, setLaunching] = useState(false);
  const [retryRequests, setRetryRequests] = useState<RetryRequest[]>([]);
  const [retryExpanded, setRetryExpanded] = useState(false);

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch("/api/games/active");
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
      }
    } catch {}
  }, []);

  const fetchRetryRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/games/retry-requests");
      if (res.ok) {
        const data = await res.json();
        setRetryRequests(data.requests || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchActive();
    fetchRetryRequests();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchActive();
        fetchRetryRequests();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchActive, fetchRetryRequests]);

  const handleApproveRetry = async (sessionId: string, playerName: string) => {
    await fetch(`/api/games/${sessionId}/approve-retry`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ playerName }),
    });
    fetchRetryRequests();
    fetchActive();
  };

  const handleDenyRetry = async (sessionId: string, playerName: string) => {
    await fetch(`/api/games/${sessionId}/deny-retry`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ playerName }),
    });
    fetchRetryRequests();
  };

  const selectGame = (game: GameDefinition) => {
    setSelectedGame(game);
    setDifficulty("medium");
    setTimeLimit(game.defaultTimeLimit);
    // Initialize config options with defaults
    const defaults: Record<string, unknown> = {};
    game.configOptions?.forEach((opt) => {
      defaults[opt.key] = opt.default;
    });
    setGameConfig(defaults);
    setView("config");
  };

  const handleLaunch = async () => {
    if (!selectedGame) return;
    setLaunching(true);
    await fetch("/api/games/launch", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        gameId: selectedGame.id,
        difficulty,
        timeLimit: timeLimit || undefined,
        config: gameConfig,
      }),
    });
    setSelectedGame(null);
    setView("selection");
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

  const handleAdvanceRound = async () => {
    if (!activeSession) return;
    await fetch(`/api/games/${activeSession.id}/advance-round`, {
      method: "POST",
      headers: headers(),
    });
    fetchActive();
  };

  const activeGame = activeSession
    ? GAMES.find((g) => g.id === activeSession.gameId)
    : null;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
        Game Launcher
      </h2>

      {/* ===== RETRY REQUESTS NOTIFICATION BAR ===== */}
      {retryRequests.length > 0 && (
        <div className="mb-3 rounded border border-yellow-500/30 bg-yellow-500/5">
          <button
            onClick={() => setRetryExpanded(!retryExpanded)}
            className="flex w-full items-center justify-between p-2.5 text-left"
          >
            <span className="text-xs font-bold text-yellow-300">
              🔄 {retryRequests.length} retry request{retryRequests.length !== 1 ? "s" : ""} pending
            </span>
            <span className="text-[10px] text-gray-500">{retryExpanded ? "▲" : "▼"}</span>
          </button>
          {retryExpanded && (
            <div className="border-t border-yellow-500/20 px-2.5 pb-2.5">
              {retryRequests.map((req) => (
                <div
                  key={`${req.sessionId}-${req.playerName}`}
                  className="mt-2 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-bold"
                        style={{ color: getPlayerColor(req.playerName) }}
                      >
                        {req.playerName}
                      </span>
                      <span className="text-[10px] text-gray-500">—</span>
                      <span className="text-[10px] text-gray-400">{req.gameName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      {req.score !== null && <span>Score: {req.score}</span>}
                      <span>{new Date(req.requestedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleApproveRetry(req.sessionId, req.playerName)}
                      className="rounded bg-green-600/20 px-2 py-0.5 text-[10px] font-bold text-green-400 hover:bg-green-600/30"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDenyRetry(req.sessionId, req.playerName)}
                      className="rounded bg-red-600/20 px-2 py-0.5 text-[10px] font-bold text-red-400 hover:bg-red-600/30"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== ACTIVE SESSION DASHBOARD ===== */}
      {activeSession && (
        <div>
          {/* Header */}
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl">{activeGame?.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-gold">
                {activeGame?.name || activeSession.gameId}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    activeSession.status === "lobby"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : activeSession.status === "active"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-gray-500/20 text-gray-300"
                  }`}
                >
                  {activeSession.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">
                  {activeSession.difficulty} | {activeSession.players.length} player{activeSession.players.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Players */}
          {activeSession.players.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {activeSession.players.map((p) => {
                const hasResult = activeSession.results.some((r) => r.playerName === p);
                return (
                  <span
                    key={p}
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      hasResult ? "bg-green-900/30 text-green-400" : "bg-gray-800 text-gray-300"
                    }`}
                    style={{ borderLeft: `3px solid ${getPlayerColor(p)}` }}
                  >
                    {p} {hasResult && "✓"}
                  </span>
                );
              })}
            </div>
          )}

          {/* Progress for active games */}
          {activeSession.status === "active" && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-400">Progress</span>
                <span className="text-gray-300">
                  {activeSession.results.length}/{activeSession.players.length} finished
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{
                    width: `${activeSession.players.length > 0 ? (activeSession.results.length / activeSession.players.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Live results */}
          {activeSession.results.length > 0 && (
            <div className="mb-3 rounded border border-gray-700 bg-background/50 p-2">
              <p className="mb-1.5 text-[10px] font-bold uppercase text-gray-500">Results</p>
              {activeSession.results.map((r, i) => (
                <div key={r.playerName} className="flex items-center justify-between py-0.5 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-500">{i + 1}.</span>
                    <span className="font-bold" style={{ color: getPlayerColor(r.playerName) }}>
                      {r.playerName}
                    </span>
                  </span>
                  <span className="text-gray-400">{r.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Round info for multi-round games */}
          {activeSession.gameId === "underdark-telephone" && activeSession.status === "active" && (
            <div className="mb-3 rounded border border-purple-500/20 bg-purple-500/5 p-2">
              <p className="text-xs text-purple-300">
                Round {activeSession.currentRound + 1} — {activeSession.currentRound % 2 === 0 ? "Writing" : "Drawing"}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {activeSession.status === "lobby" && (
              <button
                onClick={handleStart}
                className="rounded bg-gold px-3 py-1 text-xs font-bold text-background hover:bg-[#f0d090]"
              >
                Start Game
              </button>
            )}
            {activeSession.status === "active" && activeSession.gameId === "underdark-telephone" && (
              <button
                onClick={handleAdvanceRound}
                className="rounded border border-purple-500/30 px-3 py-1 text-xs text-purple-300 hover:bg-purple-500/10"
              >
                Advance Round
              </button>
            )}
            <button
              onClick={handleEnd}
              className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10"
            >
              End Game
            </button>
          </div>
        </div>
      )}

      {/* ===== GAME SELECTION GRID ===== */}
      {!activeSession && view === "selection" && (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => selectGame(game)}
                className="rounded border border-border p-2.5 text-left transition-colors hover:border-gold/40 hover:bg-gold/5"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xl">{game.icon}</span>
                  <span className="text-xs font-bold text-gray-200">{game.name}</span>
                </div>
                <div className="mb-1 flex flex-wrap gap-1">
                  <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${CATEGORY_COLORS[game.category] || "bg-gray-500/20 text-gray-300"}`}>
                    {game.category}
                  </span>
                  <span className="rounded bg-gray-700/50 px-1 py-0.5 text-[9px] text-gray-400">
                    {game.minPlayers === game.maxPlayers ? `${game.minPlayers}p` : `${game.minPlayers}-${game.maxPlayers}p`}
                  </span>
                  <span className="rounded bg-gray-700/50 px-1 py-0.5 text-[9px] text-gray-400">
                    {game.estimatedTime}
                  </span>
                </div>
                <p className="line-clamp-2 text-[10px] leading-tight text-gray-500">
                  {game.description}
                </p>
                {game.skillDisplay && (
                  <p className="mt-1 text-[9px] text-gold/60">{game.skillDisplay}</p>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ===== GAME CONFIGURATION SCREEN ===== */}
      {!activeSession && view === "config" && selectedGame && (
        <div>
          {/* Back button + game header */}
          <button
            onClick={() => { setView("selection"); setSelectedGame(null); }}
            className="mb-3 text-xs text-gray-400 hover:text-gray-200"
          >
            ← Back to games
          </button>

          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl">{selectedGame.icon}</span>
            <div>
              <p className="font-bold text-gold">{selectedGame.name}</p>
              <div className="flex items-center gap-1.5">
                <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${CATEGORY_COLORS[selectedGame.category] || "bg-gray-500/20 text-gray-300"}`}>
                  {selectedGame.category}
                </span>
                <span className="text-[10px] text-gray-400">
                  {selectedGame.minPlayers}-{selectedGame.maxPlayers} players
                </span>
                <span className="text-[10px] text-gray-400">
                  {selectedGame.estimatedTime}
                </span>
                {selectedGame.skillDisplay && (
                  <span className="text-[10px] text-gold/60">{selectedGame.skillDisplay}</span>
                )}
              </div>
            </div>
          </div>

          <p className="mb-3 text-xs text-gray-300">{selectedGame.description}</p>

          {/* How to Play */}
          <div className="mb-3 rounded border border-gray-700 bg-background/50 p-2.5">
            <p className="mb-1.5 text-[10px] font-bold uppercase text-gray-500">How to Play</p>
            <ul className="space-y-1">
              {selectedGame.howToPlay.map((step, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-gray-300">
                  <span className="text-gold/40">•</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Difficulty selector */}
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase text-gray-500">Difficulty</p>
            <div className="flex gap-1.5">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded border px-2 py-1.5 text-xs font-bold capitalize transition-colors ${
                    difficulty === d
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              {selectedGame.difficultyDescriptions[difficulty as "easy" | "medium" | "hard"]}
            </p>
          </div>

          {/* Skill override */}
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase text-gray-500">
              Skill Override
            </p>
            <select
              value={String(gameConfig.skillOverride ?? "default")}
              onChange={(e) =>
                setGameConfig((prev) => ({ ...prev, skillOverride: e.target.value }))
              }
              className="rounded border border-gray-700 bg-background px-2 py-1 text-xs text-white"
            >
              {ALL_SKILL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === "default" && selectedGame.skillDisplay
                    ? `Default (${selectedGame.skillDisplay})`
                    : opt.label}
                </option>
              ))}
            </select>
            <p className="mt-0.5 text-[9px] text-gray-600">
              Affects difficulty scaling based on character sheets
            </p>
          </div>

          {/* Time limit (if game uses it) */}
          {selectedGame.defaultTimeLimit > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase text-gray-500">Time Limit (seconds)</p>
              <input
                type="number"
                min={0}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value) || 0)}
                className="w-24 rounded border border-gray-700 bg-background px-2 py-1 text-xs text-white"
              />
            </div>
          )}

          {/* Game-specific config options */}
          {selectedGame.configOptions && selectedGame.configOptions.length > 0 && (
            <div className="mb-3 space-y-2.5">
              <p className="text-[10px] font-bold uppercase text-gray-500">Game Options</p>
              {selectedGame.configOptions.map((opt) => (
                <div key={opt.key}>
                  <label className="mb-0.5 block text-xs text-gray-400">{opt.label}</label>
                  {opt.type === "select" && opt.options ? (
                    <select
                      value={String(gameConfig[opt.key] ?? opt.default)}
                      onChange={(e) => {
                        const val = opt.options!.find((o) => String(o.value) === e.target.value)?.value ?? e.target.value;
                        setGameConfig((prev) => ({ ...prev, [opt.key]: val }));
                      }}
                      className="rounded border border-gray-700 bg-background px-2 py-1 text-xs text-white"
                    >
                      {opt.options.map((o) => (
                        <option key={String(o.value)} value={String(o.value)}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      min={opt.min}
                      max={opt.max}
                      value={Number(gameConfig[opt.key] ?? opt.default)}
                      onChange={(e) =>
                        setGameConfig((prev) => ({ ...prev, [opt.key]: Number(e.target.value) }))
                      }
                      className="w-24 rounded border border-gray-700 bg-background px-2 py-1 text-xs text-white"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Launch preview summary */}
          <div className="mb-3 rounded border border-gold/20 bg-gold/5 p-3">
            <p className="text-xs font-bold text-gold">
              {selectedGame.icon} {selectedGame.name} — <span className="capitalize">{difficulty}</span>
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400">
              {timeLimit > 0 && <span>Time: {timeLimit}s</span>}
              {timeLimit === 0 && selectedGame.defaultTimeLimit === 0 && <span>Time: None</span>}
              <span>
                Skill: {gameConfig.skillOverride && gameConfig.skillOverride !== "default"
                  ? ALL_SKILL_OPTIONS.find((o) => o.value === gameConfig.skillOverride)?.label || String(gameConfig.skillOverride)
                  : selectedGame.skillDisplay || "None"}
              </span>
              {selectedGame.configOptions?.map((opt) => {
                const val = gameConfig[opt.key] ?? opt.default;
                if (opt.options) {
                  const label = opt.options.find((o) => String(o.value) === String(val))?.label;
                  if (label) return <span key={opt.key}>{opt.label}: {label}</span>;
                }
                return <span key={opt.key}>{opt.label}: {String(val)}</span>;
              })}
            </div>
          </div>

          {/* Launch button */}
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="w-full rounded bg-gold py-2 text-sm font-bold text-background hover:bg-[#f0d090] disabled:opacity-50"
          >
            {launching ? "Launching..." : "Launch Game"}
          </button>
        </div>
      )}

      {!activeSession && view === "selection" && (
        <p className="text-xs text-gray-500">Select a game to configure and launch.</p>
      )}
    </div>
  );
}

/* ===== TIMER LAUNCHER ===== */

function TimerLauncherSection({ headers }: { headers: () => Record<string, string> }) {
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [dramatic, setDramatic] = useState(true);
  const [activeTimer, setActiveTimer] = useState<{
    id: string; label: string | null; duration: number; startedAt: string;
    status: string; pausedAt: string | null; remaining: number | null;
  } | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch("/api/timers/active");
      if (res.ok) {
        const data = await res.json();
        setActiveTimer(data?.timer || null);
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

  const launchTimer = async () => {
    const duration = minutes * 60 + seconds;
    if (duration <= 0) return;
    await fetch("/api/timers", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ label: label || null, duration, dramatic }),
    });
    fetchActive();
  };

  const timerAction = async (action: string, body?: Record<string, unknown>) => {
    if (!activeTimer) return;
    await fetch(`/api/timers/${activeTimer.id}/${action}`, {
      method: "POST",
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    fetchActive();
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
        ⏱ Countdown Timer
      </h2>

      {activeTimer ? (
        <div>
          <div className="mb-2">
            {activeTimer.label && (
              <p className="text-sm font-bold text-gold">{activeTimer.label}</p>
            )}
            <p className="text-xs text-gray-400">
              Status: {activeTimer.status.toUpperCase()} | Duration: {Math.floor(activeTimer.duration / 60)}:{String(activeTimer.duration % 60).padStart(2, "0")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTimer.status === "running" && (
              <button onClick={() => timerAction("pause")} className="rounded border border-gold/30 px-3 py-1 text-xs text-gold hover:bg-gold/10">Pause</button>
            )}
            {activeTimer.status === "paused" && (
              <button onClick={() => timerAction("resume")} className="rounded bg-gold px-3 py-1 text-xs font-bold text-background">Resume</button>
            )}
            <button onClick={() => timerAction("add-time", { seconds: 30 })} className="rounded border border-gray-600 px-2 py-1 text-[10px] text-gray-400">+30s</button>
            <button onClick={() => timerAction("add-time", { seconds: 60 })} className="rounded border border-gray-600 px-2 py-1 text-[10px] text-gray-400">+1m</button>
            <button onClick={() => timerAction("end")} className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10">End</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Timer label (optional)"
            className="rounded border border-gray-700 bg-background px-3 py-1 text-sm text-white placeholder-gray-500"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value) || 0)}
              className="w-16 rounded border border-gray-700 bg-background px-2 py-1 text-center text-sm text-white"
            />
            <span className="text-xs text-gray-500">min</span>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value) || 0)}
              className="w-16 rounded border border-gray-700 bg-background px-2 py-1 text-center text-sm text-white"
            />
            <span className="text-xs text-gray-500">sec</span>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={dramatic} onChange={(e) => setDramatic(e.target.checked)} className="rounded" />
            Dramatic mode
          </label>
          <button onClick={launchTimer} className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090]">
            Launch Timer
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== POLL LAUNCHER ===== */

function PollLauncherSection({ headers }: { headers: () => Record<string, string> }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [anonymous, setAnonymous] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [activePoll, setActivePoll] = useState<{
    id: string; question: string; options: string[]; votes: Record<string, number>;
    anonymous: boolean; showResults: boolean; status: string;
  } | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch("/api/polls/active");
      if (res.ok) {
        const data = await res.json();
        setActivePoll(data?.id ? data : null);
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

  const launchPoll = async () => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    await fetch("/api/polls", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ question, options: validOptions, anonymous, showResults }),
    });
    setQuestion("");
    setOptions(["", ""]);
    fetchActive();
  };

  const closePoll = async () => {
    if (!activePoll) return;
    await fetch(`/api/polls/${activePoll.id}/close`, {
      method: "POST",
      headers: headers(),
    });
    fetchActive();
  };

  const totalVotes = activePoll ? Object.keys(activePoll.votes).length : 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="mb-3 font-cinzel text-lg font-bold text-gold">
        📊 Quick Poll
      </h2>

      {activePoll ? (
        <div>
          <p className="mb-2 text-sm font-bold text-gold">{activePoll.question}</p>
          <div className="mb-3 flex flex-col gap-1">
            {activePoll.options.map((opt: string, i: number) => {
              const count = Object.values(activePoll.votes).filter((v) => v === i).length;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-24 truncate text-gray-300">{opt}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-700">
                    <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right text-gray-500">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
          {!activePoll.anonymous && (
            <div className="mb-2 text-[10px] text-gray-600">
              {Object.entries(activePoll.votes).map(([name, idx]) => (
                <span key={name} className="mr-2">
                  <span style={{ color: getPlayerColor(name) }} className="font-bold">{name}</span>
                  : {activePoll.options[idx as number]}
                </span>
              ))}
            </div>
          )}
          <p className="mb-2 text-[10px] text-gray-600">{totalVotes} voted</p>
          <button onClick={closePoll} className="rounded border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10">
            End Poll
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Poll question"
            className="rounded border border-gray-700 bg-background px-3 py-1 text-sm text-white placeholder-gray-500"
          />
          {options.map((opt, i) => (
            <input
              key={i}
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[i] = e.target.value;
                setOptions(next);
              }}
              placeholder={`Option ${i + 1}`}
              className="rounded border border-gray-700 bg-background px-3 py-1 text-sm text-white placeholder-gray-500"
            />
          ))}
          {options.length < 6 && (
            <button
              onClick={() => setOptions([...options, ""])}
              className="text-xs text-gold hover:underline"
            >
              + Add option
            </button>
          )}
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-xs text-gray-400">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="rounded" />
              Anonymous
            </label>
            <label className="flex items-center gap-1 text-xs text-gray-400">
              <input type="checkbox" checked={showResults} onChange={(e) => setShowResults(e.target.checked)} className="rounded" />
              Show results
            </label>
          </div>
          <button
            onClick={launchPoll}
            disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
            className="rounded bg-gold px-4 py-2 text-sm font-bold text-background hover:bg-[#f0d090] disabled:opacity-50"
          >
            Launch Poll
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== ENVIRONMENT BADGE ===== */

function EnvironmentBadge() {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || "unknown";
  const config: Record<string, { color: string; bg: string }> = {
    production: { color: "#98c379", bg: "rgba(152, 195, 121, 0.15)" },
    staging: { color: "#e5c07b", bg: "rgba(229, 192, 123, 0.15)" },
    development: { color: "#61afef", bg: "rgba(97, 175, 239, 0.15)" },
    unknown: { color: "#888", bg: "rgba(136, 136, 136, 0.15)" },
  };
  const { color, bg } = config[env] || config.unknown;

  return (
    <span
      className="rounded px-2 py-0.5 text-xs font-bold uppercase"
      style={{ color, backgroundColor: bg, border: `1px solid ${color}30` }}
    >
      {env}
    </span>
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
