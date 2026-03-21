import { NextResponse } from "next/server";
import { GAMES } from "@/lib/games/registry";

export async function GET() {
  return NextResponse.json({ games: GAMES });
}
