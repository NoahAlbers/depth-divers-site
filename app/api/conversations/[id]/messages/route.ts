import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPlayerInConversation } from "@/lib/conversations";
import { ALL_NAMES } from "@/lib/players";
import { sendPushToPlayers } from "@/lib/push";

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

  // Fetch read receipts for this conversation
  const readReceipts = await prisma.conversationRead.findMany({
    where: { conversationId: id },
  });
  const readMap: Record<string, string> = {};
  for (const r of readReceipts) {
    readMap[r.playerName] = r.lastReadAt.toISOString();
  }

  // Get conversation members
  const convo = await prisma.conversation.findUnique({ where: { id } });
  const members: string[] = convo ? JSON.parse(convo.members) : [];

  // Fetch reactions for all messages in this batch
  const messageIds = messages.map((m) => m.id);
  const reactions = messageIds.length > 0
    ? await prisma.messageReaction.findMany({
        where: { messageId: { in: messageIds } },
      })
    : [];

  // Group reactions by messageId
  const reactionsByMessage: Record<string, Array<{ playerName: string; emoji: string }>> = {};
  for (const r of reactions) {
    if (!reactionsByMessage[r.messageId]) reactionsByMessage[r.messageId] = [];
    reactionsByMessage[r.messageId].push({ playerName: r.playerName, emoji: r.emoji });
  }

  const messagesWithReactions = messages.map((msg) => ({
    ...msg,
    reactions: reactionsByMessage[msg.id] || [],
  }));

  return NextResponse.json({
    messages: messagesWithReactions,
    readReceipts: readMap,
    members,
    lastUpdated: new Date().toISOString(),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { from, body, tag, imageUrl } = await request.json();

  if (!from || (!body?.trim() && !imageUrl)) {
    return NextResponse.json(
      { error: "from and (body or imageUrl) required" },
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
      body: (body || "").trim(),
      tag: tag || null,
      imageUrl: imageUrl || null,
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

  // Fire-and-forget push notification to other members
  const convo = await prisma.conversation.findUnique({ where: { id } });
  if (convo) {
    const members: string[] = JSON.parse(convo.members);
    const senderName = from === "DM" ? "Noah" : from;
    const recipients = members.filter((m) => m !== senderName);
    const truncatedBody = body.trim().length > 50 ? body.trim().slice(0, 50) + "..." : body.trim();
    sendPushToPlayers(recipients, {
      title: `${from} sent a message`,
      body: truncatedBody,
      url: "/messages",
      tag: "message",
    });
  }

  return NextResponse.json(message, { status: 201 });
}
