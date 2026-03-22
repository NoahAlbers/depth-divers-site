import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const poll = await prisma.poll.update({
    where: { id },
    data: { status: "closed", closedAt: new Date() },
  });

  return NextResponse.json({
    ...poll,
    options: JSON.parse(poll.options as string),
    votes: JSON.parse(poll.votes as string),
  });
}
