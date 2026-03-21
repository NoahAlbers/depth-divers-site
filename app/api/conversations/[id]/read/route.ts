import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { playerName } = await request.json();

  if (!playerName) {
    return NextResponse.json(
      { error: "playerName required" },
      { status: 400 }
    );
  }

  await prisma.conversationRead.upsert({
    where: {
      conversationId_playerName: {
        conversationId: id,
        playerName,
      },
    },
    update: { lastReadAt: new Date() },
    create: {
      conversationId: id,
      playerName,
      lastReadAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
