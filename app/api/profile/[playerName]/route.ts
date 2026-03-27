import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ playerName: string }> }
) {
  const { playerName } = await params;

  const player = await prisma.player.findUnique({
    where: { name: playerName },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const characterSheet = await prisma.characterSheet.findUnique({
    where: { playerName },
  });

  const achievementCount = await prisma.playerAchievement.count({
    where: { playerName },
  });

  const recentAchievements = await prisma.playerAchievement.findMany({
    where: { playerName },
    orderBy: { awardedAt: "desc" },
    take: 5,
  });

  // Fetch achievement definitions for recent achievements
  const achievementSlugs = recentAchievements.map((a) => a.achievementSlug);
  const achievementDefs = achievementSlugs.length > 0
    ? await prisma.achievementDefinition.findMany({
        where: { slug: { in: achievementSlugs } },
      })
    : [];
  const defMap = Object.fromEntries(achievementDefs.map((d) => [d.slug, d]));

  const recentAchievementsWithDefs = recentAchievements.map((a) => ({
    ...a,
    definition: defMap[a.achievementSlug] || null,
  }));

  // Game stats
  const gameSessions = await prisma.gameSession.findMany({
    where: { status: "finished" },
  });

  let totalGames = 0;
  let wins = 0;
  const highestScores: Record<string, number> = {};

  for (const session of gameSessions) {
    const results: Array<{ playerName: string; score: number }> = JSON.parse(session.results);
    const playerResult = results.find((r) => r.playerName === playerName);
    if (!playerResult) continue;

    totalGames++;

    // Check if player won (highest score)
    const maxScore = Math.max(...results.map((r) => r.score));
    if (playerResult.score === maxScore) wins++;

    // Track highest score per game
    if (!highestScores[session.gameId] || playerResult.score > highestScores[session.gameId]) {
      highestScores[session.gameId] = playerResult.score;
    }
  }

  // Online status
  let onlineStatus: "online" | "away" | "offline" = "offline";
  let lastOnline: string | null = null;
  if (player.lastActiveAt) {
    const diff = Date.now() - player.lastActiveAt.getTime();
    if (diff < 2 * 60 * 1000) onlineStatus = "online";
    else if (diff < 15 * 60 * 1000) onlineStatus = "away";
    lastOnline = player.lastActiveAt.toISOString();
  }

  return NextResponse.json({
    name: player.name,
    color: player.color,
    onlineStatus,
    lastOnline,
    characterSheet: characterSheet
      ? {
          characterName: characterSheet.characterName,
          race: characterSheet.race,
          class: (characterSheet as Record<string, unknown>).class ?? null,
          level: characterSheet.level,
          movementSpeed: characterSheet.movementSpeed,
          strength: characterSheet.strength,
          dexterity: characterSheet.dexterity,
          constitution: characterSheet.constitution,
          intelligence: characterSheet.intelligence,
          wisdom: characterSheet.wisdom,
          charisma: characterSheet.charisma,
        }
      : null,
    achievementCount,
    recentAchievements: recentAchievementsWithDefs,
    gameStats: {
      totalGames,
      wins,
      highestScores,
    },
    memberId: player.id,
  });
}
