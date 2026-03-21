import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import { getGameById } from "@/lib/games/registry";
import { sendPushToAllPlayers } from "@/lib/push";

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId, difficulty, timeLimit } = await request.json();

  if (!gameId) {
    return NextResponse.json({ error: "gameId required" }, { status: 400 });
  }

  const game = getGameById(gameId);
  if (!game) {
    return NextResponse.json({ error: "Unknown game" }, { status: 400 });
  }

  // End any existing active sessions
  await prisma.gameSession.updateMany({
    where: { status: { in: ["lobby", "active"] } },
    data: { status: "finished", endedAt: new Date() },
  });

  const session = await prisma.gameSession.create({
    data: {
      gameId,
      difficulty: difficulty || "medium",
      timeLimit: timeLimit || game.defaultTimeLimit,
      status: "lobby",
    },
  });

  // Push notification
  sendPushToAllPlayers({
    title: `${game.name} is starting!`,
    body: "A game is starting! Tap to join the lobby.",
    url: `/games/${session.id}`,
    tag: "game",
  });

  return NextResponse.json(session, { status: 201 });
}
