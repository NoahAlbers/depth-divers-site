import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function GET() {
  const [entries, state] = await Promise.all([
    prisma.initiative.findMany({
      orderBy: [{ roll: "desc" }, { order: "asc" }],
    }),
    prisma.initiativeState.findUnique({ where: { id: "singleton" } }),
  ]);

  return NextResponse.json({
    entries,
    state: state ?? { round: 1, isActive: false, updatedAt: new Date() },
    lastUpdated: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, roll, isPlayer } = await request.json();

  if (!name || roll === undefined) {
    return NextResponse.json(
      { error: "name and roll are required" },
      { status: 400 }
    );
  }

  // Get max order for insertion ordering
  const maxOrder = await prisma.initiative.aggregate({ _max: { order: true } });
  const nextOrder = (maxOrder._max.order ?? 0) + 1;

  const entry = await prisma.initiative.create({
    data: {
      name,
      roll: Number(roll),
      isPlayer: isPlayer ?? true,
      order: nextOrder,
    },
  });

  // Ensure state exists
  await prisma.initiativeState.upsert({
    where: { id: "singleton" },
    update: { isActive: true },
    create: { id: "singleton", round: 1, isActive: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
