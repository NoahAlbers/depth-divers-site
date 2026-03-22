import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import { sendPushToAllPlayers } from "@/lib/push";

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, duration, dramatic, visible } = await request.json();

  // Cancel any existing active timers
  await prisma.timer.updateMany({
    where: { status: { in: ["running", "paused"] } },
    data: { status: "cancelled" },
  });

  // Create new timer
  const timer = await prisma.timer.create({
    data: {
      label: label || null,
      duration,
      dramatic: dramatic ?? false,
      visible: visible ?? true,
      status: "running",
      startedAt: new Date(),
    },
  });

  // Notify all players
  await sendPushToAllPlayers({
    title: "\u23F1 " + (label || "Countdown started!"),
    body: "A timer has started",
    url: "/",
    tag: "timer",
  });

  return NextResponse.json(timer, { status: 201 });
}
