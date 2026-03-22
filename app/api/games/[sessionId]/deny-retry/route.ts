import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import { sendPushToPlayer } from "@/lib/push";
import { getGameById } from "@/lib/games/registry";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const { playerName } = await request.json();

  if (!playerName) {
    return NextResponse.json({ error: "playerName required" }, { status: 400 });
  }

  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Remove from retry requests
  const retryRequests = JSON.parse(session.retryRequests) as Array<{
    playerName: string;
    requestedAt: string;
  }>;
  const updatedRetries = retryRequests.filter((r) => r.playerName !== playerName);

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { retryRequests: JSON.stringify(updatedRetries) },
  });

  // Notify player
  const game = getGameById(session.gameId);
  sendPushToPlayer(playerName, {
    title: "Retry Denied",
    body: `Your retry request for ${game?.name || "the game"} was denied.`,
    url: `/games/${sessionId}`,
    tag: "game-retry-response",
  });

  return NextResponse.json({ success: true });
}
