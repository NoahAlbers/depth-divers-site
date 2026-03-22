import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const timer = await prisma.timer.findFirst({
    where: { status: { in: ["running", "paused"] } },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({
    timer: timer || null,
    lastUpdated: new Date().toISOString(),
  });
}
