import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";
import { sendPushToPlayers } from "@/lib/push";

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "DM only" }, { status: 403 });
  }

  const { playerNames, achievementSlug, note, sessionNumber } = await request.json();

  if (!playerNames?.length || !achievementSlug) {
    return NextResponse.json(
      { error: "playerNames and achievementSlug required" },
      { status: 400 }
    );
  }

  const definition = await prisma.achievementDefinition.findUnique({
    where: { slug: achievementSlug },
  });

  if (!definition) {
    return NextResponse.json({ error: "Achievement not found" }, { status: 404 });
  }

  const results = [];
  for (const playerName of playerNames) {
    try {
      const award = await prisma.playerAchievement.create({
        data: {
          playerName,
          achievementSlug,
          note: note || null,
          sessionNumber: sessionNumber || null,
        },
      });
      results.push(award);

      // Send push notification
      sendPushToPlayers([playerName], {
        title: `Achievement Unlocked: ${definition.name}!`,
        body: definition.hidden
          ? "You unlocked a secret achievement!"
          : definition.description,
        url: "/achievements",
        tag: "achievement",
      });
    } catch {
      // Already awarded — skip
    }
  }

  return NextResponse.json({ awarded: results }, { status: 201 });
}
