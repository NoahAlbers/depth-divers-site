import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { type RoundData, getChainAssignment, getRoundType } from "@/lib/games/underdark-telephone";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { playerName, round, type, content } = await request.json();

  if (!playerName || round === undefined || !type || content === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "active") {
    return NextResponse.json({ error: "Game not active" }, { status: 400 });
  }

  const players: string[] = JSON.parse(session.players);
  if (!players.includes(playerName)) {
    return NextResponse.json({ error: "Player not in game" }, { status: 400 });
  }

  if (round !== session.currentRound) {
    return NextResponse.json({ error: "Wrong round" }, { status: 400 });
  }

  const roundData: RoundData = JSON.parse(session.roundData || '{"chains":[],"submissions":{}}');

  // Check duplicate
  const subKey = `${playerName}_${round}`;
  if (roundData.submissions[subKey]) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  // Get assignment to find which chain this goes to
  const assignments = getChainAssignment(players, round, roundData);
  const assignment = assignments[playerName];
  if (!assignment) {
    return NextResponse.json({ error: "No assignment found" }, { status: 400 });
  }

  // Add entry to chain
  if (!roundData.chains[assignment.chainIndex]) {
    roundData.chains[assignment.chainIndex] = {
      startPlayer: players[assignment.chainIndex],
      entries: [],
    };
  }

  roundData.chains[assignment.chainIndex].entries.push({
    playerName,
    round,
    type: getRoundType(round),
    content,
    submittedAt: new Date().toISOString(),
  });

  roundData.submissions[subKey] = true;

  // Check if all players submitted
  const allSubmitted = players.every((p) => roundData.submissions[`${p}_${round}`]);

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { roundData: JSON.stringify(roundData) },
  });

  return NextResponse.json({ success: true, allSubmitted });
}
