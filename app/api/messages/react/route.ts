import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { messageId, playerName, emoji } = await request.json();

  if (!messageId || !playerName || !emoji) {
    return NextResponse.json(
      { error: "messageId, playerName, and emoji required" },
      { status: 400 }
    );
  }

  const reaction = await prisma.messageReaction.upsert({
    where: {
      messageId_playerName_emoji: { messageId, playerName, emoji },
    },
    update: {},
    create: { messageId, playerName, emoji },
  });

  return NextResponse.json(reaction, { status: 201 });
}

export async function DELETE(request: Request) {
  const { messageId, playerName, emoji } = await request.json();

  if (!messageId || !playerName || !emoji) {
    return NextResponse.json(
      { error: "messageId, playerName, and emoji required" },
      { status: 400 }
    );
  }

  try {
    await prisma.messageReaction.delete({
      where: {
        messageId_playerName_emoji: { messageId, playerName, emoji },
      },
    });
  } catch {
    // Already deleted
  }

  return NextResponse.json({ success: true });
}
