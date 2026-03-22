import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.gameSession.findMany({
    where: { status: "finished" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      ...s,
      players: JSON.parse(s.players),
      results: JSON.parse(s.results),
    })),
  });
}
