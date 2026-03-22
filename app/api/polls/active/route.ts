import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const poll = await prisma.poll.findFirst({
    where: { status: "active" },
  });

  if (!poll) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    ...poll,
    options: JSON.parse(poll.options as string),
    votes: JSON.parse(poll.votes as string),
    lastUpdated: new Date().toISOString(),
  });
}
