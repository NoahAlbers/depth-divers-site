import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPlayerInConversation } from "@/lib/conversations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const player = searchParams.get("player");

  if (player && !(await isPlayerInConversation(id, player))) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Auto-create pinboard if missing
  let pinboard = await prisma.pinboard.findUnique({
    where: { conversationId: id },
  });

  if (!pinboard) {
    pinboard = await prisma.pinboard.create({
      data: { conversationId: id },
    });
  }

  return NextResponse.json({
    pinboard,
    lastUpdated: new Date().toISOString(),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content, updatedBy } = await request.json();

  if (content === undefined) {
    return NextResponse.json(
      { error: "content required" },
      { status: 400 }
    );
  }

  const pinboard = await prisma.pinboard.upsert({
    where: { conversationId: id },
    update: { content, updatedBy: updatedBy || null },
    create: { conversationId: id, content, updatedBy: updatedBy || null },
  });

  return NextResponse.json({ pinboard });
}
