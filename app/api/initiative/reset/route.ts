import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(request: Request) {
  if (!isDMAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.$transaction([
    prisma.initiative.deleteMany(),
    prisma.initiativeState.upsert({
      where: { id: "singleton" },
      update: { round: 1, isActive: false },
      create: { id: "singleton", round: 1, isActive: false },
    }),
  ]);

  return NextResponse.json({ success: true });
}
