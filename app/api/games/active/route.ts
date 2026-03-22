import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await prisma.gameSession.findFirst({
    where: { status: { in: ["lobby", "active"] } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    session: session
      ? {
          ...session,
          players: JSON.parse(session.players),
          results: JSON.parse(session.results),
          config: JSON.parse(session.config),
        }
      : null,
    lastUpdated: new Date().toISOString(),
  });
}
