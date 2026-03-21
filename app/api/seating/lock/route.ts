import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import { sendPushToAllPlayers } from "@/lib/push";

export async function GET() {
  const lock = await prisma.seatingLock.findUnique({
    where: { id: "active" },
  });

  if (!lock) {
    return NextResponse.json({
      locked: false,
      lastUpdated: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    locked: true,
    seats: JSON.parse(lock.seats),
    lockedBy: lock.lockedBy,
    lockedAt: lock.lockedAt,
    lastUpdated: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { seats } = await request.json();

  if (!seats) {
    return NextResponse.json(
      { error: "seats is required" },
      { status: 400 }
    );
  }

  const lock = await prisma.seatingLock.upsert({
    where: { id: "active" },
    update: {
      seats: JSON.stringify(seats),
      lockedBy: "Noah",
      lockedAt: new Date(),
    },
    create: {
      id: "active",
      seats: JSON.stringify(seats),
      lockedBy: "Noah",
      lockedAt: new Date(),
    },
  });

  // Fire-and-forget push notification
  sendPushToAllPlayers({
    title: "Seating Locked",
    body: "This session's seating is set. Check your seat!",
    url: "/seating",
    tag: "seating",
  });

  return NextResponse.json({
    locked: true,
    seats: JSON.parse(lock.seats),
    lockedBy: lock.lockedBy,
    lockedAt: lock.lockedAt,
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.seatingLock.delete({ where: { id: "active" } });
  } catch {
    // Already deleted or doesn't exist
  }

  return NextResponse.json({ success: true });
}
