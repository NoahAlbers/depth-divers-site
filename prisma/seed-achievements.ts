import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  // Escape & Survival
  { slug: "on-the-run", name: "On the Run", description: "Break out of drow capture", category: "Escape & Survival", hidden: false, icon: "🏃", order: 1 },
  { slug: "escape-artist", name: "Escape Artist", description: "Break out of drow capture... twice.", category: "Escape & Survival", hidden: false, icon: "🎭", order: 2 },
  { slug: "spelunker", name: "Spelunker", description: "Survive 1+ month in Underdark tunnels", category: "Escape & Survival", hidden: false, icon: "🕳️", order: 3 },
  { slug: "web-runner", name: "Web Runner", description: "Survive the Silken Paths", category: "Escape & Survival", hidden: false, icon: "🕸️", order: 4 },
  { slug: "not-today", name: "Not Today", description: "Die, then come back.", category: "Escape & Survival", hidden: false, icon: "💀", order: 5 },
  { slug: "game-over", name: "Game Over", description: "Experience a TPK.", category: "Escape & Survival", hidden: true, icon: "☠️", order: 6 },
  { slug: "sole-survivor", name: "Sole Survivor", description: "Be the last party member standing in an encounter", category: "Escape & Survival", hidden: false, icon: "🧍", order: 7 },
  { slug: "free-fall", name: "Free Fall", description: "Fall 500+ feet", category: "Escape & Survival", hidden: true, icon: "🪂", order: 8 },
  { slug: "dinner-guest", name: "Dinner Guest", description: "Be swallowed by a creature", category: "Escape & Survival", hidden: true, icon: "🦷", order: 9 },
  { slug: "frequent-flyer", name: "Frequent Flyer", description: "Get launched, thrown, or blasted 30+ feet involuntarily", category: "Escape & Survival", hidden: false, icon: "🚀", order: 10 },

  // Combat & Violence
  { slug: "regicide", name: "Regicide", description: "Kill a leader or ruler", category: "Combat & Violence", hidden: false, icon: "👑", order: 11 },
  { slug: "heads-will-roll", name: "Heads Will Roll", description: "Kill a king or queen who rules over 5000+ people", category: "Combat & Violence", hidden: true, icon: "⚔️", order: 12 },
  { slug: "god-slayer", name: "God Slayer", description: "Kill a deity", category: "Combat & Violence", hidden: true, icon: "🗡️", order: 13 },
  { slug: "draconicida", name: "Draconicida", description: "Kill an adult or older dragon", category: "Combat & Violence", hidden: false, icon: "🐉", order: 14 },
  { slug: "domino-effect", name: "Domino Effect", description: "Kill 3+ enemies with a single action", category: "Combat & Violence", hidden: false, icon: "💥", order: 15 },
  { slug: "resourceful", name: "Resourceful", description: "Kill an enemy with an improvised weapon", category: "Combat & Violence", hidden: false, icon: "🪑", order: 16 },
  { slug: "coup-de-grace", name: "Coup de Grâce", description: "Land the killing blow on a boss the DM spent hours prepping", category: "Combat & Violence", hidden: false, icon: "🎯", order: 17 },
  { slug: "scorched-earth", name: "Scorched Earth", description: "Destroy a building or structure during combat", category: "Combat & Violence", hidden: false, icon: "🔥", order: 18 },
  { slug: "rocks-fall", name: "Rocks Fall", description: "Kill someone using the environment", category: "Combat & Violence", hidden: false, icon: "🪨", order: 19 },
  { slug: "wrestling-pro", name: "Wrestling Pro", description: "Grapple enemies 3 times in 1 encounter", category: "Combat & Violence", hidden: false, icon: "🤼", order: 20 },
  { slug: "blind-sight", name: "Blind Sight", description: "Hit an enemy you cannot see", category: "Combat & Violence", hidden: false, icon: "🎯", order: 21 },
  { slug: "kool-aid-man", name: "Kool-Aid Man", description: "Burst through a wall to gain surprise.", category: "Combat & Violence", hidden: true, icon: "🧱", order: 22 },

  // Dice Luck
  { slug: "one-in-8000", name: "1/8000", description: "Roll three Natural 20s in a row", category: "Dice Luck", hidden: true, icon: "🎲", order: 23 },
  { slug: "what-are-the-odds", name: "What are the odds?", description: "Roll three Natural 1s in a row", category: "Dice Luck", hidden: true, icon: "🎲", order: 24 },

  // Roleplay & Social
  { slug: "the-diplomat", name: "The Diplomat", description: "Talk your way out of a fight that seemed inevitable", category: "Roleplay & Social", hidden: false, icon: "🕊️", order: 25 },
  { slug: "silver-tongue", name: "Silver Tongue", description: "Successfully deceive an NPC on a DC 20+", category: "Roleplay & Social", hidden: false, icon: "👅", order: 26 },
  { slug: "method-actor", name: "Method Actor", description: "Trick 3+ NPCs you are someone you are not, in one session.", category: "Roleplay & Social", hidden: false, icon: "🎭", order: 27 },
  { slug: "heart-of-gold", name: "Heart of Gold", description: "Help someone with no benefit to yourself", category: "Roleplay & Social", hidden: false, icon: "💛", order: 28 },
  { slug: "oath-breaker", name: "Oath Breaker", description: "Break a true promise you made to an NPC", category: "Roleplay & Social", hidden: false, icon: "💔", order: 29 },
  { slug: "fine-print", name: "Fine Print", description: "Make a deal without fully understanding the consequences", category: "Roleplay & Social", hidden: false, icon: "📜", order: 30 },
  { slug: "identity-crisis", name: "Identity Crisis", description: "Question your own faith, origin, or purpose to a level where your 'old' self would never imagine.", category: "Roleplay & Social", hidden: false, icon: "🪞", order: 31 },
  { slug: "woo-woo", name: "Woo Woo", description: "Seduce an NPC", category: "Roleplay & Social", hidden: true, icon: "😘", order: 32 },
  { slug: "homewrecker", name: "Homewrecker", description: "Break up an NPC marriage or relationship.", category: "Roleplay & Social", hidden: true, icon: "💋", order: 33 },
  { slug: "missionary", name: "Missionary", description: "Convert an NPC's religion", category: "Roleplay & Social", hidden: false, icon: "⛪", order: 34 },
  { slug: "attorney-at-law", name: "Attorney at Law", description: "Win a legal case.", category: "Roleplay & Social", hidden: false, icon: "⚖️", order: 35 },
  { slug: "bounced", name: "Bounced", description: "Get kicked out of a public establishment", category: "Roleplay & Social", hidden: false, icon: "🚪", order: 36 },
  { slug: "cannibal", name: "Cannibal", description: "Eat an intelligent humanoid.", category: "Roleplay & Social", hidden: true, icon: "🍖", order: 37 },

  // Wealth & Property
  { slug: "dragons-hoard", name: "Dragon's Hoard", description: "Amass 1000 gold pieces that are yours.", category: "Wealth & Property", hidden: false, icon: "💰", order: 38 },
  { slug: "philanthropist", name: "Philanthropist", description: "Give away 100+ gold to those in need", category: "Wealth & Property", hidden: false, icon: "🤲", order: 39 },
  { slug: "landlord", name: "Landlord", description: "Own property for financial gain", category: "Wealth & Property", hidden: false, icon: "🏠", order: 40 },
  { slug: "pickpocket", name: "Pickpocket", description: "Steal something from an NPC during conversation without them noticing", category: "Wealth & Property", hidden: false, icon: "🤏", order: 41 },

  // Magic & Supernatural
  { slug: "cursed", name: "Cursed", description: "Become afflicted by a curse", category: "Magic & Supernatural", hidden: false, icon: "🧿", order: 42 },
  { slug: "purified", name: "Purified", description: "Have a curse removed", category: "Magic & Supernatural", hidden: false, icon: "✨", order: 43 },
  { slug: "arcane-overload", name: "Arcane Overload", description: "Gain levels of exhaustion from over-casting a spell", category: "Magic & Supernatural", hidden: false, icon: "⚡", order: 44 },
  { slug: "arcane-exertion", name: "Arcane Exertion", description: "Reach level 5+ of exhaustion by over-casting a spell", category: "Magic & Supernatural", hidden: true, icon: "💫", order: 45 },
  { slug: "haunted", name: "Haunted", description: "Be targeted by a creature that attacks your dreams", category: "Magic & Supernatural", hidden: false, icon: "👻", order: 46 },

  // Body & Condition
  { slug: "helen-keller", name: "Helen Keller", description: "Be blind and deaf simultaneously.", category: "Body & Condition", hidden: true, icon: "🙈", order: 47 },
  { slug: "changed", name: "Changed", description: "Get a permanent deformity", category: "Body & Condition", hidden: false, icon: "🦾", order: 48 },
  { slug: "tattooed", name: "Tattooed", description: "Get a permanent tattoo", category: "Body & Condition", hidden: false, icon: "🎨", order: 49 },
  { slug: "iron-liver", name: "Iron Liver", description: "Survive past round 20 in a drinking contest", category: "Body & Condition", hidden: false, icon: "🍺", order: 50 },
  { slug: "designated-driver", name: "Designated Driver", description: "Be the only sober party member during a tavern scene", category: "Body & Condition", hidden: true, icon: "🚗", order: 51 },

  // Companions & Loss
  { slug: "pet-collector", name: "Pet Collector", description: "Have 2+ animal companions simultaneously", category: "Companions & Loss", hidden: false, icon: "🐾", order: 52 },
  { slug: "cannon-fodder", name: "Cannon Fodder", description: "An NPC you control dies", category: "Companions & Loss", hidden: false, icon: "💣", order: 53 },
  { slug: "gone-but-not-forgotten", name: "Gone But Not Forgotten", description: "Lose a fellow party member permanently", category: "Companions & Loss", hidden: false, icon: "🕯️", order: 54 },
  { slug: "reincarnate", name: "Reincarnate", description: "A past character of yours has died", category: "Companions & Loss", hidden: false, icon: "🔄", order: 55 },

  // World Impact
  { slug: "viva-la-revolution", name: "Viva la Revolution", description: "Cause a revolution", category: "World Impact", hidden: false, icon: "✊", order: 56 },
  { slug: "civic-unrest", name: "Civic Unrest", description: "Cause a civil war", category: "World Impact", hidden: false, icon: "🏴", order: 57 },
  { slug: "legend", name: "Legend", description: "Have a song, story, or rumor spread about you in-game.", category: "World Impact", hidden: false, icon: "📖", order: 58 },
  { slug: "wanted", name: "Wanted", description: "Have a bounty placed on your head", category: "World Impact", hidden: false, icon: "🏴‍☠️", order: 59 },

  // Villains & Enemies
  { slug: "the-bbeg-question", name: "The BBEG?", description: "Meet with a recurring villain", category: "Villains & Enemies", hidden: false, icon: "🦹", order: 60 },
  { slug: "the-bbeg", name: "The BBEG", description: "Listen to a villain's monologue", category: "Villains & Enemies", hidden: false, icon: "🎤", order: 61 },
  { slug: "getting-even", name: "Getting Even", description: "Experience revenge from an old enemy", category: "Villains & Enemies", hidden: false, icon: "🔁", order: 62 },

  // Exploration
  { slug: "deja-vu", name: "Deja Vu", description: "Return to a location you previously fled from", category: "Exploration", hidden: false, icon: "🗺️", order: 63 },
];

async function main() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievementDefinition.upsert({
      where: { slug: achievement.slug },
      update: {
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        hidden: achievement.hidden,
        icon: achievement.icon,
        order: achievement.order,
      },
      create: achievement,
    });
    console.log(`Upserted: ${achievement.name}`);
  }
  console.log(`\nDone! ${ACHIEVEMENTS.length} achievements seeded.`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
