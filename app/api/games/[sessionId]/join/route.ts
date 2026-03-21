import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { playerName } = await request.json();

  if (!playerName) {
    return NextResponse.json({ error: "playerName required" }, { status: 400 });
  }

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "lobby") {
    return NextResponse.json({ error: "Game is not in lobby" }, { status: 400 });
  }

  const players: string[] = JSON.parse(session.players);
  if (players.includes(playerName)) {
    return NextResponse.json({ error: "Already joined" }, { status: 400 });
  }

  players.push(playerName);

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { players: JSON.stringify(players) },
  });

  return NextResponse.json({ success: true, players });
}
