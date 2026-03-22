export interface GameConfigOption {
  key: string;
  label: string;
  type: "number" | "select";
  default: number | string;
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
}

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  defaultTimeLimit: number;
  difficulties: ("easy" | "medium" | "hard")[];
  category:
    | "puzzle"
    | "reflex"
    | "memory"
    | "race"
    | "cooperative"
    | "rhythm"
    | "timing"
    | "party";
  defaultSkill?: string;
  estimatedTime: string;
  skillDisplay?: string;
  howToPlay: string[];
  difficultyDescriptions: { easy: string; medium: string; hard: string };
  configOptions?: GameConfigOption[];
}

export const GAMES: GameDefinition[] = [
  {
    id: "arcane-conduit",
    name: "Arcane Conduit",
    description:
      "Place random pipe pieces on the grid before the flowing arcane energy reaches a dead end. Build fast, build smart!",
    icon: "🔮",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "puzzle",
    estimatedTime: "~2-5 min",
    skillDisplay: "INT / Arcana",
    howToPlay: [
      "Pipe pieces appear in a queue — tap a cell to place the next piece",
      "Arcane energy starts flowing after a delay — build ahead of it!",
      "If the flow reaches an open end, the run is over",
      "Score 1 point per segment the flow passes through",
      "Replace unused pipes (small penalty) to fix your path",
    ],
    difficultyDescriptions: {
      easy: "7x7 grid, 8s delay, slow flow — relaxed pace",
      medium: "9x9 grid, 5s delay, faster flow, blocked cells",
      hard: "10x10 grid, 3s delay, fast flow, blocked cells + reservoir + end crystal",
    },
    configOptions: [
      {
        key: "rounds",
        label: "Rounds",
        type: "select",
        default: 1,
        options: [
          { value: 1, label: "1 round" },
          { value: 3, label: "3 rounds" },
          { value: 5, label: "5 rounds" },
        ],
      },
      {
        key: "timeLimit",
        label: "Time Limit",
        type: "select",
        default: 0,
        options: [
          { value: 0, label: "None (play until overflow)" },
          { value: 60, label: "60 seconds" },
          { value: 120, label: "120 seconds" },
          { value: 180, label: "180 seconds" },
        ],
      },
    ],
  },
  {
    id: "rune-echoes",
    name: "Rune Echoes",
    description:
      "Runes flash in sequence — memorize and repeat. Each round adds one more. How far can you go?",
    icon: "🔔",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "memory",
    estimatedTime: "~2-4 min",
    skillDisplay: "INT / History",
    howToPlay: [
      "Watch the runes flash in sequence",
      "Repeat the sequence by tapping the runes in order",
      "Each round adds one more rune to the sequence",
      "Longest streak wins",
    ],
    difficultyDescriptions: {
      easy: "Slower flash speed, fewer runes",
      medium: "Standard speed and rune count",
      hard: "Fast flashes, more runes to track",
    },
    configOptions: [
      {
        key: "startingLength",
        label: "Starting Sequence Length",
        type: "select",
        default: 3,
        options: [
          { value: 3, label: "3 (standard)" },
          { value: 4, label: "4 (longer)" },
          { value: 5, label: "5 (challenging)" },
        ],
      },
      {
        key: "flashSpeed",
        label: "Flash Speed",
        type: "select",
        default: "normal",
        options: [
          { value: "slow", label: "Slow" },
          { value: "normal", label: "Normal" },
          { value: "fast", label: "Fast" },
        ],
      },
    ],
  },
  {
    id: "glyph-race",
    name: "Glyph Race",
    description:
      "Solve a series of quick puzzles — math ciphers, patterns, and visual challenges. Fastest total time wins.",
    icon: "⚡",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 60,
    difficulties: ["easy", "medium", "hard"],
    category: "race",
    estimatedTime: "~2-3 min",
    skillDisplay: "INT / Investigation",
    howToPlay: [
      "Solve each puzzle as quickly as you can",
      "Puzzles include anagrams, ciphers, and pattern matching",
      "Your total time across all puzzles is your score",
      "Fastest total time wins",
    ],
    difficultyDescriptions: {
      easy: "Simpler puzzles, fewer to solve",
      medium: "Standard puzzle complexity",
      hard: "Complex puzzles, more to solve",
    },
    configOptions: [
      {
        key: "puzzleCount",
        label: "Number of Puzzles",
        type: "select",
        default: 5,
        options: [
          { value: 3, label: "3 (Quick)" },
          { value: 5, label: "5 (Standard)" },
          { value: 7, label: "7 (Marathon)" },
        ],
      },
    ],
  },
  {
    id: "stalactite-storm",
    name: "Stalactite Storm",
    description:
      "Dodge falling stalactites and cave debris. Move left and right to survive. Longest survival time wins.",
    icon: "🪨",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "reflex",
    defaultSkill: "Acrobatics",
    estimatedTime: "~1-3 min",
    skillDisplay: "DEX / Acrobatics",
    howToPlay: [
      "Move left and right to dodge falling stalactites",
      "Avoid faerzress bolts and cave debris",
      "Survive as long as you can",
      "Longest survival time wins",
    ],
    difficultyDescriptions: {
      easy: "Slower falling speed, wider gaps",
      medium: "Standard speed and density",
      hard: "Fast, dense debris — react quickly!",
    },
    configOptions: [
      {
        key: "startingSpeed",
        label: "Starting Speed",
        type: "select",
        default: "normal",
        options: [
          { value: "slow", label: "Slow" },
          { value: "normal", label: "Normal" },
          { value: "fast", label: "Fast" },
        ],
      },
    ],
  },
  {
    id: "spider-swat",
    name: "Spider Swat",
    description:
      "Spiders are swarming! Tap to squash them before they vanish. Don't hit the friendly mushroom. Highest score wins.",
    icon: "🕷️",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 20,
    difficulties: ["easy", "medium", "hard"],
    category: "reflex",
    defaultSkill: "Perception",
    estimatedTime: "~20 sec",
    skillDisplay: "WIS / Perception",
    howToPlay: [
      "Tap/click spiders to squash them before they disappear",
      "Don't hit the friendly mushrooms — they cost points",
      "Faster squashes earn more points",
      "Highest score when time runs out wins",
    ],
    difficultyDescriptions: {
      easy: "Slower spiders, longer visibility",
      medium: "Standard speed and spawn rate",
      hard: "Fast spiders, more mushroom traps",
    },
    configOptions: [
      {
        key: "gameDuration",
        label: "Game Duration",
        type: "select",
        default: 20,
        options: [
          { value: 15, label: "15 seconds" },
          { value: 20, label: "20 seconds" },
          { value: 30, label: "30 seconds" },
        ],
      },
      {
        key: "penaltyMushrooms",
        label: "Penalty Mushrooms",
        type: "select",
        default: "yes",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
  {
    id: "lockpicking",
    name: "Lockpicking",
    description:
      "Guide your lockpick through the mechanism without touching the walls. Three strikes and the pick breaks.",
    icon: "🔐",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "puzzle",
    defaultSkill: "Sleight of Hand",
    estimatedTime: "~1-3 min",
    skillDisplay: "DEX / Sleight of Hand",
    howToPlay: [
      "Guide your lockpick through the lock mechanism",
      "Don't touch the walls — each collision is a strike",
      "Three strikes and the pick breaks",
      "Fastest completion time wins",
    ],
    difficultyDescriptions: {
      easy: "Wide corridors, simple path",
      medium: "Tighter corridors with turns",
      hard: "Narrow passages, complex maze",
    },
    configOptions: [
      {
        key: "timer",
        label: "Timer",
        type: "select",
        default: 0,
        options: [
          { value: 0, label: "None" },
          { value: 30, label: "30 seconds" },
          { value: 60, label: "60 seconds" },
          { value: 90, label: "90 seconds" },
        ],
      },
      {
        key: "movingPins",
        label: "Moving Pins",
        type: "select",
        default: "no",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
    ],
  },
  {
    id: "stealth-sequence",
    name: "Stealth Sequence",
    description:
      "Sneak past patrolling guards in a drow outpost. Move between their vision cones. One wrong step and you're caught.",
    icon: "🥷",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "timing",
    defaultSkill: "Stealth",
    estimatedTime: "~2-4 min",
    skillDisplay: "DEX / Stealth",
    howToPlay: [
      "Move between beats by tapping adjacent cells or using WASD",
      "Avoid guard vision cones (red/purple triangles)",
      "Use cover tiles to hide from vision cones",
      "Reach the exit in as few beats as possible",
      "Getting caught ends your run",
    ],
    difficultyDescriptions: {
      easy: "7x7 grid, 2 guards, 1.5s beats — generous safe zones",
      medium: "9x9 grid, 4 guards, 1.2s beats — requires timing",
      hard: "11x11 grid, 7 guards, 1.0s beats — precise timing required",
    },
    configOptions: [
      {
        key: "gridSizeOverride",
        label: "Grid Size",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Auto (by difficulty)" },
          { value: 7, label: "7x7" },
          { value: 9, label: "9x9" },
          { value: 11, label: "11x11" },
        ],
      },
      {
        key: "guardCountOverride",
        label: "Extra Guards",
        type: "select",
        default: "auto",
        options: [
          { value: "auto", label: "Auto (by difficulty)" },
          { value: 1, label: "+1 guard" },
          { value: 2, label: "+2 guards" },
        ],
      },
    ],
  },
  {
    id: "drinking-contest",
    name: "Drinking Contest",
    description:
      "Match the rhythm to keep drinking. The sweet spot shrinks, the screen blurs, and your vision doubles. Last one standing wins.",
    icon: "🍺",
    minPlayers: 1,
    maxPlayers: 6,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "rhythm",
    defaultSkill: undefined,
    estimatedTime: "~2-5 min",
    skillDisplay: "CON (raw score)",
    howToPlay: [
      "Tap/press when the marker is in the sweet spot",
      "Each successful round fills your mug",
      "The sweet spot shrinks and speed increases each round",
      "Don't tap during burp rounds!",
      "Last player standing wins",
    ],
    difficultyDescriptions: {
      easy: "Wide sweet spot, slow start",
      medium: "Standard sweet spot and speed",
      hard: "Narrow sweet spot, fast from the start",
    },
    configOptions: [
      {
        key: "startingRound",
        label: "Starting Round",
        type: "select",
        default: 1,
        options: [
          { value: 1, label: "Round 1 (start easy)" },
          { value: 5, label: "Round 5 (skip easy rounds)" },
          { value: 10, label: "Round 10 (experienced drinkers)" },
        ],
      },
    ],
  },
  {
    id: "defuse-the-glyph",
    name: "Defuse the Glyph",
    description:
      "Each player sees a different piece of a magical trap. Communicate verbally to solve it together. Nobody can show their screen.",
    icon: "💣",
    minPlayers: 2,
    maxPlayers: 6,
    defaultTimeLimit: 180,
    difficulties: ["easy", "medium", "hard"],
    category: "cooperative",
    defaultSkill: "Arcana",
    estimatedTime: "~3-8 min",
    skillDisplay: "INT / Arcana",
    howToPlay: [
      "Each player sees a different piece of the magical trap",
      "Communicate verbally — no showing your screen!",
      "Work together to solve the puzzle before time runs out",
      "All players succeed or fail together",
    ],
    difficultyDescriptions: {
      easy: "Simpler symbols, longer timer",
      medium: "Standard complexity and timer",
      hard: "Complex symbols, tight timer",
    },
    configOptions: [
      {
        key: "timerDuration",
        label: "Timer (seconds)",
        type: "number",
        default: 180,
        min: 60,
        max: 600,
      },
      {
        key: "nodeCount",
        label: "Number of Nodes",
        type: "select",
        default: 4,
        options: [
          { value: 3, label: "3 (easier)" },
          { value: 4, label: "4 (standard)" },
          { value: 5, label: "5 (harder)" },
          { value: 6, label: "6 (very hard)" },
        ],
      },
    ],
  },
  {
    id: "underdark-telephone",
    name: "Underdark Telephone",
    description:
      "A game of telephone with drawings. Write, draw, guess, draw, guess — watch your message mutate into chaos.",
    icon: "🎨",
    minPlayers: 4,
    maxPlayers: 7,
    defaultTimeLimit: 0,
    difficulties: ["easy", "medium", "hard"],
    category: "party",
    estimatedTime: "~10-20 min",
    skillDisplay: "None (pure fun)",
    howToPlay: [
      "Each player writes a secret prompt to start their chain",
      "Prompts rotate — draw what you read, describe what you see",
      "Rounds alternate between writing and drawing",
      "After all rounds, chains are revealed from start to finish",
      "Laugh at how distorted the messages got!",
    ],
    difficultyDescriptions: {
      easy: "More time per round, relaxed pace",
      medium: "Standard timing for each phase",
      hard: "Less time per round — think fast!",
    },
    configOptions: [
      {
        key: "promptMode",
        label: "Prompt Mode",
        type: "select",
        default: "player",
        options: [
          { value: "player", label: "Players write prompts" },
          { value: "auto", label: "Auto-generated" },
          { value: "dm", label: "DM provides prompts" },
        ],
      },
      {
        key: "drawTime",
        label: "Drawing Time",
        type: "select",
        default: 60,
        options: [
          { value: 30, label: "30 seconds" },
          { value: 45, label: "45 seconds" },
          { value: 60, label: "60 seconds" },
          { value: 90, label: "90 seconds" },
        ],
      },
      {
        key: "writeTime",
        label: "Writing Time",
        type: "select",
        default: 30,
        options: [
          { value: 15, label: "15 seconds" },
          { value: 20, label: "20 seconds" },
          { value: 30, label: "30 seconds" },
          { value: 45, label: "45 seconds" },
        ],
      },
      {
        key: "roundCount",
        label: "Rounds",
        type: "select",
        default: 0,
        options: [
          { value: 0, label: "Auto (one per player)" },
          { value: 3, label: "3 rounds" },
          { value: 4, label: "4 rounds" },
          { value: 5, label: "5 rounds" },
          { value: 6, label: "6 rounds" },
          { value: 7, label: "7 rounds" },
        ],
      },
    ],
  },
];

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.id === id);
}
