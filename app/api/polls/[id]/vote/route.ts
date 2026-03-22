import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { playerName, optionIndex } = await request.json();

  const poll = await prisma.poll.findUnique({ where: { id } });

  if (!poll || poll.status !== "active") {
    return NextResponse.json({ error: "Poll not found or closed" }, { status: 404 });
  }

  const options = JSON.parse(poll.options as string);

  if (optionIndex < 0 || optionIndex >= options.length) {
    return NextResponse.json({ error: "Invalid option index" }, { status: 400 });
  }

  const votes = JSON.parse(poll.votes as string) as Record<string, number>;

  if (playerName in votes) {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  votes[playerName] = optionIndex;

  const updated = await prisma.poll.update({
    where: { id },
    data: { votes: JSON.stringify(votes) },
  });

  return NextResponse.json(JSON.parse(updated.votes as string));
}
