import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPlayerInConversation } from "@/lib/conversations";
import { ALL_NAMES } from "@/lib/players";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const player = searchParams.get("player");
  const limit = Math.min(Number(searchParams.get("limit") || 100), 200);

  if (!player) {
    return NextResponse.json(
      { error: "player query param required" },
      { status: 400 }
    );
  }

  // Check membership
  if (!(await isPlayerInConversation(id, player))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const messages = await prisma.messageV2.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  // Auto-mark as read
  await prisma.conversationRead.upsert({
    where: {
      conversationId_playerName: {
        conversationId: id,
        playerName: player,
      },
    },
    update: { lastReadAt: new Date() },
    create: {
      conversationId: id,
      playerName: player,
      lastReadAt: new Date(),
    },
  });

  return NextResponse.json({
    messages,
    lastUpdated: new Date().toISOString(),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { from, body, tag } = await request.json();

  if (!from || !body?.trim()) {
    return NextResponse.json(
      { error: "from and body required" },
      { status: 400 }
    );
  }

  const allNames = ALL_NAMES as readonly string[];
  if (!allNames.includes(from) && from !== "DM") {
    return NextResponse.json(
      { error: "Invalid sender" },
      { status: 400 }
    );
  }

  // Check membership (DM can send to any conversation)
  if (!(await isPlayerInConversation(id, from === "DM" ? "Noah" : from))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Validate tag
  if (tag && !["IC", "OOC"].includes(tag)) {
    return NextResponse.json(
      { error: "tag must be IC, OOC, or null" },
      { status: 400 }
    );
  }

  const message = await prisma.messageV2.create({
    data: {
      conversationId: id,
      from,
      body: body.trim(),
      tag: tag || null,
    },
  });

  // Update sender's read status so their own messages don't count as unread
  await prisma.conversationRead.upsert({
    where: {
      conversationId_playerName: {
        conversationId: id,
        playerName: from === "DM" ? "Noah" : from,
      },
    },
    update: { lastReadAt: new Date() },
    create: {
      conversationId: id,
      playerName: from === "DM" ? "Noah" : from,
      lastReadAt: new Date(),
    },
  });

  return NextResponse.json(message, { status: 201 });
}
