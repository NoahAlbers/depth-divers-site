import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...conversation,
    members: JSON.parse(conversation.members),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { deletedBy } = await request.json().catch(() => ({ deletedBy: null }));

  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  // Cannot delete DM conversations
  if (conversation.type === "dm") {
    return NextResponse.json(
      { error: "Cannot delete DM conversations" },
      { status: 400 }
    );
  }

  // Only creator or DM can delete group conversations
  const isDM = await isDMAuthorized(request);
  if (!isDM && deletedBy !== conversation.createdBy) {
    return NextResponse.json(
      { error: "Only the creator or DM can delete this group" },
      { status: 403 }
    );
  }

  // Get message IDs for cascade deletion of reactions
  const messages = await prisma.messageV2.findMany({
    where: { conversationId: id },
    select: { id: true },
  });
  const messageIds = messages.map((m) => m.id);

  // Delete associated data (reactions → messages → reads → pinboard → conversation)
  await prisma.$transaction([
    ...(messageIds.length > 0
      ? [prisma.messageReaction.deleteMany({ where: { messageId: { in: messageIds } } })]
      : []),
    prisma.messageV2.deleteMany({ where: { conversationId: id } }),
    prisma.conversationRead.deleteMany({ where: { conversationId: id } }),
    prisma.pinboard.deleteMany({ where: { conversationId: id } }),
    prisma.conversation.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
