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
  const { playerName } = await request.json();

  if (!playerName) {
    return NextResponse.json({ error: "playerName required" }, { status: 400 });
  }

  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const results = JSON.parse(session.results) as Array<{ playerName: string }>;
  const filtered = results.filter((r) => r.playerName !== playerName);

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { results: JSON.stringify(filtered) },
  });

  return NextResponse.json({ success: true });
}
