import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import { createRoundData } from "@/lib/games/underdark-telephone";

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

  if (session.status !== "lobby") {
    return NextResponse.json({ error: "Game is not in lobby" }, { status: 400 });
  }

  const seed = Math.floor(Math.random() * 2147483647);
  const players: string[] = JSON.parse(session.players);

  // Initialize round data for multi-round games
  const extraData: Record<string, unknown> = {};
  if (session.gameId === "underdark-telephone") {
    extraData.roundData = JSON.stringify(createRoundData(players));
    extraData.currentRound = 0;
  }

  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      status: "active",
      seed,
      startedAt: new Date(),
      ...extraData,
    },
  });

  return NextResponse.json({
    session: {
      ...updated,
      players: JSON.parse(updated.players),
      results: JSON.parse(updated.results),
    },
  });
}
