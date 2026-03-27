import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { playerName } = await request.json();
    if (!playerName) {
      return NextResponse.json({ error: "playerName required" }, { status: 400 });
    }

    await prisma.player.update({
      where: { name: playerName },
      data: { lastActiveAt: new Date() },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
