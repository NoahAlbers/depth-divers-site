import { NextResponse } from "next/server";
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

  // Notify DM
  sendPushToPlayer("Noah", {
    title: "Retry Request",
    body: `${playerName} is requesting a retry for ${gameName || "a game"}`,
    url: `/games/${sessionId}`,
    tag: "game-retry",
  });

  return NextResponse.json({ success: true });
}
