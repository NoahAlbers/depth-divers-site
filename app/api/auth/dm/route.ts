import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { password } = await request.json();

  try {
    const dm = await prisma.player.findUnique({ where: { name: "Noah" } });
    if (!dm) {
      return NextResponse.json({ error: "DM not found" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, dm.password);
    if (valid) {
      return NextResponse.json({ success: true });
    }
  } catch {}

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
