/**
 * Staging database reset script.
 * Wipes all data except Player accounts, optionally reseeds with test data.
 * Run with: npx tsx scripts/reset-staging.ts
 *
 * Safety: refuses to run if NEXT_PUBLIC_ENVIRONMENT is "production".
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT;

  if (env === "production") {
    console.error("REFUSING TO RUN: This script cannot run against production.");
    console.error("Set NEXT_PUBLIC_ENVIRONMENT to 'staging' or 'development'.");
    process.exit(1);
  }

  console.log(`Environment: ${env || "not set"}`);
  console.log("Resetting staging database...\n");

  // Truncate all tables except Player
  console.log("Clearing data...");

  await prisma.messageV2.deleteMany();
  console.log("  - MessageV2: cleared");

  await prisma.conversationRead.deleteMany();
  console.log("  - ConversationRead: cleared");

  await prisma.pinboard.deleteMany();
  console.log("  - Pinboard: cleared");

  await prisma.conversation.deleteMany();
  console.log("  - Conversation: cleared");

  await prisma.message.deleteMany();
  console.log("  - Message (legacy): cleared");

  await prisma.initiative.deleteMany();
  console.log("  - Initiative: cleared");

  await prisma.initiativeState.deleteMany();
  console.log("  - InitiativeState: cleared");

  try {
    await prisma.seatingLock.delete({ where: { id: "active" } });
  } catch {}
  console.log("  - SeatingLock: cleared");

  await prisma.gameSession.deleteMany();
  console.log("  - GameSession: cleared");

  await prisma.pushSubscription.deleteMany();
  console.log("  - PushSubscription: cleared");

  console.log("\nAll data cleared (Player accounts preserved).");

  // Reseed with sample data
  console.log("\nSeeding sample data...");

  // Create InitiativeState singleton
  await prisma.initiativeState.create({
    data: { id: "singleton", round: 1, isActive: false, phase: "idle" },
  });
  console.log("  - InitiativeState: created");

  // Create DM conversations + Party Chat
  const PLAYERS = ["Mykolov", "Brent", "Jonathan", "Justin", "Eric", "Matthew"];
  const ALL = [...PLAYERS, "Noah"];

  for (const player of PLAYERS) {
    await prisma.conversation.create({
      data: {
        type: "dm",
        members: JSON.stringify([player, "Noah"].sort()),
        createdBy: "system",
      },
    });
  }
  console.log("  - DM conversations: 6 created");

  const partyChat = await prisma.conversation.create({
    data: {
      type: "group",
      name: "Party Chat",
      members: JSON.stringify(ALL.sort()),
      createdBy: "system",
    },
  });
  console.log("  - Party Chat: created");

  // Add a few sample messages
  const dmConvo = await prisma.conversation.findFirst({
    where: { type: "dm", members: { contains: "Mykolov" } },
  });

  if (dmConvo) {
    await prisma.messageV2.create({
      data: {
        conversationId: dmConvo.id,
        from: "Mykolov",
        body: "Hey Noah, ready for the session?",
      },
    });
    await prisma.messageV2.create({
      data: {
        conversationId: dmConvo.id,
        from: "Noah",
        body: "Always. Bring extra rations this time.",
      },
    });
    console.log("  - Sample DM messages: 2 created");
  }

  await prisma.messageV2.create({
    data: {
      conversationId: partyChat.id,
      from: "Brent",
      body: "Who's recapping this session?",
      tag: "OOC",
    },
  });
  console.log("  - Sample party message: 1 created");

  console.log("\nStaging reset complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
