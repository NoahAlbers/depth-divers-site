import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import {
  type RoundData,
  getRoundType,
  getTotalRounds,
} from "@/lib/games/underdark-telephone";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "active") {
    return NextResponse.json({ error: "Game not active" }, { status: 400 });
  }

  const players: string[] = JSON.parse(session.players);
  const config: Record<string, unknown> = JSON.parse(session.config);
  const roundData: RoundData = JSON.parse(
    session.roundData || '{"chains":[],"submissions":{}}'
  );

  const currentRound = session.currentRound;
  const totalRounds = getTotalRounds(
    players.length,
    config.roundCount as number | undefined
  );

  // Auto-submit "[skipped]" for players who haven't submitted
  for (const player of players) {
    const subKey = `${player}_${currentRound}`;
    if (!roundData.submissions[subKey]) {
      // Find their chain assignment
      const n = players.length;
      const chainIndex = (players.indexOf(player) + currentRound) % n;

      if (!roundData.chains[chainIndex]) {
        roundData.chains[chainIndex] = {
          startPlayer: players[chainIndex],
          entries: [],
        };
      }

      roundData.chains[chainIndex].entries.push({
        playerName: player,
        round: currentRound,
        type: getRoundType(currentRound),
        content: "[skipped]",
        submittedAt: new Date().toISOString(),
      });

      roundData.submissions[subKey] = true;
    }
  }

  const nextRound = currentRound + 1;
  const isFinished = nextRound >= totalRounds;

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      currentRound: nextRound,
      roundData: JSON.stringify(roundData),
      ...(isFinished ? { status: "finished", endedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({
    success: true,
    currentRound: nextRound,
    totalRounds,
    isFinished,
  });
}
