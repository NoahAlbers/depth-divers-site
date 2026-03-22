"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlayer } from "@/lib/player-context";
import { POLL_INTERVAL_MS } from "@/lib/players";
import { getGameById, type GameDefinition } from "@/lib/games/registry";
import { GameLobby } from "@/components/games/game-lobby";
import { GameLeaderboard } from "@/components/games/game-leaderboard";
import { ArcaneConduit } from "@/components/games/arcane-conduit";
import { RuneEchoes } from "@/components/games/rune-echoes";
import { GlyphRace } from "@/components/games/glyph-race";
import { StalactiteStorm } from "@/components/games/stalactite-storm";
import { SpiderSwat } from "@/components/games/spider-swat";
import { Lockpicking } from "@/components/games/lockpicking";
import { DrinkingContest } from "@/components/games/drinking-contest";
import { StealthSequence } from "@/components/games/stealth-sequence";
import { DefuseTheGlyph } from "@/components/games/defuse-the-glyph";
import { UnderdarkTelephone } from "@/components/games/underdark-telephone";
import { getPlayerColor } from "@/lib/players";
import { useParams } from "next/navigation";

interface GameResult {
  playerName: string;
  score: number;
  completedAt: string;
  metadata?: Record<string, unknown>;
}

interface SessionData {
  id: string;
  gameId: string;
  status: string;
  difficulty: string;
  timeLimit: number;
  seed: number | null;
  players: string[];
  results: GameResult[];
  config: Record<string, unknown>;
  currentRound: number;
}

interface SessionResponse {
  session: SessionData;
  lastUpdated: string;
}

export default function GameSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { currentPlayer, isDM, effectivePlayer, effectiveIsDM, dmPassword } = usePlayer();
  const playerName = effectivePlayer;
  const [session, setSession] = useState<SessionData | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [retryRequested, setRetryRequested] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${sessionId}`);
      if (res.ok) {
        const data: SessionResponse = await res.json();
        setSession(data.session);
        // Check if player already has a result
        if (playerName && data.session.results.some((r: GameResult) => r.playerName === playerName)) {
          setSubmitted(true);
        }
      }
    } catch {}
  }, [sessionId, playerName]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchSession();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const dmHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    "x-dm-password": dmPassword || "noah",
  });

  const handleJoin = async () => {
    if (!playerName) return;
    await fetch(`/api/games/${sessionId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName }),
    });
    fetchSession();
  };

  const handleStart = async () => {
    await fetch(`/api/games/${sessionId}/start`, {
      method: "POST",
      headers: dmHeaders(),
    });
    fetchSession();
  };

  const handleEnd = async () => {
    await fetch(`/api/games/${sessionId}/end`, {
      method: "POST",
      headers: dmHeaders(),
    });
    fetchSession();
  };

  const handleComplete = async (score: number, metadata?: Record<string, unknown>) => {
    if (!playerName || submitted) return;
    setSubmitted(true);
    await fetch(`/api/games/${sessionId}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName, score, metadata }),
    });
    fetchSession();
  };

  if (!currentPlayer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Log in to play.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const game = getGameById(session.gameId);

  // LOBBY
  if (session.status === "lobby") {
    return (
      <div>
        <h1 className="mb-6 font-cinzel text-3xl font-bold text-gold">
          Game Lobby
        </h1>
        <GameLobby
          gameId={session.gameId}
          difficulty={session.difficulty}
          players={session.players}
          isDM={effectiveIsDM}
          currentPlayer={playerName || ""}
          onJoin={handleJoin}
          onStart={handleStart}
        />
      </div>
    );
  }

  // FINISHED
  if (session.status === "finished") {
    // Underdark Telephone finished → show reveal view for all players
    if (session.gameId === "underdark-telephone") {
      return (
        <div>
          <h1 className="mb-6 font-cinzel text-3xl font-bold text-gold">
            Underdark Telephone — Reveal
          </h1>
          <UnderdarkTelephone
            seed={session.seed || 0}
            difficulty={session.difficulty as "easy" | "medium" | "hard"}
            timeLimit={0}
            onComplete={() => {}}
            config={session.config}
            sessionId={session.id}
            players={session.players}
            playerName={playerName || ""}
          />
        </div>
      );
    }

    return (
      <div>
        <h1 className="mb-6 font-cinzel text-3xl font-bold text-gold">
          Game Over
        </h1>
        <GameLeaderboard
          gameId={session.gameId}
          results={session.results}
          category={game?.category || "puzzle"}
        />
      </div>
    );
  }

  // ACTIVE — DM sees leaderboard updating live
  if (effectiveIsDM) {
    // Special DM view for Defuse the Glyph (god mode)
    if (session.gameId === "defuse-the-glyph") {
      return (
        <div>
          <h1 className="mb-4 font-cinzel text-3xl font-bold text-gold">
            {game?.name || session.gameId} — DM View
          </h1>
          <DefuseTheGlyph
            seed={session.seed || 0}
            difficulty={session.difficulty as "easy" | "medium" | "hard"}
            timeLimit={session.timeLimit}
            onComplete={() => {}}
            config={session.config}
            sessionId={session.id}
            players={session.players}
            playerName=""
            isDM={true}
          />
          <button
            onClick={handleEnd}
            className="mt-4 w-full max-w-lg mx-auto block rounded border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
          >
            End Game
          </button>
        </div>
      );
    }

    // Special DM view for Underdark Telephone
    if (session.gameId === "underdark-telephone") {
      return (
        <UnderdarkTelephoneDMView
          session={session}
          game={game}
          dmHeaders={dmHeaders}
          onEnd={handleEnd}
          onRefresh={fetchSession}
        />
      );
    }

    return (
      <div>
        <h1 className="mb-4 font-cinzel text-3xl font-bold text-gold">
          {game?.name || session.gameId} — Live
        </h1>
        <div className="mb-4 flex gap-3">
          <span className="rounded bg-green-900/30 px-2 py-1 text-xs font-bold text-green-400">
            ACTIVE
          </span>
          <span className="text-sm text-gray-400">
            {session.results.length}/{session.players.length} finished
          </span>
        </div>
        <GameLeaderboard
          gameId={session.gameId}
          results={session.results}
          category={game?.category || "puzzle"}
        />
        <button
          onClick={handleEnd}
          className="mt-4 w-full max-w-lg mx-auto block rounded border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          End Game
        </button>
      </div>
    );
  }

  // ACTIVE — Player plays the game
  if (submitted) {
    return (
      <div>
        <h1 className="mb-4 font-cinzel text-3xl font-bold text-gold">
          {game?.name || session.gameId}
        </h1>
        <div className="flex min-h-[40vh] flex-col items-center justify-center">
          <p className="text-lg text-green-400">Score submitted!</p>
          <p className="mt-2 text-sm text-gray-400">
            Waiting for other players to finish...
          </p>
          <GameLeaderboard
            gameId={session.gameId}
            results={session.results}
            category={game?.category || "puzzle"}
          />
          {!retryRequested ? (
            <button
              onClick={async () => {
                await fetch(`/api/games/${sessionId}/request-retry`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ playerName, gameName: game?.name }),
                });
                setRetryRequested(true);
              }}
              className="mt-4 rounded border border-gold/30 px-4 py-2 text-xs text-gold hover:bg-gold/10"
            >
              Request Retry
            </button>
          ) : (
            <p className="mt-4 text-xs text-gray-500">Retry request sent to DM</p>
          )}
        </div>
      </div>
    );
  }

  // Render the actual game
  const gameProps = {
    seed: session.seed || 0,
    difficulty: session.difficulty as "easy" | "medium" | "hard",
    timeLimit: session.timeLimit,
    onComplete: handleComplete,
    config: session.config || {},
  };

  return (
    <div>
      <h1 className="mb-4 font-cinzel text-3xl font-bold text-gold">
        {game?.name || session.gameId}
      </h1>
      {session.gameId === "arcane-conduit" && <ArcaneConduit {...gameProps} />}
      {session.gameId === "rune-echoes" && <RuneEchoes {...gameProps} />}
      {session.gameId === "glyph-race" && <GlyphRace {...gameProps} />}
      {session.gameId === "stalactite-storm" && <StalactiteStorm {...gameProps} />}
      {session.gameId === "spider-swat" && <SpiderSwat {...gameProps} />}
      {session.gameId === "lockpicking" && <Lockpicking {...gameProps} />}
      {session.gameId === "drinking-contest" && <DrinkingContest {...gameProps} />}
      {session.gameId === "stealth-sequence" && <StealthSequence {...gameProps} />}
      {session.gameId === "defuse-the-glyph" && (
        <DefuseTheGlyph
          {...gameProps}
          sessionId={session.id}
          players={session.players}
          playerName={playerName || ""}
        />
      )}
      {session.gameId === "underdark-telephone" && (
        <UnderdarkTelephone
          {...gameProps}
          sessionId={session.id}
          players={session.players}
          playerName={playerName || ""}
        />
      )}
      {!["arcane-conduit", "rune-echoes", "glyph-race", "stalactite-storm", "spider-swat", "lockpicking", "drinking-contest", "stealth-sequence", "defuse-the-glyph", "underdark-telephone"].includes(session.gameId) && (
        <p className="text-red-400">Unknown game: &quot;{session.gameId}&quot;</p>
      )}
    </div>
  );
}

// ===== DM View for Underdark Telephone =====

function UnderdarkTelephoneDMView({
  session,
  game,
  dmHeaders,
  onEnd,
  onRefresh,
}: {
  session: SessionData;
  game: GameDefinition | undefined;
  dmHeaders: () => Record<string, string>;
  onEnd: () => void;
  onRefresh: () => void;
}) {
  const [roundInfo, setRoundInfo] = useState<{
    currentRound: number;
    totalRounds: number;
    roundType: string;
    submittedPlayers: string[];
    totalPlayers: number;
    isReveal: boolean;
  } | null>(null);

  const fetchRoundStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${session.id}/round-status`);
      if (res.ok) {
        setRoundInfo(await res.json());
      }
    } catch {}
  }, [session.id]);

  useEffect(() => {
    fetchRoundStatus();
    const interval = setInterval(fetchRoundStatus, 2500);
    return () => clearInterval(interval);
  }, [fetchRoundStatus]);

  const handleAdvanceRound = async () => {
    await fetch(`/api/games/${session.id}/advance-round`, {
      method: "POST",
      headers: dmHeaders(),
    });
    fetchRoundStatus();
    onRefresh();
  };

  return (
    <div>
      <h1 className="mb-4 font-cinzel text-3xl font-bold text-gold">
        {game?.name || session.gameId} — DM Dashboard
      </h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <span className="rounded bg-green-900/30 px-2 py-1 text-xs font-bold text-green-400">
          ACTIVE
        </span>
        {roundInfo && (
          <>
            <span className="rounded bg-purple-900/30 px-2 py-1 text-xs text-purple-300">
              Round {roundInfo.currentRound + 1}/{roundInfo.totalRounds}
            </span>
            <span className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300">
              {roundInfo.roundType === "write" ? "Writing" : "Drawing"}
            </span>
          </>
        )}
      </div>

      {/* Player progress */}
      {roundInfo && (
        <div className="mb-4 rounded border border-border bg-surface p-3">
          <p className="mb-2 text-xs font-bold text-gray-400">
            Submissions: {roundInfo.submittedPlayers.length}/{roundInfo.totalPlayers}
          </p>
          <div className="mb-2 h-1.5 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{
                width: `${roundInfo.totalPlayers > 0 ? (roundInfo.submittedPlayers.length / roundInfo.totalPlayers) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {session.players.map((p) => (
              <span
                key={p}
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  roundInfo.submittedPlayers.includes(p)
                    ? "bg-green-900/30 text-green-400"
                    : "bg-gray-800 text-gray-500"
                }`}
                style={{ borderLeft: `3px solid ${getPlayerColor(p)}` }}
              >
                {p} {roundInfo.submittedPlayers.includes(p) && "✓"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleAdvanceRound}
          className="rounded bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500"
        >
          {roundInfo && roundInfo.submittedPlayers.length < roundInfo.totalPlayers
            ? "Force Advance (skip missing)"
            : "Advance Round"}
        </button>
        <button
          onClick={onEnd}
          className="rounded border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          End Game
        </button>
      </div>
    </div>
  );
}
