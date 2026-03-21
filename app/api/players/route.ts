import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const players = await prisma.player.findMany({
    select: { name: true, color: true },
  });

  return NextResponse.json({
    players: players.map((p) => ({
      name: p.name,
      color: p.color || null,
    })),
  });
}
