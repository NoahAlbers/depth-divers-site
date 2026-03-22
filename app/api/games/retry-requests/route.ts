import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGameById } from "@/lib/games/registry";

export async function GET() {
  // Find all sessions with pending retry requests
  const sessions = await prisma.gameSession.findMany({
    where: {
      retryRequests: { not: "[]" },
    },
    orderBy: { createdAt: "desc" },
  });

  const requests: Array<{
    sessionId: string;
    gameId: string;
    gameName: string;
    playerName: string;
    score: number | null;
    requestedAt: string;
  }> = [];

  for (const session of sessions) {
    const retryReqs = JSON.parse(session.retryRequests) as Array<{
      playerName: string;
      requestedAt: string;
    }>;
    const results = JSON.parse(session.results) as Array<{
      playerName: string;
      score: number;
    }>;
    const game = getGameById(session.gameId);

    for (const req of retryReqs) {
      const result = results.find((r) => r.playerName === req.playerName);
      requests.push({
        sessionId: session.id,
        gameId: session.gameId,
        gameName: game?.name || session.gameId,
        playerName: req.playerName,
        score: result?.score ?? null,
        requestedAt: req.requestedAt,
      });
    }
  }

  return NextResponse.json({ requests });
}
