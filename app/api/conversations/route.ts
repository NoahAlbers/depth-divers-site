import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConversationsForPlayer } from "@/lib/conversations";
import { ALL_NAMES, DM } from "@/lib/players";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const player = searchParams.get("player");

  if (!player) {
    return NextResponse.json(
      { error: "player query param required" },
      { status: 400 }
    );
  }

  const conversations = await getConversationsForPlayer(player);

  // Enrich each conversation with lastMessage and unreadCount
  const enriched = await Promise.all(
    conversations.map(async (convo) => {
      const lastMessage = await prisma.messageV2.findFirst({
        where: { conversationId: convo.id },
        orderBy: { createdAt: "desc" },
      });

      // Get unread count for this player
      let unreadCount = 0;
      const readRecord = await prisma.conversationRead.findUnique({
        where: {
          conversationId_playerName: {
            conversationId: convo.id,
            playerName: player,
          },
        },
      });

      if (readRecord) {
        unreadCount = await prisma.messageV2.count({
          where: {
            conversationId: convo.id,
            createdAt: { gt: readRecord.lastReadAt },
            from: { not: player },
          },
        });
      } else if (lastMessage) {
        // Never opened — all messages from others are unread
        unreadCount = await prisma.messageV2.count({
          where: {
            conversationId: convo.id,
            from: { not: player },
          },
        });
      }

      return {
        ...convo,
        members: JSON.parse(convo.members),
        lastMessage,
        unreadCount,
      };
    })
  );

  // Sort by last message time (most recent first), convos with no messages last
  enriched.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt?.getTime() ?? 0;
    const bTime = b.lastMessage?.createdAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  return NextResponse.json({
    conversations: enriched,
    lastUpdated: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const { name, members, createdBy } = await request.json();

  if (!name || !members || !Array.isArray(members) || !createdBy) {
    return NextResponse.json(
      { error: "name, members array, and createdBy required" },
      { status: 400 }
    );
  }

  // Validate all members are valid player names
  const allNames = ALL_NAMES as readonly string[];
  for (const member of members) {
    if (!allNames.includes(member)) {
      return NextResponse.json(
        { error: `Invalid member: ${member}` },
        { status: 400 }
      );
    }
  }

  // Ensure DM is always included in group chats (god mode visibility)
  const memberSet = new Set(members);
  if (!memberSet.has(DM.name)) {
    memberSet.add(DM.name);
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "group",
      name,
      members: JSON.stringify([...memberSet].sort()),
      createdBy,
    },
  });

  return NextResponse.json(
    { ...conversation, members: JSON.parse(conversation.members) },
    { status: 201 }
  );
}
