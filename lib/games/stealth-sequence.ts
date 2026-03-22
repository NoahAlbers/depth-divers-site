import { createRNG } from "./seeded-random";

export type Direction = "N" | "E" | "S" | "W";

export interface Guard {
  row: number;
  col: number;
  facing: Direction;
  type: "patrol" | "rotating" | "erratic";
  patrolPath: [number, number][]; // for patrol guards
  patrolIndex: number;
  patrolDirection: number; // 1 or -1
  erraticPause: number; // beats remaining to pause
}

export interface StealthConfig {
  gridSize: number;
  guards: Guard[];
  walls: Set<string>; // "row,col" strings
  startRow: number;
  startCol: number;
  exitRow: number;
  exitCol: number;
}

export interface StealthState {
  playerRow: number;
  playerCol: number;
  guards: Guard[];
  beatCount: number;
  beatTimer: number; // seconds until next beat
  caught: boolean;
  won: boolean;
  canMove: boolean; // player can move between beats
}

const BEAT_INTERVAL = 1.5; // seconds
const DIRECTIONS: Direction[] = ["N", "E", "S", "W"];
const DIR_OFFSETS: Record<Direction, [number, number]> = {
  N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1],
};

function nextDir(d: Direction): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(d) + 1) % 4];
}

/**
 * Get the cells visible from a guard's position and facing direction.
 * Returns array of [row, col] pairs.
 */
export function getVisionCone(
  guard: Guard,
  gridSize: number,
  walls: Set<string>
): [number, number][] {
  const cells: [number, number][] = [];
  const [dr, dc] = DIR_OFFSETS[guard.facing];
  const depth = 3;
  const spread = 1;

  for (let d = 1; d <= depth; d++) {
    for (let s = -spread; s <= spread; s++) {
      let r: number, c: number;
      if (dr !== 0) {
        r = guard.row + dr * d;
        c = guard.col + s;
      } else {
        r = guard.row + s;
        c = guard.col + dc * d;
      }

      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize && !walls.has(`${r},${c}`)) {
        cells.push([r, c]);
      }
    }
  }

  return cells;
}

export function generateLevel(
  difficulty: "easy" | "medium" | "hard",
  seed: number
): StealthConfig {
  const rng = createRNG(seed);
  const gridSize = difficulty === "easy" ? 8 : difficulty === "medium" ? 10 : 12;

  // Generate some walls (random obstacle blocks)
  const walls = new Set<string>();
  const numWallBlocks = difficulty === "easy" ? 4 : difficulty === "medium" ? 8 : 12;
  for (let i = 0; i < numWallBlocks; i++) {
    const r = rng.nextInt(1, gridSize - 2);
    const c = rng.nextInt(0, gridSize - 1);
    // Don't block start/exit areas
    if (r === gridSize - 1 || r === 0) continue;
    if (r === gridSize - 1 && c === Math.floor(gridSize / 2)) continue;
    walls.add(`${r},${c}`);
  }

  // Generate guards
  const guards: Guard[] = [];

  // Patrol guards
  const numPatrol = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;
  for (let i = 0; i < numPatrol; i++) {
    const startR = rng.nextInt(2, gridSize - 3);
    const startC = rng.nextInt(1, gridSize - 2);
    const horizontal = rng.next() > 0.5;
    const pathLen = rng.nextInt(2, 4);
    const path: [number, number][] = [];

    for (let p = 0; p <= pathLen; p++) {
      const pr = horizontal ? startR : startR + p;
      const pc = horizontal ? startC + p : startC;
      if (pr >= 0 && pr < gridSize && pc >= 0 && pc < gridSize) {
        path.push([pr, pc]);
      }
    }

    if (path.length >= 2) {
      guards.push({
        row: path[0][0],
        col: path[0][1],
        facing: horizontal ? "E" : "S",
        type: "patrol",
        patrolPath: path,
        patrolIndex: 0,
        patrolDirection: 1,
        erraticPause: 0,
      });
    }
  }

  // Rotating guards
  if (difficulty !== "easy") {
    const numRotating = difficulty === "medium" ? 1 : 2;
    for (let i = 0; i < numRotating; i++) {
      const r = rng.nextInt(2, gridSize - 3);
      const c = rng.nextInt(1, gridSize - 2);
      guards.push({
        row: r,
        col: c,
        facing: rng.pick(DIRECTIONS),
        type: "rotating",
        patrolPath: [[r, c]],
        patrolIndex: 0,
        patrolDirection: 1,
        erraticPause: 0,
      });
    }
  }

  // Erratic guard (hard only)
  if (difficulty === "hard") {
    const r = rng.nextInt(3, gridSize - 4);
    const c = rng.nextInt(2, gridSize - 3);
    const path: [number, number][] = [];
    for (let p = 0; p < 3; p++) path.push([r, c + p]);
    guards.push({
      row: r,
      col: c,
      facing: "E",
      type: "erratic",
      patrolPath: path,
      patrolIndex: 0,
      patrolDirection: 1,
      erraticPause: 0,
    });
  }

  return {
    gridSize,
    guards,
    walls,
    startRow: gridSize - 1,
    startCol: Math.floor(gridSize / 2),
    exitRow: 0,
    exitCol: Math.floor(gridSize / 2),
  };
}

export function createStealthState(config: StealthConfig): StealthState {
  return {
    playerRow: config.startRow,
    playerCol: config.startCol,
    guards: config.guards.map((g) => ({ ...g })),
    beatCount: 0,
    beatTimer: BEAT_INTERVAL,
    caught: false,
    won: false,
    canMove: true,
  };
}

export function tickStealth(
  state: StealthState,
  dt: number,
  config: StealthConfig,
  rng: ReturnType<typeof createRNG>
): StealthState {
  if (state.caught || state.won) return state;

  const s: StealthState = {
    ...state,
    guards: state.guards.map((g) => ({ ...g })),
  };

  s.beatTimer -= dt;

  if (s.beatTimer <= 0) {
    s.beatTimer += BEAT_INTERVAL;
    s.beatCount++;
    s.canMove = true;

    // Move guards
    for (const g of s.guards) {
      if (g.type === "patrol") {
        g.patrolIndex += g.patrolDirection;
        if (g.patrolIndex >= g.patrolPath.length - 1) g.patrolDirection = -1;
        if (g.patrolIndex <= 0) g.patrolDirection = 1;
        const [nr, nc] = g.patrolPath[g.patrolIndex];
        const dr = nr - g.row;
        const dc = nc - g.col;
        g.row = nr;
        g.col = nc;
        if (dr < 0) g.facing = "N";
        else if (dr > 0) g.facing = "S";
        else if (dc > 0) g.facing = "E";
        else if (dc < 0) g.facing = "W";
      } else if (g.type === "rotating") {
        g.facing = nextDir(g.facing);
      } else if (g.type === "erratic") {
        if (g.erraticPause > 0) {
          g.erraticPause--;
        } else {
          if (rng.next() < 0.3) {
            g.erraticPause = rng.nextInt(1, 2);
          } else {
            g.patrolIndex += g.patrolDirection;
            if (g.patrolIndex >= g.patrolPath.length - 1) g.patrolDirection = -1;
            if (g.patrolIndex <= 0) g.patrolDirection = 1;
            const [nr, nc] = g.patrolPath[g.patrolIndex];
            g.row = nr;
            g.col = nc;
          }
        }
      }
    }

    // Check if player is in any vision cone
    for (const g of s.guards) {
      const cone = getVisionCone(g, config.gridSize, config.walls);
      for (const [cr, cc] of cone) {
        if (cr === s.playerRow && cc === s.playerCol) {
          s.caught = true;
          break;
        }
      }
      if (s.caught) break;
    }
  }

  return s;
}

export function movePlayer(
  state: StealthState,
  dr: number,
  dc: number,
  config: StealthConfig
): StealthState {
  if (state.caught || state.won || !state.canMove) return state;

  const nr = state.playerRow + dr;
  const nc = state.playerCol + dc;

  if (nr < 0 || nr >= config.gridSize || nc < 0 || nc >= config.gridSize) return state;
  if (config.walls.has(`${nr},${nc}`)) return state;

  const s = { ...state };
  s.playerRow = nr;
  s.playerCol = nc;
  s.canMove = false; // one move per beat

  // Check win
  if (nr === config.exitRow && nc === config.exitCol) {
    s.won = true;
  }

  return s;
}
