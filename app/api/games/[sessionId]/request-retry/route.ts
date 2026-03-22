import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToPlayer } from "@/lib/push";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { playerName, gameName } = await request.json();

  if (!playerName) {
    return NextResponse.json({ error: "playerName required" }, { status: 400 });
  }

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Persist retry request
  const retryRequests = JSON.parse(session.retryRequests) as Array<{
    playerName: string;
    requestedAt: string;
  }>;

  // Don't add duplicate
  if (!retryRequests.some((r) => r.playerName === playerName)) {
    retryRequests.push({
      playerName,
      requestedAt: new Date().toISOString(),
    });

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { retryRequests: JSON.stringify(retryRequests) },
    });
  }

  // Notify DM
  sendPushToPlayer("Noah", {
    title: "Retry Request",
    body: `${playerName} is requesting a retry for ${gameName || "a game"}`,
    url: `/games/${sessionId}`,
    tag: "game-retry",
  });

  return NextResponse.json({ success: true });
}
