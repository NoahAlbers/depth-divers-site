import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPlayerInConversation } from "@/lib/conversations";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, emoji, playerName } = await request.json();

  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  if (conversation.type !== "group") {
    return NextResponse.json(
      { error: "Can only update group conversations" },
      { status: 400 }
    );
  }

  // Check authorization: must be a member or DM
  const isDM = await isDMAuthorized(request);
  if (!isDM && playerName) {
    const isMember = await isPlayerInConversation(id, playerName);
    if (!isMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }
  }

  // Validate name
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }
    if (name.length > 50) {
      return NextResponse.json(
        { error: "Name must be 50 characters or less" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.conversation.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(emoji !== undefined && { emoji: emoji || null }),
    },
  });

  return NextResponse.json({
    ...updated,
    members: JSON.parse(updated.members),
  });
}
