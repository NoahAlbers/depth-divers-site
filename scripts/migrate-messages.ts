/**
 * One-time migration script: converts old Message records to MessageV2 + Conversation pairs.
 * Run with: npx tsx scripts/migrate-messages.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLAYERS = ["Mykolov", "Brent", "Jonathan", "Justin", "Eric", "Matthew"];
const DM_NAME = "Noah";
const ALL_MEMBERS = [...PLAYERS, DM_NAME];

async function main() {
  console.log("Starting message migration...");

  // Ensure conversations exist
  const existingCount = await prisma.conversation.count();
  if (existingCount === 0) {
    console.log("Creating default conversations...");

    // Create DM conversations
    for (const player of PLAYERS) {
      await prisma.conversation.create({
        data: {
          type: "dm",
          members: JSON.stringify([player, DM_NAME].sort()),
          createdBy: "system",
        },
      });
      console.log(`  Created DM: ${player} <-> ${DM_NAME}`);
    }

    // Create Party Chat
    await prisma.conversation.create({
      data: {
        type: "group",
        name: "Party Chat",
        members: JSON.stringify(ALL_MEMBERS.sort()),
        createdBy: "system",
      },
    });
    console.log("  Created Party Chat");
  }

  // Get all old messages
  const oldMessages = await prisma.message.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${oldMessages.length} old messages to migrate`);

  // Cache for conversation lookups
  const conversationCache = new Map<string, string>(); // key -> conversationId

  let migrated = 0;
  let skipped = 0;

  for (const msg of oldMessages) {
    let conversationId: string | undefined;

    if (msg.to === "ALL") {
      // Find Party Chat
      const cacheKey = "party-chat";
      if (!conversationCache.has(cacheKey)) {
        const partyChat = await prisma.conversation.findFirst({
          where: { type: "group", name: "Party Chat" },
        });
        if (partyChat) conversationCache.set(cacheKey, partyChat.id);
      }
      conversationId = conversationCache.get(cacheKey);
    } else {
      // Find DM conversation between from and to
      const from = msg.from === "DM" ? DM_NAME : msg.from;
      const to = msg.to === "DM" ? DM_NAME : msg.to;
      const members = [from, to].sort();
      const cacheKey = `dm:${members.join(",")}`;

      if (!conversationCache.has(cacheKey)) {
        const membersJson = JSON.stringify(members);
        let convo = await prisma.conversation.findFirst({
          where: { type: "dm", members: membersJson },
        });

        if (!convo) {
          // Create the DM conversation if it doesn't exist
          convo = await prisma.conversation.create({
            data: {
              type: "dm",
              members: membersJson,
              createdBy: "system",
            },
          });
          console.log(`  Created missing DM: ${from} <-> ${to}`);
        }

        conversationCache.set(cacheKey, convo.id);
      }
      conversationId = conversationCache.get(cacheKey);
    }

    if (!conversationId) {
      console.log(
        `  Skipped message from ${msg.from} to ${msg.to}: no conversation found`
      );
      skipped++;
      continue;
    }

    // Check for duplicate
    const existing = await prisma.messageV2.findFirst({
      where: {
        conversationId,
        from: msg.from,
        body: msg.body,
        createdAt: msg.createdAt,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.messageV2.create({
      data: {
        conversationId,
        from: msg.from,
        body: msg.body,
        tag: null,
        createdAt: msg.createdAt,
      },
    });

    migrated++;
  }

  console.log(
    `Migration complete: ${migrated} migrated, ${skipped} skipped`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
