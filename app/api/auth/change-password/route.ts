import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { name, currentPassword, newPassword } = await request.json();

  if (!name || !currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 1) {
    return NextResponse.json(
      { error: "New password cannot be empty" },
      { status: 400 }
    );
  }

  try {
    const player = await prisma.player.findUnique({ where: { name } });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, player.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.player.update({
      where: { name },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Password change failed" },
      { status: 500 }
    );
  }
}
