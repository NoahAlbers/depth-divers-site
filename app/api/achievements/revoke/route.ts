import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function DELETE(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "DM only" }, { status: 403 });
  }

  const { playerName, achievementSlug } = await request.json();

  if (!playerName || !achievementSlug) {
    return NextResponse.json(
      { error: "playerName and achievementSlug required" },
      { status: 400 }
    );
  }

  await prisma.playerAchievement.deleteMany({
    where: { playerName, achievementSlug },
  });

  return NextResponse.json({ revoked: true });
}
