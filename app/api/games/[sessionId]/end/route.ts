import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const updated = await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      status: "finished",
      endedAt: new Date(),
    },
  });

  return NextResponse.json({
    session: {
      ...updated,
      players: JSON.parse(updated.players),
      results: JSON.parse(updated.results),
    },
  });
}
