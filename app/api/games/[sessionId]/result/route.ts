import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { playerName, score, metadata } = await request.json();

  if (!playerName || score === undefined) {
    return NextResponse.json(
      { error: "playerName and score required" },
      { status: 400 }
    );
  }

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "active") {
    return NextResponse.json({ error: "Game is not active" }, { status: 400 });
  }

  const players: string[] = JSON.parse(session.players);
  if (!players.includes(playerName)) {
    return NextResponse.json({ error: "Not in this game" }, { status: 403 });
  }

  const results = JSON.parse(session.results) as Array<{
    playerName: string;
    score: number;
    completedAt: string;
    metadata?: Record<string, unknown>;
  }>;

  // Reject duplicate submissions
  const existingIdx = results.findIndex((r) => r.playerName === playerName);
  if (existingIdx >= 0) {
    return NextResponse.json(
      { error: "Already submitted a result for this session" },
      { status: 409 }
    );
  }

  const result = {
    playerName,
    score: Number(score),
    completedAt: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };

  results.push(result);

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { results: JSON.stringify(results) },
  });

  return NextResponse.json({ success: true, results });
}
