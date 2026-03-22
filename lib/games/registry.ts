export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  defaultTimeLimit: number;
  difficulties: ("easy" | "medium" | "hard")[];
  category: "puzzle" | "reflex" | "memory" | "race" | "cooperative" | "rhythm" | "timing";
  defaultSkill?: string; // D&D skill name, or null for raw ability
}

export const GAMES: GameDefinition[] = [
  {
    id: "arcane-conduit",
    name: "Arcane Conduit",
    description:
      "Rotate pipe segments to connect the flow of arcane energy from a source crystal to a target rune.",
    icon: "🔮",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "puzzle",
  },
  {
    id: "rune-echoes",
    name: "Rune Echoes",
    description:
      "Glowing Underdark runes flash in sequence. Repeat the sequence from memory. Each round adds one more.",
    icon: "✨",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "memory",
  },
  {
    id: "glyph-race",
    name: "Glyph Race",
    description:
      "Solve magical puzzles as fast as you can — anagrams, ciphers, and pattern matching. Race against time!",
    icon: "📜",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 60,
    difficulties: ["easy", "medium", "hard"],
    category: "race",
  },
  {
    id: "stalactite-storm",
    name: "Stalactite Storm",
    description:
      "Dodge falling stalactites, faerzress bolts, and cave debris in a collapsing cavern. Survive as long as you can!",
    icon: "⛰️",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "reflex",
    defaultSkill: "Acrobatics",
  },
  {
    id: "spider-swat",
    name: "Spider Swat",
    description:
      "A swarm of cave spiders drops from the ceiling! Swat them before they scatter! Don't hit the mushrooms!",
    icon: "🕷️",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 20,
    difficulties: ["easy", "medium", "hard"],
    category: "reflex",
    defaultSkill: "Perception",
  },
  {
    id: "lockpicking",
    name: "Lockpicking",
    description:
      "Navigate a lockpick through the internal mechanism of a lock without touching the walls. Don't break the pick!",
    icon: "🔐",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "puzzle",
    defaultSkill: "Sleight of Hand",
  },
  {
    id: "drinking-contest",
    name: "Drinking Contest",
    description:
      "Match the rhythm to keep drinking! The bar gets blurrier and the mug gets faster. Last one standing wins!",
    icon: "🍺",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "rhythm",
    defaultSkill: undefined, // Uses raw CON
  },
  {
    id: "stealth-sequence",
    name: "Stealth Sequence",
    description:
      "Sneak past patrolling guards in a drow outpost. Move between beats, avoid vision cones. Get caught and the infiltration fails.",
    icon: "🥷",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "timing",
    defaultSkill: "Stealth",
  },
  {
    id: "defuse-the-glyph",
    name: "Defuse the Glyph",
    description:
      "A magical trap is active! Each player sees a different piece of the puzzle. Communicate verbally to disarm it before time runs out!",
    icon: "💎",
    minPlayers: 2,
    maxPlayers: 6,
    defaultTimeLimit: 180,
    difficulties: ["easy", "medium", "hard"],
    category: "cooperative",
    defaultSkill: "Arcana",
  },
];

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
