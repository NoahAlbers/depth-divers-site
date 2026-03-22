import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import { sendPushToAllPlayers } from "@/lib/push";

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
    const players = ["Mykolov", "Brent", "Jonathan", "Justin", "Eric", "Matthew"];
    await prisma.initiative.createMany({
      data: players.map((name, i) => ({
        name,
        roll: 0,
        isPlayer: true,
        order: i + 1,
      })),
    });
  }

  // Fire-and-forget push notification
  sendPushToAllPlayers({
    title: "Roll Initiative!",
    body: "A new encounter has started. Submit your roll.",
    url: "/initiative",
    tag: "initiative",
  });

  return NextResponse.json({ success: true, phase: "entry" }, { status: 201 });
}
