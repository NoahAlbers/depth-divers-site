import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  type RoundData,
  getChainAssignment,
  getRoundType,
  getTotalRounds,
} from "@/lib/games/underdark-telephone";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const players: string[] = JSON.parse(session.players);
  const config: Record<string, unknown> = JSON.parse(session.config);
  const roundData: RoundData = JSON.parse(
    session.roundData || '{"chains":[],"submissions":{}}'
  );

  const totalRounds = getTotalRounds(
    players.length,
    config.roundCount as number | undefined
  );
  const currentRound = session.currentRound;
  const roundType = getRoundType(currentRound);

  // Who has submitted this round
  const submittedPlayers = players.filter(
    (p) => roundData.submissions[`${p}_${currentRound}`]
  );

  // Get assignments for the player querying
  const url = new URL(request.url);
  const queryPlayer = url.searchParams.get("player");

  let assignment: {
    chainIndex: number;
    type: "write" | "draw";
    previousContent?: string;
  } | null = null;

  if (queryPlayer && players.includes(queryPlayer)) {
    const assignments = getChainAssignment(players, currentRound, roundData);
    assignment = assignments[queryPlayer] || null;
  }

  // Check if we're in reveal phase
  const isReveal = currentRound >= totalRounds;

  // For reveal, return full chain data
  let chains: RoundData["chains"] | undefined;
  if (isReveal) {
    chains = roundData.chains;
  }

  return NextResponse.json({
    currentRound,
    totalRounds,
    roundType,
    submittedPlayers,
    totalPlayers: players.length,
    assignment,
    isReveal,
    chains,
    status: session.status,
  });
}
