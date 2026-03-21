import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const player = searchParams.get("player");

  if (!player) {
    return NextResponse.json(
      { error: "player query param required" },
      { status: 400 }
    );
  }

  // Get top 6 most-used emojis for this player
  const reactions = await prisma.messageReaction.groupBy({
    by: ["emoji"],
    where: { playerName: player },
    _count: { emoji: true },
    orderBy: { _count: { emoji: "desc" } },
    take: 6,
  });

  const topEmojis = reactions.map((r) => r.emoji);

  return NextResponse.json({ topEmojis });
}
