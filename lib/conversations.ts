import { prisma } from "./prisma";
import { PLAYERS, DM } from "./players";

const ALL_MEMBERS = [...PLAYERS.map((p) => p.name), DM.name];

let seeded = false;

/**
 * Ensure default conversations exist.
 * Creates DM conversations for ALL member pairs + Party Chat group.
 * Called lazily from the conversations API. Idempotent.
 */
export async function ensureConversations() {
  if (seeded) return;

  // Create DM conversations for every pair of members
  for (let i = 0; i < ALL_MEMBERS.length; i++) {
    for (let j = i + 1; j < ALL_MEMBERS.length; j++) {
      const members = JSON.stringify([ALL_MEMBERS[i], ALL_MEMBERS[j]].sort());
      const existing = await prisma.conversation.findFirst({
        where: { type: "dm", members },
      });
      if (!existing) {
        await prisma.conversation.create({
          data: {
            type: "dm",
            members,
            createdBy: "system",
          },
        });
      }
    }
  }

  // Create Party Chat group
  const partyMembers = JSON.stringify([...ALL_MEMBERS].sort());
  const existingParty = await prisma.conversation.findFirst({
    where: { type: "group", name: "Party Chat" },
  });
  if (!existingParty) {
    await prisma.conversation.create({
      data: {
        type: "group",
        name: "Party Chat",
        members: partyMembers,
        createdBy: "system",
      },
    });
  }

  seeded = true;
}

/**
 * Get all conversations for a player.
 * DM (Noah) sees ALL conversations regardless of membership.
 */
export async function getConversationsForPlayer(playerName: string) {
  await ensureConversations();

  if (playerName === DM.name) {
    return prisma.conversation.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // For regular players, find conversations where they are a member
  const allConvos = await prisma.conversation.findMany({
    orderBy: { createdAt: "desc" },
  });

  return allConvos.filter((c) => {
    const members: string[] = JSON.parse(c.members);
    return members.includes(playerName);
  });
}

/**
 * Check if a player is a member of a conversation.
 * DM can access any conversation.
 */
export async function isPlayerInConversation(
  conversationId: string,
  playerName: string
): Promise<boolean> {
  if (playerName === DM.name) return true;

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!convo) return false;

  const members: string[] = JSON.parse(convo.members);
  return members.includes(playerName);
}

/**
 * Get the display name for a conversation.
 * For DMs: shows the other person's name.
 * For groups: shows the group name.
 */
export function getConversationDisplayName(
  convo: { type: string; name: string | null; members: string },
  viewerName: string
): string {
  if (convo.type === "group") {
    return convo.name || "Group Chat";
  }
  // DM: show the other person's name
  const members: string[] = JSON.parse(convo.members);
  const other = members.find((m) => m !== viewerName);
  return other || "Unknown";
}
