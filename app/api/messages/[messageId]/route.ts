import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messageId } = await params;

  // Delete reactions first, then the message
  await prisma.$transaction([
    prisma.messageReaction.deleteMany({ where: { messageId } }),
    prisma.messageV2.delete({ where: { id: messageId } }),
  ]);

  return NextResponse.json({ success: true });
}
