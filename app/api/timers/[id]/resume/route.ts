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

  if (!timer || timer.status !== "paused") {
    return NextResponse.json({ error: "Timer not found or not paused" }, { status: 404 });
  }

  const updated = await prisma.timer.update({
    where: { id },
    data: {
      status: "running",
      startedAt: new Date(),
      duration: timer.remaining!,
      pausedAt: null,
      remaining: null,
    },
  });

  return NextResponse.json(updated);
}
