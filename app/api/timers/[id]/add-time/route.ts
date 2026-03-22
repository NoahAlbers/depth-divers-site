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
  const { seconds } = await request.json();

  const timer = await prisma.timer.findUnique({ where: { id } });

  if (!timer || !["running", "paused"].includes(timer.status)) {
    return NextResponse.json({ error: "Timer not found or not active" }, { status: 404 });
  }

  const updated = await prisma.timer.update({
    where: { id },
    data: {
      duration: timer.duration + seconds,
      ...(timer.status === "paused" && timer.remaining != null
        ? { remaining: timer.remaining + seconds }
        : {}),
    },
  });

  return NextResponse.json(updated);
}
