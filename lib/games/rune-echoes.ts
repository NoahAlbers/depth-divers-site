import { createRNG } from "./seeded-random";

export const RUNE_SYMBOLS = ["᛭", "ᚱ", "ᛟ", "ᚦ", "ᛗ", "ᚹ", "ᛉ", "ᚨ", "ᛊ"];

export interface RuneEchoesConfig {
  gridSize: number;       // number of runes to display
  flashSpeed: number;     // ms per rune flash
  startLength: number;    // initial sequence length
  runeCount: number;      // how many distinct runes
}

export function getConfig(difficulty: "easy" | "medium" | "hard"): RuneEchoesConfig {
  switch (difficulty) {
    case "easy":
      return { gridSize: 4, flashSpeed: 1000, startLength: 3, runeCount: 4 };
    case "medium":
      return { gridSize: 6, flashSpeed: 700, startLength: 4, runeCount: 6 };
    case "hard":
      return { gridSize: 9, flashSpeed: 500, startLength: 5, runeCount: 9 };
  }
}

/**
 * Pre-generate a long sequence of rune indices using seeded RNG.
 * Each index refers to a position in the rune grid (0 to gridSize-1).
 */
export function generateSequence(seed: number, maxLength: number, runeCount: number): number[] {
  const rng = createRNG(seed);
  const sequence: number[] = [];
  for (let i = 0; i < maxLength; i++) {
    sequence.push(rng.nextInt(0, runeCount - 1));
  }
  return sequence;
}
