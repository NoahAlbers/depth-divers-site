import { NextResponse } from "next/server";
import { isDMAuthorized } from "@/lib/dm-auth";

export async function POST(request: Request) {
  if (!(await isDMAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // No data change needed — just acknowledge the denial
  return NextResponse.json({ success: true });
}
