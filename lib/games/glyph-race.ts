import { createRNG } from "./seeded-random";

export interface Puzzle {
  type: "anagram" | "math";
  prompt: string;
  answer: string;
  hint?: string;
}

const WORDS_EASY = [
  "DROW", "RUNE", "CAVE", "DARK", "MAGE", "BOLT", "FANG", "GLOW",
  "HUSK", "JADE", "KNOT", "LAIR", "MOSS", "OATH", "PACT", "RUBY",
  "SEAL", "TOMB", "VEIL", "WARD", "HELM", "CLAW", "BONE", "DUST",
];

const WORDS_MEDIUM = [
  "FAERZRESS", "STALACTITE", "MYCONID", "DUERGAR", "UNDERDARK",
  "ABOLETH", "BEHOLDER", "CLOAKER", "ILLITHID", "QUAGGOTH",
  "ALCHEMY", "CAVERNS", "CRYSTAL", "DUNGEON", "ENCHANT",
  "SPELUNKY", "OBSIDIAN", "MUSHROOM", "DARKVISION", "STALKING",
];

const WORDS_HARD = [
  "GRACKLSTUGH", "SVIRFNEBLIN", "NEVERLIGHT", "MENZOBERRANZAN",
  "BIOLUMINESCENT", "SPELLJAMMER", "PETRIFICATION", "TRANSMUTATION",
  "NECROMANCY", "ENCHANTMENT", "CONJURATION", "EVOCATION",
];

const SYMBOLS = ["☽", "◆", "★", "◇", "△", "○"];

function scrambleWord(word: string, rng: ReturnType<typeof createRNG>): string {
  const letters = word.split("");
  let scrambled = rng.shuffle(letters).join("");
  // Make sure it's actually different
  let attempts = 0;
  while (scrambled === word && attempts < 10) {
    scrambled = rng.shuffle(letters).join("");
    attempts++;
  }
  return scrambled;
}

function generateMathPuzzle(rng: ReturnType<typeof createRNG>): Puzzle {
  const symA = SYMBOLS[rng.nextInt(0, SYMBOLS.length - 1)];
  const symB = SYMBOLS[rng.nextInt(0, SYMBOLS.length - 1)];
  const a = rng.nextInt(1, 15);
  const b = rng.nextInt(1, 15);
  const op = rng.pick(["+", "-"]);
  const result = op === "+" ? a + b : a - b;

  // Ask for one of the values
  const askForB = rng.next() > 0.5;

  if (askForB) {
    return {
      type: "math",
      prompt: `${symA} ${op} ${symB} = ${result}\n${symA} = ${a}\n${symB} = ?`,
      answer: String(b),
      hint: "Solve for the unknown symbol",
    };
  } else {
    return {
      type: "math",
      prompt: `${symA} ${op} ${symB} = ${result}\n${symB} = ${b}\n${symA} = ?`,
      answer: String(a),
      hint: "Solve for the unknown symbol",
    };
  }
}

export function generatePuzzle(
  seed: number,
  round: number,
  difficulty: "easy" | "medium" | "hard"
): Puzzle {
  const rng = createRNG(seed + round * 1000);

  // Alternate between anagram and math
  const type = round % 2 === 0 ? "anagram" : "math";

  if (type === "math") {
    return generateMathPuzzle(rng);
  }

  // Anagram
  const wordList =
    difficulty === "easy"
      ? WORDS_EASY
      : difficulty === "medium"
        ? WORDS_MEDIUM
        : WORDS_HARD;

  const word = rng.pick(wordList);
  const scrambled = scrambleWord(word, rng);

  return {
    type: "anagram",
    prompt: scrambled,
    answer: word,
    hint: `${word.length} letters`,
  };
}

export function getRoundCount(difficulty: "easy" | "medium" | "hard"): number {
  return difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 5;
}

export function getTimePerRound(difficulty: "easy" | "medium" | "hard"): number {
  return difficulty === "easy" ? 30 : difficulty === "medium" ? 25 : 20;
}
