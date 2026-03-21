import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function GET(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  const messages = await prisma.messageV2.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Enrich with conversation info
  const convoIds = [...new Set(messages.map((m) => m.conversationId))];
  const conversations = await prisma.conversation.findMany({
    where: { id: { in: convoIds } },
  });
  const convoMap = new Map(conversations.map((c) => [c.id, c]));

  const enriched = messages.map((msg) => {
    const convo = convoMap.get(msg.conversationId);
    return {
      ...msg,
      conversationName: convo?.name || null,
      conversationType: convo?.type || "dm",
      conversationMembers: convo ? JSON.parse(convo.members) : [],
    };
  });

  return NextResponse.json({
    messages: enriched.reverse(), // oldest first for display
    lastUpdated: new Date().toISOString(),
  });
}
