import { NextResponse } from "next/server";
import { sendPushToPlayer } from "@/lib/push";

export async function POST(request: Request) {
  const { playerName } = await request.json();

  if (!playerName) {
    return NextResponse.json(
      { error: "playerName required" },
      { status: 400 }
    );
  }

  await sendPushToPlayer(playerName, {
    title: "Test Notification",
    body: "Push notifications are working! You're all set.",
    url: "/notifications",
    tag: "test",
  });

  return NextResponse.json({ success: true });
}
