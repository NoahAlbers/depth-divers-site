import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import { sendPushToAllPlayers } from "@/lib/push";

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question, options, anonymous, showResults } = await request.json();

  // Close any existing active polls
  await prisma.poll.updateMany({
    where: { status: "active" },
    data: { status: "closed", closedAt: new Date() },
  });

  // Create new poll
  const poll = await prisma.poll.create({
    data: {
      question,
      options: JSON.stringify(options),
      anonymous: anonymous ?? false,
      showResults: showResults ?? true,
      status: "active",
      votes: JSON.stringify({}),
    },
  });

  // Notify all players
  await sendPushToAllPlayers({
    title: "\ud83d\udcca Poll from the DM",
    body: question,
    url: "/",
    tag: "poll",
  });

  return NextResponse.json(
    { ...poll, options: JSON.parse(poll.options as string) },
    { status: 201 }
  );
}
