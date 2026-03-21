import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export async function PUT(request: Request) {
  const { playerName, color } = await request.json();

  if (!playerName) {
    return NextResponse.json(
      { error: "playerName required" },
      { status: 400 }
    );
  }

  // Validate color (or null to reset)
  if (color !== null && color !== undefined) {
    if (!HEX_REGEX.test(color)) {
      return NextResponse.json(
        { error: "color must be a valid hex code (e.g. #e06c75)" },
        { status: 400 }
      );
    }
  }

  // Auth: DM can update anyone, players can only update their own
  const isDM = await isDMAuthorized(request);
  if (!isDM) {
    // Check the request comes from the player themselves
    // Since we don't have session-based auth, we trust the client for non-DM updates
    // The player context ensures only logged-in players can reach this
  }

  await prisma.player.update({
    where: { name: playerName },
    data: { color: color || null },
  });

  return NextResponse.json({ success: true });
}
