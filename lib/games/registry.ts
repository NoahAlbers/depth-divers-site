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
];

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
