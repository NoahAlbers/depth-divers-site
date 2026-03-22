import { createRNG } from "./seeded-random";

// ===== TYPES =====

export type Difficulty = "easy" | "medium" | "hard";
export type InputMode = "text" | "choice" | "tap" | "sequence" | "sort" | "grid-tap" | "direction";
export type PuzzleCategory = "math" | "visual" | "reaction" | "word";

export interface Puzzle {
  type: string;
  category: PuzzleCategory;
  prompt: string;
  answer: string;
  options?: string[];
  hint?: string;
  inputMode: InputMode;
  visualData?: {
    grid?: string[][];
    grid2?: string[][];
    shapes?: { shape: string; color: string; label?: string }[];
    sequence?: string[];
    items?: string[];
    targetX?: number;
    targetY?: number;
    targetSize?: number;
    arrow?: string;
    trickText?: string;
    flashDuration?: number;
    targetColor?: string;
    correctIndex?: number;
    diffRow?: number;
    diffCol?: number;
  };
}

// ===== CATEGORY → TYPE MAPPING =====

const CATEGORY_TYPES: Record<string, string[]> = {
  math: ["quick-math", "rune-cipher", "number-sequence"],
  visual: ["pattern-match", "odd-one-out", "mirror-match", "color-count"],
  reaction: ["tap-target", "sequence-repeat", "sort-order"],
  word: ["missing-letter", "spot-difference", "direction-match"],
};

const CATEGORY_ICONS: Record<string, string> = {
  math: "🔢", visual: "👁", reaction: "⚡", word: "📝",
};

// ===== CONSTANTS =====

const SYMBOLS = ["☽", "◆", "★", "◇", "△", "○"];
const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316"];
const COLOR_NAMES = ["red", "blue", "green", "yellow", "purple", "orange"];
const SHAPES = ["circle", "square", "triangle", "diamond"];
const DIRECTIONS = ["up", "right", "down", "left"];
const DIRECTION_ARROWS = ["↑", "→", "↓", "←"];
const SEQUENCE_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"];

const EASY_WORDS = [
  "CAT", "DOG", "SUN", "RUN", "HAT", "BIG", "RED", "MAP", "CUP", "BED",
  "TOP", "HOT", "FUN", "PEN", "BOX", "HIT", "JAM", "LOG", "MOP", "NUT",
];
const MEDIUM_WORDS = [
  "BRIDGE", "CASTLE", "DRAGON", "FOREST", "KNIGHT", "SHIELD", "THRONE",
  "WEAPON", "BATTLE", "SHADOW", "POTION", "SCROLL", "TEMPLE", "HUNTER",
];
const HARD_WORDS = [
  "CRYSTAL", "DUNGEON", "MONSTER", "ANCIENT", "PHANTOM", "WHISPER",
  "ALCHEMY", "SORCERY", "ENCHANT", "LANTERN", "CHALICE", "MYSTERY",
];

// ===== PUZZLE GENERATORS =====

// --- MATH & LOGIC ---

function generateQuickMath(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  let a: number, b: number, op: string, answer: number;

  if (difficulty === "easy") {
    a = rng.nextInt(2, 20);
    b = rng.nextInt(2, 20);
    op = rng.pick(["+", "-"]);
    answer = op === "+" ? a + b : a - b;
  } else if (difficulty === "medium") {
    op = rng.pick(["+", "-", "×"]);
    if (op === "×") { a = rng.nextInt(2, 12); b = rng.nextInt(2, 12); answer = a * b; }
    else { a = rng.nextInt(10, 50); b = rng.nextInt(10, 50); answer = op === "+" ? a + b : a - b; }
  } else {
    const ops = ["+", "-", "×"];
    const op1 = rng.pick(ops);
    const op2 = rng.pick(ops);
    a = rng.nextInt(5, 20);
    b = rng.nextInt(2, 10);
    const c = rng.nextInt(2, 10);
    let result = a;
    if (op1 === "+") result += b; else if (op1 === "-") result -= b; else result *= b;
    if (op2 === "+") result += c; else if (op2 === "-") result -= c; else result *= c;
    return {
      type: "quick-math", category: "math", inputMode: "text",
      prompt: `${a} ${op1} ${b} ${op2} ${c} = ?`,
      answer: String(result), hint: "Calculate the result",
    };
  }

  return {
    type: "quick-math", category: "math", inputMode: "text",
    prompt: `${a} ${op} ${b} = ?`,
    answer: String(answer), hint: "Calculate the result",
  };
}

function generateRuneCipher(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const symA = rng.pick(SYMBOLS);
  const symB = rng.pick(SYMBOLS.filter((s) => s !== symA));

  if (difficulty === "hard") {
    const a = rng.nextInt(2, 8);
    const b = rng.nextInt(2, 8);
    const product = a * b;
    const sum = a + b;
    return {
      type: "rune-cipher", category: "math", inputMode: "text",
      prompt: `${symA} × ${symB} = ${product}\n${symA} + ${symB} = ${sum}\n${symA} = ?`,
      answer: String(Math.min(a, b)),
      hint: "Solve the system",
    };
  }

  if (difficulty === "medium") {
    const a = rng.nextInt(2, 12);
    const b = rng.nextInt(2, 12);
    return {
      type: "rune-cipher", category: "math", inputMode: "text",
      prompt: `${symA} + ${symB} = ${a + b}\n${symA} = ${a}\n${symB} = ?`,
      answer: String(b), hint: "Solve for the unknown",
    };
  }

  const a = rng.nextInt(1, 10);
  const b = rng.nextInt(1, 10);
  return {
    type: "rune-cipher", category: "math", inputMode: "text",
    prompt: `${symA} = ${a}, ${symB} = ${b}\n${symA} + ${symB} = ?`,
    answer: String(a + b), hint: "Add the values",
  };
}

function generateNumberSequence(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  let sequence: number[];
  let answer: number;

  const patternType = rng.nextInt(0, difficulty === "easy" ? 1 : 2);

  if (patternType === 0) {
    const start = rng.nextInt(1, 20);
    const step = difficulty === "easy" ? rng.nextInt(2, 5) : rng.nextInt(3, 12);
    sequence = Array.from({ length: 4 }, (_, i) => start + step * i);
    answer = start + step * 4;
  } else if (patternType === 1) {
    const start = rng.nextInt(1, 5);
    const mult = rng.nextInt(2, difficulty === "easy" ? 3 : 4);
    sequence = [start];
    for (let i = 1; i < 4; i++) sequence.push(sequence[i - 1] * mult);
    answer = sequence[3] * mult;
  } else {
    // Fibonacci-like
    const a = rng.nextInt(1, 5);
    const b = rng.nextInt(1, 5);
    sequence = [a, b];
    for (let i = 2; i < 5; i++) sequence.push(sequence[i - 1] + sequence[i - 2]);
    answer = sequence[4] + sequence[3];
    sequence = sequence.slice(0, 5);
  }

  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const w = answer + rng.nextInt(-8, 8);
    if (w !== answer && w > 0) wrong.add(w);
  }
  const options = rng.shuffle([answer, ...wrong]).map(String);

  return {
    type: "number-sequence", category: "math", inputMode: "choice",
    prompt: sequence.join(", ") + ", ?",
    answer: String(answer), options, hint: "What comes next?",
  };
}

// --- VISUAL PATTERN ---

function generatePatternMatch(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const size = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 3;
  const numColors = difficulty === "easy" ? 2 : 3;
  const usedColors = COLORS.slice(0, numColors);

  // Generate a grid with a simple pattern (alternating colors)
  const grid: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) {
      row.push(usedColors[(r + c) % numColors]);
    }
    grid.push(row);
  }

  // Remove one cell — that's the answer
  const missingR = rng.nextInt(0, size - 1);
  const missingC = rng.nextInt(0, size - 1);
  const correctColor = grid[missingR][missingC];
  grid[missingR][missingC] = "missing";

  // Generate options
  const wrongColors = usedColors.filter((c) => c !== correctColor);
  while (wrongColors.length < 3) wrongColors.push(rng.pick(COLORS));
  const options = rng.shuffle([correctColor, ...wrongColors.slice(0, 3)]);

  return {
    type: "pattern-match", category: "visual", inputMode: "choice",
    prompt: "Which color fills the gap?",
    answer: correctColor,
    options,
    visualData: { grid },
  };
}

function generateOddOneOut(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const count = difficulty === "easy" ? 5 : 6;
  const mainShape = rng.pick(SHAPES);
  const mainColor = rng.pick(COLORS);
  const oddIndex = rng.nextInt(0, count - 1);

  const shapes: { shape: string; color: string; label?: string }[] = [];
  for (let i = 0; i < count; i++) {
    if (i === oddIndex) {
      if (difficulty === "easy") {
        // Different shape
        const oddShape = rng.pick(SHAPES.filter((s) => s !== mainShape));
        shapes.push({ shape: oddShape, color: mainColor });
      } else {
        // Different color (subtle)
        const oddColor = rng.pick(COLORS.filter((c) => c !== mainColor));
        shapes.push({ shape: mainShape, color: oddColor });
      }
    } else {
      shapes.push({ shape: mainShape, color: mainColor });
    }
  }

  return {
    type: "odd-one-out", category: "visual", inputMode: "tap",
    prompt: "Tap the odd one out!",
    answer: String(oddIndex),
    visualData: { shapes, correctIndex: oddIndex },
  };
}

function generateMirrorMatch(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  // Generate a simple arrow direction and find its mirror
  const dirs = ["↗", "↘", "↙", "↖"];
  const mirrors: Record<string, string> = { "↗": "↖", "↘": "↙", "↙": "↘", "↖": "↗" };
  const original = rng.pick(dirs);
  const correct = mirrors[original];

  const wrongOptions = dirs.filter((d) => d !== correct);
  const options = rng.shuffle([correct, ...wrongOptions.slice(0, 3)]);

  return {
    type: "mirror-match", category: "visual", inputMode: "choice",
    prompt: `Mirror of ${original} ?`,
    answer: correct,
    options,
    hint: "Pick the horizontal mirror image",
  };
}

function generateColorCount(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const size = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  const numColors = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
  const usedColors = COLORS.slice(0, numColors);
  const usedNames = COLOR_NAMES.slice(0, numColors);

  const grid: string[][] = [];
  const counts: Record<string, number> = {};
  usedColors.forEach((c) => (counts[c] = 0));

  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) {
      const color = rng.pick(usedColors);
      row.push(color);
      counts[color]++;
    }
    grid.push(row);
  }

  // Pick a color to ask about
  const askColorIdx = rng.nextInt(0, numColors - 1);
  const askColor = usedColors[askColorIdx];
  const askName = usedNames[askColorIdx];
  const answer = counts[askColor];

  const flashDuration = difficulty === "hard" ? 1500 : difficulty === "medium" ? 2500 : 3000;

  return {
    type: "color-count", category: "visual", inputMode: "text",
    prompt: `How many ${askName.toUpperCase()} dots?`,
    answer: String(answer),
    hint: "Count carefully!",
    visualData: { grid, flashDuration, targetColor: askColor },
  };
}

// --- REACTION & SPEED ---

function generateTapTarget(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const targetX = rng.nextInt(15, 85);
  const targetY = rng.nextInt(15, 85);
  const targetSize = difficulty === "easy" ? 20 : difficulty === "medium" ? 14 : 10;

  return {
    type: "tap-target", category: "reaction", inputMode: "tap",
    prompt: "Tap the target!",
    answer: "hit",
    visualData: { targetX, targetY, targetSize },
  };
}

function generateSequenceRepeat(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const len = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  const numButtons = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  const colors = SEQUENCE_COLORS.slice(0, numButtons);

  const sequence: string[] = [];
  for (let i = 0; i < len; i++) {
    sequence.push(colors[rng.nextInt(0, numButtons - 1)]);
  }

  return {
    type: "sequence-repeat", category: "reaction", inputMode: "sequence",
    prompt: "Watch, then repeat!",
    answer: sequence.join(","),
    visualData: { sequence },
  };
}

function generateSortOrder(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const len = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  const useLetters = difficulty === "hard" && rng.next() > 0.5;

  let items: string[];
  if (useLetters) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const start = rng.nextInt(0, 20);
    items = letters.slice(start, start + len);
  } else {
    const nums = new Set<number>();
    while (nums.size < len) {
      nums.add(rng.nextInt(difficulty === "easy" ? 1 : 10, difficulty === "easy" ? 9 : 99));
    }
    items = [...nums].sort((a, b) => a - b).map(String);
  }

  const sorted = [...items];
  const scrambled = rng.shuffle(items);

  return {
    type: "sort-order", category: "reaction", inputMode: "sort",
    prompt: useLetters ? "Tap in alphabetical order!" : "Tap smallest to largest!",
    answer: sorted.join(","),
    hint: useLetters ? "Tap in order: A → Z" : "Tap in order: smallest → largest",
    visualData: { items: scrambled },
  };
}

// --- WORD & SPATIAL ---

function generateMissingLetter(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const bank = difficulty === "easy" ? EASY_WORDS : difficulty === "medium" ? MEDIUM_WORDS : HARD_WORDS;
  const word = rng.pick(bank);

  let numMissing: number;
  if (difficulty === "easy") numMissing = 1;
  else if (difficulty === "medium") numMissing = rng.pick([1, 2]);
  else numMissing = 2;

  const indices = rng.shuffle(Array.from({ length: word.length }, (_, i) => i)).slice(0, numMissing);
  indices.sort((a, b) => a - b);

  let display = "";
  let answer = "";
  for (let i = 0; i < word.length; i++) {
    if (indices.includes(i)) {
      display += "_";
      answer += word[i];
    } else {
      display += word[i];
    }
  }

  return {
    type: "missing-letter", category: "word", inputMode: "text",
    prompt: display,
    answer,
    hint: `Type the missing letter${numMissing > 1 ? "s" : ""}`,
  };
}

function generateSpotDifference(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const size = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  const numColors = 3;
  const usedColors = COLORS.slice(0, numColors);

  const grid1: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) {
      row.push(rng.pick(usedColors));
    }
    grid1.push(row);
  }

  // Copy and change one cell
  const grid2 = grid1.map((row) => [...row]);
  const diffR = rng.nextInt(0, size - 1);
  const diffC = rng.nextInt(0, size - 1);
  const currentColor = grid2[diffR][diffC];
  const newColor = rng.pick(usedColors.filter((c) => c !== currentColor));
  grid2[diffR][diffC] = newColor;

  return {
    type: "spot-difference", category: "word", inputMode: "grid-tap",
    prompt: "Tap the different cell!",
    answer: `${diffR},${diffC}`,
    visualData: { grid: grid1, grid2, diffRow: diffR, diffCol: diffC },
  };
}

function generateDirectionMatch(rng: ReturnType<typeof createRNG>, difficulty: Difficulty): Puzzle {
  const correctIdx = rng.nextInt(0, 3);
  const correctDir = DIRECTIONS[correctIdx];
  const correctArrow = DIRECTION_ARROWS[correctIdx];

  let trickText: string | undefined;
  if (difficulty === "medium" || difficulty === "hard") {
    // Trick: text says a different direction
    if (rng.next() > 0.4) {
      const trickIdx = rng.nextInt(0, 3);
      if (trickIdx !== correctIdx) {
        trickText = DIRECTIONS[trickIdx].toUpperCase();
      }
    }
  }

  return {
    type: "direction-match", category: "word", inputMode: "direction",
    prompt: trickText ? `"${trickText}"` : "Match the arrow!",
    answer: correctDir,
    hint: trickText ? "Follow the ARROW, not the text!" : undefined,
    visualData: { arrow: correctArrow, trickText },
  };
}

// ===== PUZZLE ROUTER =====

const GENERATORS: Record<string, (rng: ReturnType<typeof createRNG>, d: Difficulty) => Puzzle> = {
  "quick-math": generateQuickMath,
  "rune-cipher": generateRuneCipher,
  "number-sequence": generateNumberSequence,
  "pattern-match": generatePatternMatch,
  "odd-one-out": generateOddOneOut,
  "mirror-match": generateMirrorMatch,
  "color-count": generateColorCount,
  "tap-target": generateTapTarget,
  "sequence-repeat": generateSequenceRepeat,
  "sort-order": generateSortOrder,
  "missing-letter": generateMissingLetter,
  "spot-difference": generateSpotDifference,
  "direction-match": generateDirectionMatch,
};

function getAvailableCategories(allowedCategories?: string): string[] {
  if (!allowedCategories || allowedCategories === "all") {
    return Object.keys(CATEGORY_TYPES);
  }
  if (CATEGORY_TYPES[allowedCategories]) return [allowedCategories];
  return Object.keys(CATEGORY_TYPES);
}

/**
 * Round-robin category assignment: cycles through categories, shuffled each cycle.
 * Ensures even distribution across categories with no two same-category in a row.
 */
function getCategoryForRound(seed: number, round: number, allowedCategories?: string): string {
  const cats = getAvailableCategories(allowedCategories);
  if (cats.length === 1) return cats[0];

  const rng = createRNG(seed);
  const assignments: string[] = [];
  const shuffled = [...cats];

  for (let i = 0; i <= round; i++) {
    if (i % shuffled.length === 0) {
      // Shuffle for this cycle
      for (let j = shuffled.length - 1; j > 0; j--) {
        const k = Math.floor(rng.next() * (j + 1));
        [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
      }
    }
    assignments.push(shuffled[i % shuffled.length]);
  }

  return assignments[round];
}

export function generatePuzzle(
  seed: number,
  round: number,
  difficulty: Difficulty,
  allowedCategories?: string
): Puzzle {
  const rng = createRNG(seed + round * 100);

  // Round-robin: get the assigned category for this round
  const category = getCategoryForRound(seed, round, allowedCategories);
  const typesInCategory = CATEGORY_TYPES[category] || Object.values(CATEGORY_TYPES).flat();

  // Pick a random type within the category
  const selectedType = typesInCategory[Math.floor(rng.next() * typesInCategory.length)];
  const gen = GENERATORS[selectedType];
  if (!gen) return generateQuickMath(rng, difficulty);

  return gen(rng, difficulty);
}

export function getCategoryIcon(category: PuzzleCategory): string {
  return CATEGORY_ICONS[category] || "🔢";
}

// ===== CONFIG-AWARE HELPERS =====

export function getRoundCount(difficulty: Difficulty, configRounds?: number): number {
  if (configRounds && configRounds > 0) return configRounds;
  return { easy: 5, medium: 7, hard: 10 }[difficulty];
}

export function getTimePerRound(difficulty: Difficulty, configTime?: number): number {
  if (configTime && configTime > 0) return configTime;
  return { easy: 15, medium: 10, hard: 7 }[difficulty];
}

export function getRating(totalTime: number, skipped: number, totalRounds: number): string {
  const avgTime = totalTime / totalRounds;
  if (skipped === 0 && avgTime < 3) return "Blazing Fast! 🔥";
  if (skipped === 0 && avgTime < 5) return "Quick Reflexes! ⚡";
  if (skipped <= 1 && avgTime < 8) return "Solid Work! 💪";
  return "The Underdark Waits for No One 🕯️";
}
