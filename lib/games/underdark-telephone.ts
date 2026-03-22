import { createRNG } from "./seeded-random";

export interface ChainEntry {
  playerName: string;
  round: number;
  type: "write" | "draw";
  content: string;
  submittedAt: string;
}

export interface Chain {
  startPlayer: string;
  entries: ChainEntry[];
}

export interface RoundData {
  chains: Chain[];
  submissions: Record<string, boolean>; // "playerName_round" → true
}

export const DRAWING_PROMPTS = [
  // Creatures
  "A beholder having a bad hair day",
  "A mind flayer eating a sandwich",
  "A drow riding a giant spider into battle",
  "A gelatinous cube trying to make friends",
  "A myconid doing a little dance",
  "An aboleth remembering something embarrassing",
  "A kuo-toa worshipping a traffic cone",
  "A quaggoth in a fancy hat",
  "A drider knitting a web sweater",
  "Two hook horrors slow dancing",

  // Scenarios
  "A tavern brawl between dwarves and elves",
  "Someone falling into a pit trap",
  "A wizard casting a spell that went very wrong",
  "A dragon sleeping on a pile of gold coins",
  "An adventurer trying to haggle with a goblin merchant",
  "A minotaur lost in his own labyrinth",
  "A skeleton trying to drink a potion",
  "A party of adventurers arguing over a map",
  "A barbarian trying to read a spellbook",
  "A rogue stealing from another rogue",

  // Underdark-specific
  "Gracklstugh on a good day",
  "The Darklake at sunset (there is no sunset)",
  "A duergar forging a weapon angrily",
  "Mushrooms having a council meeting",
  "Faerzress making everything glow weird",
  "The Silken Paths — don't look down",
  "A derro explaining their conspiracy theory",
  "An underground waterfall of glowing water",
  "Stalactites and stalagmites arguing about who's who",
  "A deep gnome hiding so well you can barely draw them",
];

/**
 * Generate auto-prompts from the bank using seeded RNG.
 */
export function generateAutoPrompts(seed: number, count: number): string[] {
  const rng = createRNG(seed);
  const shuffled = rng.shuffle(DRAWING_PROMPTS);
  return shuffled.slice(0, count);
}

/**
 * Determine what each player works on in the current round.
 * Returns a map: playerName → { chainIndex, type, previousContent }
 */
export function getChainAssignment(
  players: string[],
  currentRound: number,
  roundData: RoundData
): Record<string, { chainIndex: number; type: "write" | "draw"; previousContent?: string }> {
  const n = players.length;
  const assignments: Record<string, { chainIndex: number; type: "write" | "draw"; previousContent?: string }> = {};

  for (let i = 0; i < n; i++) {
    const player = players[i];
    // Player i works on chain ((i + currentRound) % n)
    const chainIndex = (i + currentRound) % n;
    // Round 0 = write (initial prompt), then alternates: draw, write, draw, write...
    const type: "write" | "draw" = currentRound === 0 ? "write" : currentRound % 2 === 1 ? "draw" : "write";

    let previousContent: string | undefined;
    if (currentRound > 0 && roundData.chains[chainIndex]) {
      const entries = roundData.chains[chainIndex].entries;
      if (entries.length > 0) {
        previousContent = entries[entries.length - 1].content;
      }
    }

    assignments[player] = { chainIndex, type, previousContent };
  }

  return assignments;
}

/**
 * Get the round type for a given round number.
 */
export function getRoundType(round: number): "write" | "draw" {
  if (round === 0) return "write";
  return round % 2 === 1 ? "draw" : "write";
}

/**
 * Check if all players have submitted for the current round.
 */
export function isRoundComplete(
  roundData: RoundData,
  currentRound: number,
  players: string[]
): boolean {
  return players.every((p) => roundData.submissions[`${p}_${currentRound}`]);
}

/**
 * Build the final reveal chains in order.
 */
export function buildRevealChains(roundData: RoundData): Chain[] {
  return roundData.chains;
}

/**
 * Create initial round data structure.
 */
export function createRoundData(players: string[]): RoundData {
  return {
    chains: players.map((p) => ({
      startPlayer: p,
      entries: [],
    })),
    submissions: {},
  };
}

/**
 * Calculate total number of rounds based on player count and config.
 */
export function getTotalRounds(playerCount: number, configRoundCount?: number): number {
  if (configRoundCount && configRoundCount > 0) return configRoundCount;
  return playerCount;
}
