import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_NAMES } from "@/lib/players";

export async function POST(request: Request) {
  const { playerName, roll } = await request.json();

  if (!playerName || roll === undefined) {
    return NextResponse.json(
      { error: "playerName and roll are required" },
      { status: 400 }
    );
  }

  if (!ALL_NAMES.includes(playerName)) {
    return NextResponse.json(
      { error: "Invalid player name" },
      { status: 400 }
    );
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

  // Upsert: allow players to resubmit their roll
  const existing = await prisma.initiative.findFirst({
    where: { name: playerName, isPlayer: true },
  });

  if (existing) {
    await prisma.initiative.update({
      where: { id: existing.id },
      data: { roll: Number(roll) },
    });
  } else {
    const maxOrder = await prisma.initiative.aggregate({
      _max: { order: true },
    });
    await prisma.initiative.create({
      data: {
        name: playerName,
        roll: Number(roll),
        isPlayer: true,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
