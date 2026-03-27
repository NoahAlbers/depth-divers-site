import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const awards = await prisma.playerAchievement.findMany({
    orderBy: { awardedAt: "desc" },
  });
  return NextResponse.json({ awards });
}
