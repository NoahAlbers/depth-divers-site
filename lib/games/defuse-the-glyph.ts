import { createRNG } from "./seeded-random";

// ===== TYPES =====

export const NODE_COLORS = ["red", "blue", "green", "purple"] as const;
export type NodeState = (typeof NODE_COLORS)[number];

export interface PuzzleSymbol {
  icon: string;
  name: string;
}

export interface KeyEntry {
  symbol: PuzzleSymbol;
  color: NodeState;
  isDecoy: boolean;
}

export interface PuzzleData {
  nodeCount: number;
  solution: NodeState[];
  symbols: PuzzleSymbol[];
  keyEntries: KeyEntry[];
  validatorClues: string[];
  sequence: number[];
  observerHints: string[];
}

export interface PanelAssignment {
  playerName: string;
  panels: string[];
}

// ===== SYMBOLS =====

const ALL_SYMBOLS: PuzzleSymbol[] = [
  { icon: "☽", name: "Crescent" },
  { icon: "◆", name: "Diamond" },
  { icon: "✦", name: "Star" },
  { icon: "⬡", name: "Hexagon" },
  { icon: "∞", name: "Infinity" },
  { icon: "▲", name: "Triangle" },
  { icon: "◎", name: "Bullseye" },
  { icon: "⚡", name: "Lightning" },
  { icon: "♠", name: "Spade" },
  { icon: "⬢", name: "Gem" },
  { icon: "↺", name: "Spiral" },
  { icon: "☀", name: "Sun" },
];

export const COLOR_HEX: Record<NodeState, string> = {
  red: "#ef4444",
  blue: "#61afef",
  green: "#98c379",
  purple: "#c678dd",
};

// ===== TEMPLATES =====

interface PuzzleTemplate {
  difficulty: "easy" | "medium" | "hard";
  nodeCount: number;
  solution: NodeState[];
  decoyColors: NodeState[];
  validatorClues: string[];
  observerHints: string[];
}

const EASY_TEMPLATES: PuzzleTemplate[] = [
  {
    difficulty: "easy", nodeCount: 3,
    solution: ["blue", "red", "green"],
    decoyColors: ["purple"],
    validatorClues: ["The last entry in the Key is a decoy."],
    observerHints: ["One node must be blue. It is the first node."],
  },
  {
    difficulty: "easy", nodeCount: 3,
    solution: ["red", "purple", "blue"],
    decoyColors: ["green"],
    validatorClues: ["Any entry mapping to green is a decoy."],
    observerHints: ["The second node is not red or blue."],
  },
  {
    difficulty: "easy", nodeCount: 3,
    solution: ["green", "green", "red"],
    decoyColors: ["blue"],
    validatorClues: ["The entry for the Star symbol is wrong."],
    observerHints: ["Two nodes share the same color."],
  },
  {
    difficulty: "easy", nodeCount: 3,
    solution: ["purple", "blue", "red"],
    decoyColors: ["green"],
    validatorClues: ["Entry #2 in the Key is a decoy."],
    observerHints: ["The last node is a warm color."],
  },
  {
    difficulty: "easy", nodeCount: 3,
    solution: ["blue", "red", "purple"],
    decoyColors: ["red"],
    validatorClues: ["One color appears twice in the Key — one of them is fake."],
    observerHints: ["No node is green."],
  },
];

const MEDIUM_TEMPLATES: PuzzleTemplate[] = [
  {
    difficulty: "medium", nodeCount: 4,
    solution: ["red", "blue", "green", "purple"],
    decoyColors: ["red", "blue"],
    validatorClues: [
      "Entries with angular symbols (Triangle, Diamond) are all trustworthy.",
      "Exactly one mapping to a cool color (blue, green) is a decoy.",
    ],
    observerHints: ["One node must be purple. It is not the first or second node."],
  },
  {
    difficulty: "medium", nodeCount: 4,
    solution: ["green", "red", "red", "blue"],
    decoyColors: ["purple", "green"],
    validatorClues: [
      "The decoys are NOT next to each other in the Key list.",
      "No decoy maps to a color that appears in the solution more than once.",
    ],
    observerHints: ["The first node is not red."],
  },
  {
    difficulty: "medium", nodeCount: 5,
    solution: ["blue", "purple", "green", "red", "blue"],
    decoyColors: ["green", "purple"],
    validatorClues: [
      "Entries mapping to warm colors (red, purple) — exactly one is a decoy.",
      "The first entry in the Key is trustworthy.",
    ],
    observerHints: ["The second node is purple.", "The last node matches the first."],
  },
  {
    difficulty: "medium", nodeCount: 4,
    solution: ["purple", "green", "blue", "red"],
    decoyColors: ["red", "purple"],
    validatorClues: [
      "If a symbol name has 6 or more letters, its entry is real.",
      "Both decoys map to warm colors.",
    ],
    observerHints: ["Node 3 is a cool color."],
  },
  {
    difficulty: "medium", nodeCount: 5,
    solution: ["red", "blue", "purple", "green", "red"],
    decoyColors: ["blue", "green"],
    validatorClues: [
      "The entry right after a decoy in the Key is always real.",
      "No decoy symbol name starts with a vowel sound.",
    ],
    observerHints: ["The middle node is purple."],
  },
];

const HARD_TEMPLATES: PuzzleTemplate[] = [
  {
    difficulty: "hard", nodeCount: 5,
    solution: ["blue", "red", "green", "purple", "red"],
    decoyColors: ["blue", "green", "purple"],
    validatorClues: [
      "The symbol that looks like it could hold water is lying.",
      "Trust the symbols that are symmetrical. Question the rest.",
      "If you read the Key top to bottom, the first decoy appears before the second real entry.",
    ],
    observerHints: ["Node 2 is red.", "The last node is not blue."],
  },
  {
    difficulty: "hard", nodeCount: 6,
    solution: ["green", "purple", "blue", "red", "green", "blue"],
    decoyColors: ["red", "purple", "blue", "green"],
    validatorClues: [
      "Entries whose symbol has straight edges only — all real.",
      "The decoy that maps to green is surrounded by real entries in the list.",
      "Exactly two decoys map to cool colors.",
    ],
    observerHints: ["Nodes 1 and 5 share a color.", "Node 4 is red."],
  },
  {
    difficulty: "hard", nodeCount: 5,
    solution: ["purple", "blue", "red", "green", "purple"],
    decoyColors: ["red", "blue", "green"],
    validatorClues: [
      "The symbol associated with weather is unreliable.",
      "Among entries mapping to purple, at most one is real.",
      "The entry that shares no visual similarity with its neighbors is false.",
    ],
    observerHints: ["The first and last nodes match.", "Node 3 is a warm color."],
  },
  {
    difficulty: "hard", nodeCount: 6,
    solution: ["red", "green", "blue", "purple", "red", "green"],
    decoyColors: ["blue", "red", "purple", "green"],
    validatorClues: [
      "Symbols with curves are split: half real, half fake.",
      "The two decoys closest to each other in the list map to different color temperatures.",
      "Entry #1 is always trustworthy.",
    ],
    observerHints: ["No node is set to the same color as the node next to it.", "Node 6 is green."],
  },
  {
    difficulty: "hard", nodeCount: 5,
    solution: ["blue", "green", "purple", "red", "blue"],
    decoyColors: ["purple", "red", "green"],
    validatorClues: [
      "If a symbol could be a playing card suit, its entry is suspect.",
      "The decoy entries, read in order, spell out colors that alternate warm and cool.",
      "Trust any entry whose symbol name has exactly 4 letters.",
    ],
    observerHints: ["The first node is blue.", "Node 4 is not purple."],
  },
];

// ===== PUZZLE GENERATION =====

export function generatePuzzle(
  seed: number,
  difficulty: "easy" | "medium" | "hard"
): PuzzleData {
  const rng = createRNG(seed);

  const templates = difficulty === "easy" ? EASY_TEMPLATES
    : difficulty === "medium" ? MEDIUM_TEMPLATES
    : HARD_TEMPLATES;

  const template = templates[Math.abs(seed) % templates.length];

  // Pick symbols (shuffled from pool)
  const shuffledSymbols = rng.shuffle([...ALL_SYMBOLS]);
  const nodeSymbols = shuffledSymbols.slice(0, template.nodeCount);
  const decoySymbols = shuffledSymbols.slice(template.nodeCount, template.nodeCount + template.decoyColors.length);

  // Build key entries
  const keyEntries: KeyEntry[] = [];

  // Real entries
  for (let i = 0; i < template.nodeCount; i++) {
    keyEntries.push({
      symbol: nodeSymbols[i],
      color: template.solution[i],
      isDecoy: false,
    });
  }

  // Decoy entries
  for (let i = 0; i < template.decoyColors.length; i++) {
    keyEntries.push({
      symbol: decoySymbols[i] || { icon: "?", name: `Unknown${i}` },
      color: template.decoyColors[i],
      isDecoy: true,
    });
  }

  // Shuffle key entries
  const shuffledEntries = rng.shuffle(keyEntries);

  // Generate sequence
  const sequence = rng.shuffle(Array.from({ length: template.nodeCount }, (_, i) => i));

  // Update validator clues with actual symbol names
  const validatorClues = template.validatorClues.map((clue) => {
    // Replace "Star" references with actual assigned symbol names if needed
    return clue;
  });

  return {
    nodeCount: template.nodeCount,
    solution: template.solution,
    symbols: nodeSymbols,
    keyEntries: shuffledEntries,
    validatorClues,
    sequence,
    observerHints: template.observerHints,
  };
}

// ===== PANEL ASSIGNMENT =====

export function assignPanels(
  players: string[],
  seed: number,
  configOperator?: string
): PanelAssignment[] {
  const rng = createRNG(seed + 777);
  const count = players.length;

  // Determine operator
  let operatorIdx = 0;
  if (configOperator && configOperator !== "random") {
    const idx = players.indexOf(configOperator);
    if (idx >= 0) operatorIdx = idx;
  } else {
    operatorIdx = rng.nextInt(0, count - 1);
  }

  const assignments: PanelAssignment[] = players.map((p) => ({
    playerName: p,
    panels: [],
  }));

  // Assign operator
  assignments[operatorIdx].panels.push("operator");

  // Get non-operator players in order
  const others: number[] = [];
  for (let i = 0; i < count; i++) {
    if (i !== operatorIdx) others.push(i);
  }

  if (count === 1) {
    // Solo: one player gets everything
    assignments[0].panels = ["operator", "key", "validator", "sequencer"];
  } else if (count === 2) {
    assignments[operatorIdx].panels.push("sequencer");
    assignments[others[0]].panels.push("key", "validator");
  } else if (count === 3) {
    assignments[others[0]].panels.push("key");
    assignments[others[1]].panels.push("validator", "sequencer");
  } else if (count === 4) {
    assignments[others[0]].panels.push("key");
    assignments[others[1]].panels.push("validator");
    assignments[others[2]].panels.push("sequencer");
  } else if (count === 5) {
    assignments[others[0]].panels.push("key");
    assignments[others[1]].panels.push("validator");
    assignments[others[2]].panels.push("sequencer");
    assignments[others[3]].panels.push("observer");
  } else {
    // 6+
    assignments[others[0]].panels.push("key");
    assignments[others[1]].panels.push("validator");
    assignments[others[2]].panels.push("sequencer");
    for (let i = 3; i < others.length; i++) {
      assignments[others[i]].panels.push("observer");
    }
  }

  return assignments;
}

// ===== SOLUTION CHECKING =====

export function checkSolution(
  playerStates: NodeState[],
  puzzle: PuzzleData
): { colorsCorrect: boolean; wrongNodes: number[] } {
  const wrongNodes: number[] = [];
  for (let i = 0; i < puzzle.solution.length; i++) {
    if (playerStates[i] !== puzzle.solution[i]) {
      wrongNodes.push(i);
    }
  }
  return { colorsCorrect: wrongNodes.length === 0, wrongNodes };
}

export function checkSequence(
  setOrder: number[],
  puzzle: PuzzleData,
  difficulty: "easy" | "medium" | "hard"
): boolean {
  if (difficulty === "easy") return true; // No sequence on easy

  if (difficulty === "medium") {
    // Only last 2 must be in order
    const seq = puzzle.sequence;
    const lastTwo = seq.slice(-2);
    const playerLastTwo = setOrder.slice(-2);
    return lastTwo[0] === playerLastTwo[0] && lastTwo[1] === playerLastTwo[1];
  }

  // Hard: full sequence
  if (setOrder.length !== puzzle.sequence.length) return false;
  return setOrder.every((idx, i) => idx === puzzle.sequence[i]);
}

// ===== TIMER =====

export function getTimerDuration(
  difficulty: "easy" | "medium" | "hard",
  configTimer?: number
): number {
  if (configTimer && configTimer > 0) return configTimer;
  return difficulty === "easy" ? 300 : difficulty === "medium" ? 180 : 120;
}

// ===== PANEL LABELS =====

export const PANEL_INFO: Record<string, { name: string; description: string }> = {
  operator: {
    name: "OPERATOR",
    description: "You control the nodes. Set each to the correct color, then hit DEFUSE. You can't see the Key, clues, or sequence — rely on your team!",
  },
  key: {
    name: "KEY READER",
    description: "You see symbol-to-color mappings. Some are DECOYS! Read them to your team. You don't know which are real.",
  },
  validator: {
    name: "VALIDATOR",
    description: "You have clues about which Key entries are decoys. Interpret them and tell your team which mappings to trust.",
  },
  sequencer: {
    name: "SEQUENCER",
    description: "You see the activation order — which nodes must be set FIRST, SECOND, etc. Tell the Operator the order using symbol names.",
  },
  observer: {
    name: "OBSERVER",
    description: "You know partial solution info. Share it to help the team verify their work.",
  },
};
