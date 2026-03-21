import webpush from "web-push";
import { prisma } from "./prisma";
import { PLAYERS } from "./players";

// Configure VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to a specific player (all their devices).
 * Fire-and-forget — never throws, never blocks.
 */
export async function sendPushToPlayer(playerName: string, payload: PushPayload) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { playerName },
    });

    if (subscriptions.length === 0) return;

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload)
          );
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          // 410 Gone or 404 — subscription expired, clean it up
          if (statusCode === 410 || statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
          throw err;
        }
      })
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.log(`Push to ${playerName}: ${subscriptions.length - failed}/${subscriptions.length} delivered`);
    }
  } catch (err) {
    console.error(`Push error for ${playerName}:`, err);
  }
}

/**
 * Send a push notification to multiple specific players.
 */
export function sendPushToPlayers(playerNames: string[], payload: PushPayload) {
  // Fire and forget — don't await
  Promise.allSettled(
    playerNames.map((name) => sendPushToPlayer(name, payload))
  ).catch(() => {});
}

/**
 * Send a push notification to all players (not DM).
 */
export function sendPushToAllPlayers(payload: PushPayload) {
  const playerNames = PLAYERS.map((p) => p.name);
  sendPushToPlayers(playerNames, payload);
}
