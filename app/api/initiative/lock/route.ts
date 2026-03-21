import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check phase is "entry"
  const state = await prisma.initiativeState.findUnique({
    where: { id: "singleton" },
  });

  if (!state || state.phase !== "entry") {
    return NextResponse.json(
      { error: "Not in entry phase" },
      { status: 400 }
    );
  }

  // Sort entries by roll descending, then order ascending
  const entries = await prisma.initiative.findMany({
    orderBy: [{ roll: "desc" }, { order: "asc" }],
  });

  if (entries.length === 0) {
    return NextResponse.json(
      { error: "No entries to lock" },
      { status: 400 }
    );
  }

  // Reassign order based on sort, activate first entry
  await prisma.$transaction([
    ...entries.map((entry, i) =>
      prisma.initiative.update({
        where: { id: entry.id },
        data: { order: i + 1, isActive: i === 0 },
      })
    ),
    prisma.initiativeState.update({
      where: { id: "singleton" },
      data: { phase: "locked", isActive: true },
    }),
  ]);

  return NextResponse.json({ success: true, phase: "locked" });
}
