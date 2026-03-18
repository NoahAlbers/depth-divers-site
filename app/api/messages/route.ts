import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import { PLAYERS } from "@/lib/players";

const validNames = [...PLAYERS.map((p) => p.name), "Noah", "DM"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const player = searchParams.get("player");

  if (!player) {
    return NextResponse.json({ error: "player param required" }, { status: 400 });
  }

  // DM sees all messages
  if ((player === "DM" || player === "Noah") && (await isDMAuthorized(request))) {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      messages,
      lastUpdated: new Date().toISOString(),
    });
  }

  // Regular player: see messages they sent or received, plus group messages
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { from: player },
        { to: player },
        { to: "ALL" },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    messages,
    lastUpdated: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const { from, to, body } = await request.json();

  if (!from || !to || !body?.trim()) {
    return NextResponse.json(
      { error: "from, to, and body are required" },
      { status: 400 }
    );
  }

  if (!validNames.includes(from) && from !== "DM") {
    return NextResponse.json({ error: "Invalid sender" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { from, to, body: body.trim() },
  });

  return NextResponse.json(message, { status: 201 });
}
