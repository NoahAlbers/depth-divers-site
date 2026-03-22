import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const timer = await prisma.timer.findUnique({ where: { id } });

  if (!timer || timer.status !== "running") {
    return NextResponse.json({ error: "Timer not found or not running" }, { status: 404 });
  }

  const now = new Date();
  const elapsedSeconds = Math.floor((now.getTime() - timer.startedAt!.getTime()) / 1000);
  const remaining = timer.duration - elapsedSeconds;

  const updated = await prisma.timer.update({
    where: { id },
    data: {
      status: "paused",
      pausedAt: now,
      remaining,
    },
  });

  return NextResponse.json(updated);
}
