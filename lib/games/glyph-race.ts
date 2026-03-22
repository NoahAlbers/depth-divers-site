import { createRNG } from "./seeded-random";

export interface Puzzle {
  type: "math-cipher" | "quick-math" | "pattern-match";
  prompt: string;
  answer: string;
  options?: string[]; // for pattern-match (multiple choice)
  hint?: string;
}

const SYMBOLS = ["☽", "◆", "★", "◇", "△", "○"];

function generateMathCipher(
  rng: ReturnType<typeof createRNG>,
  difficulty: "easy" | "medium" | "hard"
): Puzzle {
  const symA = SYMBOLS[rng.nextInt(0, SYMBOLS.length - 1)];
  const symB = SYMBOLS[rng.nextInt(0, SYMBOLS.length - 1)];

  if (difficulty === "hard") {
    // Two operations
    const symC = SYMBOLS[rng.nextInt(0, SYMBOLS.length - 1)];
    const a = rng.nextInt(2, 12);
    const b = rng.nextInt(2, 12);
    const c = rng.nextInt(1, 10);
    const result = a + b - c;
    return {
      type: "math-cipher",
      prompt: `${symA} + ${symB} - ${symC} = ${result}\n${symA} = ${a}\n${symB} = ${b}\n${symC} = ?`,
      answer: String(c),
      hint: "Solve for the unknown",
    };
  }

  const a = rng.nextInt(1, 15);
  const b = rng.nextInt(1, 15);
  const op = rng.pick(["+", "-"]);
  const result = op === "+" ? a + b : a - b;

  const askForB = rng.next() > 0.5;
  if (askForB) {
    return {
      type: "math-cipher",
      prompt: `${symA} ${op} ${symB} = ${result}\n${symA} = ${a}\n${symB} = ?`,
      answer: String(b),
      hint: "Solve for the unknown symbol",
    };
  }
  return {
    type: "math-cipher",
    prompt: `${symA} ${op} ${symB} = ${result}\n${symB} = ${b}\n${symA} = ?`,
    answer: String(a),
    hint: "Solve for the unknown symbol",
  };
}

function generateQuickMath(
  rng: ReturnType<typeof createRNG>,
  difficulty: "easy" | "medium" | "hard"
): Puzzle {
  let a: number, b: number, op: string, answer: number;

  if (difficulty === "easy") {
    a = rng.nextInt(2, 20);
    b = rng.nextInt(2, 20);
    op = rng.pick(["+", "-"]);
    answer = op === "+" ? a + b : a - b;
  } else if (difficulty === "medium") {
    op = rng.pick(["+", "-", "×"]);
    if (op === "×") {
      a = rng.nextInt(2, 12);
      b = rng.nextInt(2, 12);
      answer = a * b;
    } else {
      a = rng.nextInt(10, 100);
      b = rng.nextInt(10, 100);
      answer = op === "+" ? a + b : a - b;
    }
  } else {
    op = rng.pick(["×", "÷", "+", "-"]);
    if (op === "÷") {
      answer = rng.nextInt(3, 15);
      b = rng.nextInt(2, 12);
      a = answer * b; // ensure clean division
    } else if (op === "×") {
      a = rng.nextInt(6, 25);
      b = rng.nextInt(6, 25);
      answer = a * b;
    } else {
      a = rng.nextInt(50, 500);
      b = rng.nextInt(50, 500);
      answer = op === "+" ? a + b : a - b;
    }
  }

  return {
    type: "quick-math",
    prompt: `${a} ${op} ${b} = ?`,
    answer: String(answer),
    hint: "Calculate the result",
  };
}

function generatePatternMatch(
  rng: ReturnType<typeof createRNG>,
  difficulty: "easy" | "medium" | "hard"
): Puzzle {
  // Number sequence pattern
  const patternType = rng.nextInt(0, 2);
  let sequence: number[];
  let answer: number;

  if (patternType === 0) {
    // Arithmetic: add a constant
    const start = rng.nextInt(1, 20);
    const step = difficulty === "easy" ? rng.nextInt(2, 5) : rng.nextInt(3, 12);
    sequence = Array.from({ length: 4 }, (_, i) => start + step * i);
    answer = start + step * 4;
  } else if (patternType === 1) {
    // Multiply by constant
    const start = rng.nextInt(1, 5);
    const mult = rng.nextInt(2, difficulty === "easy" ? 3 : 4);
    sequence = [start];
    for (let i = 1; i < 4; i++) sequence.push(sequence[i - 1] * mult);
    answer = sequence[3] * mult;
  } else {
    // Alternating add two different values
    const start = rng.nextInt(1, 10);
    const a = rng.nextInt(1, 5);
    const b = rng.nextInt(2, 8);
    sequence = [start, start + a, start + a + b, start + 2 * a + b];
    answer = start + 2 * a + 2 * b;
  }

  // Generate wrong answers
  const wrong = [
    answer + rng.nextInt(1, 5),
    answer - rng.nextInt(1, 5),
    answer + rng.nextInt(6, 15),
  ].filter((w) => w !== answer && w > 0);

  // Ensure we have at least 3 wrong answers
  while (wrong.length < 3) wrong.push(answer + wrong.length + 10);

  const options = rng.shuffle([answer, ...wrong.slice(0, 3)]).map(String);

  return {
    type: "pattern-match",
    prompt: sequence.join(", ") + ", ?",
    answer: String(answer),
    options,
    hint: "What comes next?",
  };
}

export function generatePuzzle(
  seed: number,
  round: number,
  difficulty: "easy" | "medium" | "hard"
): Puzzle {
  const rng = createRNG(seed + round * 1000);

  // Cycle through puzzle types: math-cipher, quick-math, pattern-match
  const types = ["math-cipher", "quick-math", "pattern-match"] as const;
  const type = types[round % 3];

  switch (type) {
    case "math-cipher":
      return generateMathCipher(rng, difficulty);
    case "quick-math":
      return generateQuickMath(rng, difficulty);
    case "pattern-match":
      return generatePatternMatch(rng, difficulty);
  }
}

export function getRoundCount(difficulty: "easy" | "medium" | "hard"): number {
  return difficulty === "easy" ? 3 : difficulty === "medium" ? 5 : 5;
}

export function getTimePerRound(difficulty: "easy" | "medium" | "hard"): number {
  return difficulty === "easy" ? 30 : difficulty === "medium" ? 25 : 20;
}
