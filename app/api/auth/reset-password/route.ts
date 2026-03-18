import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetPlayer, newPassword } = await request.json();

  if (!targetPlayer || !newPassword) {
    return NextResponse.json(
      { error: "targetPlayer and newPassword are required" },
      { status: 400 }
    );
  }

  try {
    const player = await prisma.player.findUnique({
      where: { name: targetPlayer },
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.player.update({
      where: { name: targetPlayer },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Password reset failed" },
      { status: 500 }
    );
  }
}
