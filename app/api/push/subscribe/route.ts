import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { playerName, subscription } = await request.json();

  if (!playerName || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json(
      { error: "playerName and subscription (with endpoint, keys.p256dh, keys.auth) required" },
      { status: 400 }
    );
  }

  const sub = await prisma.pushSubscription.upsert({
    where: {
      playerName_endpoint: {
        playerName,
        endpoint: subscription.endpoint,
      },
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      playerName,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return NextResponse.json({ success: true, id: sub.id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { playerName, endpoint } = await request.json();

  if (!playerName || !endpoint) {
    return NextResponse.json(
      { error: "playerName and endpoint required" },
      { status: 400 }
    );
  }

  try {
    await prisma.pushSubscription.delete({
      where: {
        playerName_endpoint: { playerName, endpoint },
      },
    });
  } catch {
    // Already deleted
  }

  return NextResponse.json({ success: true });
}
