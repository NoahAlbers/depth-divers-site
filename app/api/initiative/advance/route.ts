import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(request: Request) {
  if (!isDMAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.initiative.findMany({
    orderBy: [{ roll: "desc" }, { order: "asc" }],
  });

  if (entries.length === 0) {
    return NextResponse.json({ error: "No entries" }, { status: 400 });
  }

  const activeIndex = entries.findIndex((e) => e.isActive);
  const nextIndex = activeIndex === -1 ? 0 : (activeIndex + 1) % entries.length;
  const isNewRound = nextIndex === 0 && activeIndex !== -1;

  // Deactivate all, activate next
  await prisma.$transaction([
    prisma.initiative.updateMany({ data: { isActive: false } }),
    prisma.initiative.update({
      where: { id: entries[nextIndex].id },
      data: { isActive: true },
    }),
    ...(isNewRound
      ? [
          prisma.initiativeState.upsert({
            where: { id: "singleton" },
            update: { round: { increment: 1 } },
            create: { id: "singleton", round: 2, isActive: true },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ success: true, nextIndex, isNewRound });
}
