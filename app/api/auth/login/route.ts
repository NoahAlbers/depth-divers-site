import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensurePlayersExist } from "@/lib/ensure-players";

export async function POST(request: Request) {
  const { name, password } = await request.json();

  if (!name || !password) {
    return NextResponse.json(
      { error: "Name and password are required" },
      { status: 400 }
    );
  }

  try {
    await ensurePlayersExist();

    const player = await prisma.player.findUnique({ where: { name } });
    if (!player) {
      return NextResponse.json(
        { error: "The passphrase is incorrect, adventurer." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, player.password);
    if (!valid) {
      return NextResponse.json(
        { error: "The passphrase is incorrect, adventurer." },
        { status: 401 }
      );
    }

    const isDM = name === "Noah";
    return NextResponse.json({ success: true, name: player.name, isDM });
  } catch {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
