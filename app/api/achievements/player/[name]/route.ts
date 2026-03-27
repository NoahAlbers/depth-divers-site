import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const awards = await prisma.playerAchievement.findMany({
    where: { playerName: name },
    orderBy: { awardedAt: "desc" },
  });
  return NextResponse.json({ awards });
}
