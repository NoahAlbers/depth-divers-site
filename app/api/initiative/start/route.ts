import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { quickAdd } = await request.json().catch(() => ({ quickAdd: false }));

  await prisma.$transaction([
    prisma.initiative.deleteMany(),
    prisma.initiativeState.upsert({
      where: { id: "singleton" },
      update: { round: 1, isActive: false, phase: "entry" },
      create: { id: "singleton", round: 1, isActive: false, phase: "entry" },
    }),
  ]);

  // Quick add all 6 players with roll 0
  if (quickAdd) {
    const players = ["Mykolov", "Brent", "Johnathan", "Justin", "Eric", "Matthew"];
    await prisma.initiative.createMany({
      data: players.map((name, i) => ({
        name,
        roll: 0,
        isPlayer: true,
        order: i + 1,
      })),
    });
  }

  return NextResponse.json({ success: true, phase: "entry" }, { status: 201 });
}
