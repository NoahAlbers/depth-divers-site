import { createRNG } from "./seeded-random";

export const NODE_STATES = ["red", "blue", "green", "purple"] as const;
export type NodeState = (typeof NODE_STATES)[number];

export const SYMBOLS = ["☽", "◆", "★", "◇", "△", "○", "⬡", "⬢"] as const;

export interface PuzzleTemplate {
  nodeCount: number;
  solution: NodeState[];
  keyMappings: { symbol: string; color: NodeState; isDecoy: boolean }[];
  validatorClues: string[];
  sequenceOrder: number[]; // indices into nodes for activation order
}

export interface PlayerRole {
  roleIndex: number;
  roleName: string;
  description: string;
}

export function getRoles(playerCount: number): PlayerRole[] {
  const roles: PlayerRole[] = [
    { roleIndex: 0, roleName: "The Grid", description: "You control the nodes. Set each to the correct color and hit DEFUSE." },
    { roleIndex: 1, roleName: "The Key", description: "You see the symbol-to-color mapping. Some entries are UNSTABLE (decoys)." },
    { roleIndex: 2, roleName: "The Validator", description: "You know which Key entries are real vs unstable." },
    { roleIndex: 3, roleName: "The Sequence", description: "You see the order nodes must be activated." },
  ];

  if (playerCount <= 2) {
    // Combine roles
    return [
      { roleIndex: 0, roleName: "Grid + Sequence", description: "You control the nodes AND see the activation order." },
      { roleIndex: 1, roleName: "Key + Validator", description: "You see the mappings AND know which are real." },
    ];
  }
  if (playerCount === 3) {
    return [
      roles[0],
      roles[1],
      { roleIndex: 2, roleName: "Validator + Sequence", description: "You know which mappings are real AND the activation order." },
    ];
  }

  return roles.slice(0, Math.min(playerCount, 4));
}

export function generatePuzzle(
  seed: number,
  difficulty: "easy" | "medium" | "hard"
): PuzzleTemplate {
  const rng = createRNG(seed);

  const nodeCount = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 6;
  const numDecoys = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 4;

  // Generate solution
  const solution: NodeState[] = [];
  for (let i = 0; i < nodeCount; i++) {
    solution.push(rng.pick([...NODE_STATES]));
  }

  // Generate key mappings
  const keyMappings: PuzzleTemplate["keyMappings"] = [];
  const usedSymbols = rng.shuffle([...SYMBOLS]);

  // Real mappings: one per node
  for (let i = 0; i < nodeCount; i++) {
    keyMappings.push({
      symbol: usedSymbols[i],
      color: solution[i],
      isDecoy: false,
    });
  }

  // Decoy mappings
  for (let i = 0; i < numDecoys; i++) {
    const symIdx = nodeCount + i < usedSymbols.length ? nodeCount + i : i;
    keyMappings.push({
      symbol: usedSymbols[symIdx] || `D${i}`,
      color: rng.pick([...NODE_STATES]),
      isDecoy: true,
    });
  }

  // Shuffle mappings so decoys are mixed in
  const shuffledMappings = rng.shuffle(keyMappings);

  // Generate validator clues
  const validatorClues: string[] = [];
  for (const mapping of shuffledMappings) {
    if (mapping.isDecoy) {
      validatorClues.push(`The entry for ${mapping.symbol} is UNSTABLE (decoy).`);
    }
  }

  // Add some positive clues
  const realMappings = shuffledMappings.filter((m) => !m.isDecoy);
  for (const m of realMappings.slice(0, 2)) {
    validatorClues.push(`The entry for ${m.symbol} is STABLE (real).`);
  }

  // Sequence order
  const sequenceOrder = rng.shuffle(Array.from({ length: nodeCount }, (_, i) => i));

  return {
    nodeCount,
    solution,
    keyMappings: shuffledMappings,
    validatorClues: rng.shuffle(validatorClues),
    sequenceOrder,
  };
}

export function getTimerDuration(difficulty: "easy" | "medium" | "hard"): number {
  return difficulty === "easy" ? 300 : difficulty === "medium" ? 180 : 120;
}

export function checkSolution(
  playerSolution: NodeState[],
  template: PuzzleTemplate
): boolean {
  if (playerSolution.length !== template.solution.length) return false;
  return playerSolution.every((s, i) => s === template.solution[i]);
}
