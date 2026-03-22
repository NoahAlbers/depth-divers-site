import { createRNG } from "./seeded-random";

export type Direction = "N" | "E" | "S" | "W";
export type CellType = "floor" | "wall" | "start" | "exit" | "cover";

export interface Guard {
  row: number;
  col: number;
  facing: Direction;
  type: "patrol" | "rotating" | "erratic";
  patrolPath: [number, number][];
  patrolIndex: number;
  patrolDirection: number; // 1 or -1
  erraticPause: number;
}

export interface StealthConfig {
  gridSize: number;
  grid: CellType[][];
  guards: Guard[];
  startPos: [number, number];
  exitPos: [number, number];
  beatInterval: number;
  visionDepth: number;
}

export interface StealthState {
  playerRow: number;
  playerCol: number;
  guards: Guard[];
  beatCount: number;
  beatTimer: number;
  caught: boolean;
  won: boolean;
  closeCalls: number;
  maxCloseCalls: number;
  warningFlashDuration: number;
  furthestRow: number; // tracks progress toward exit (row 0)
}

const DIRECTIONS: Direction[] = ["N", "E", "S", "W"];
export const DIR_OFFSETS: Record<Direction, [number, number]> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
};

function nextDir(d: Direction): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(d) + 1) % 4];
}

const DIFFICULTY_PARAMS = {
  easy: { gridSize: 7, beatInterval: 1.5, patrol: 2, rotating: 0, erratic: 0, visionDepth: 2, wallBlocks: 6, coverCount: 4 },
  medium: { gridSize: 9, beatInterval: 1.2, patrol: 3, rotating: 1, erratic: 0, visionDepth: 3, wallBlocks: 10, coverCount: 3 },
  hard: { gridSize: 11, beatInterval: 1.0, patrol: 4, rotating: 2, erratic: 1, visionDepth: 3, wallBlocks: 16, coverCount: 2 },
};

/**
 * Compute vision cone cells for a guard. Returns [row, col] pairs.
 * The cone is triangular: at depth d, it spans (2*d - 1) cells wide.
 * Walls and cover block line of sight.
 */
export function getVisionCone(
  guard: Guard,
  config: StealthConfig
): [number, number][] {
  const { grid, gridSize } = config;
  const cells: [number, number][] = [];
  const [dr, dc] = DIR_OFFSETS[guard.facing];
  const blockedSet = new Set<string>();

  for (let d = 1; d <= config.visionDepth; d++) {
    const spread = d - 1; // depth 1 → 0 spread (1 cell), depth 2 → 1 spread (3 cells), etc.
    for (let s = -spread; s <= spread; s++) {
      let r: number, c: number;
      if (dr !== 0) {
        // Facing N or S
        r = guard.row + dr * d;
        c = guard.col + s;
      } else {
        // Facing E or W
        r = guard.row + s;
        c = guard.col + dc * d;
      }

      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) continue;

      // Check if blocked by earlier depth cells: trace back to guard
      let blocked = false;
      // Simple approach: check if the parent cell(s) at depth d-1 are blocked
      if (d > 1) {
        // The cell at d-1 that would block this cell
        let pr: number, pc: number;
        if (dr !== 0) {
          pr = guard.row + dr * (d - 1);
          // Clamp spread to parent range
          const parentSpread = d - 2;
          const clampedS = Math.max(-parentSpread, Math.min(parentSpread, s));
          pc = guard.col + clampedS;
        } else {
          const parentSpread = d - 2;
          const clampedS = Math.max(-parentSpread, Math.min(parentSpread, s));
          pr = guard.row + clampedS;
          pc = guard.col + dc * (d - 1);
        }
        if (blockedSet.has(`${pr},${pc}`)) {
          blocked = true;
        }
      }

      if (blocked) {
        blockedSet.add(`${r},${c}`);
        continue;
      }

      const cell = grid[r][c];
      if (cell === "wall" || cell === "cover") {
        blockedSet.add(`${r},${c}`);
        continue;
      }

      cells.push([r, c]);
    }
  }

  return cells;
}

/**
 * BFS check: returns true if a path exists from start to end on non-wall cells.
 */
function hasPath(grid: CellType[][], start: [number, number], end: [number, number], gridSize: number): boolean {
  const visited = new Set<string>();
  const queue: [number, number][] = [start];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === end[0] && c === end[1]) return true;

    for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && !visited.has(key) && grid[nr][nc] !== "wall") {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return false;
}

export function generateLevel(
  difficulty: "easy" | "medium" | "hard",
  seed: number
): StealthConfig {
  const rng = createRNG(seed);
  const params = DIFFICULTY_PARAMS[difficulty];
  const gs = params.gridSize;

  // Initialize grid
  const grid: CellType[][] = Array.from({ length: gs }, () =>
    Array.from({ length: gs }, () => "floor" as CellType)
  );

  const startPos: [number, number] = [gs - 1, Math.floor(gs / 2)];
  const exitPos: [number, number] = [0, Math.floor(gs / 2)];
  grid[startPos[0]][startPos[1]] = "start";
  grid[exitPos[0]][exitPos[1]] = "exit";

  // Protected zones: don't place walls near start/exit
  const isProtected = (r: number, c: number) => {
    if (r >= gs - 2 && Math.abs(c - startPos[1]) <= 1) return true;
    if (r <= 1 && Math.abs(c - exitPos[1]) <= 1) return true;
    return false;
  };

  // Place wall blocks (2x1 or 1x2) to create corridors
  const wallCells: [number, number][] = [];
  for (let i = 0; i < params.wallBlocks; i++) {
    const r = rng.nextInt(1, gs - 2);
    const c = rng.nextInt(0, gs - 1);
    if (isProtected(r, c)) continue;
    if (grid[r][c] !== "floor") continue;

    grid[r][c] = "wall";
    wallCells.push([r, c]);

    // Optionally extend to adjacent cell for 2-cell blocks
    if (rng.next() > 0.4) {
      const horizontal = rng.next() > 0.5;
      const er = horizontal ? r : r + (rng.next() > 0.5 ? 1 : -1);
      const ec = horizontal ? c + (rng.next() > 0.5 ? 1 : -1) : c;
      if (er >= 1 && er < gs - 1 && ec >= 0 && ec < gs && !isProtected(er, ec) && grid[er][ec] === "floor") {
        grid[er][ec] = "wall";
        wallCells.push([er, ec]);
      }
    }

    // Verify path still exists
    if (!hasPath(grid, startPos, exitPos, gs)) {
      // Undo this wall placement
      const cell = wallCells.pop()!;
      grid[cell[0]][cell[1]] = "floor";
      if (wallCells.length > 0 && wallCells[wallCells.length - 1][0] === r && wallCells[wallCells.length - 1][1] === c) {
        // nothing extra to undo
      }
      // Also undo the base cell
      grid[r][c] = "floor";
      const idx = wallCells.findIndex(([wr, wc]) => wr === r && wc === c);
      if (idx >= 0) wallCells.splice(idx, 1);
    }
  }

  // Place guards
  const guards: Guard[] = [];

  // Helper: generate a patrol path along a corridor
  function makePatrolPath(startR: number, startC: number, horizontal: boolean, length: number): [number, number][] {
    const path: [number, number][] = [];
    for (let p = 0; p < length; p++) {
      const pr = horizontal ? startR : startR + p;
      const pc = horizontal ? startC + p : startC;
      if (pr >= 0 && pr < gs && pc >= 0 && pc < gs && grid[pr][pc] !== "wall") {
        path.push([pr, pc]);
      } else {
        break;
      }
    }
    return path;
  }

  // Place patrol guards
  for (let i = 0; i < params.patrol; i++) {
    let attempts = 0;
    while (attempts < 30) {
      attempts++;
      const r = rng.nextInt(2, gs - 3);
      const c = rng.nextInt(1, gs - 2);
      if (grid[r][c] !== "floor") continue;

      const horizontal = rng.next() > 0.5;
      const pathLen = rng.nextInt(3, 5);
      const path = makePatrolPath(r, c, horizontal, pathLen);
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
        break;
      }
    }
  }

  // Place rotating guards
  for (let i = 0; i < params.rotating; i++) {
    let attempts = 0;
    while (attempts < 30) {
      attempts++;
      const r = rng.nextInt(2, gs - 3);
      const c = rng.nextInt(1, gs - 2);
      if (grid[r][c] !== "floor") continue;
      // Don't overlap with existing guards
      if (guards.some((g) => g.row === r && g.col === c)) continue;

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
      break;
    }
  }

  // Place erratic guards (hard only)
  for (let i = 0; i < params.erratic; i++) {
    let attempts = 0;
    while (attempts < 30) {
      attempts++;
      const r = rng.nextInt(3, gs - 4);
      const c = rng.nextInt(2, gs - 3);
      if (grid[r][c] !== "floor") continue;
      if (guards.some((g) => g.row === r && g.col === c)) continue;

      const horizontal = rng.next() > 0.5;
      const path = makePatrolPath(r, c, horizontal, rng.nextInt(2, 4));
      if (path.length >= 2) {
        guards.push({
          row: path[0][0],
          col: path[0][1],
          facing: horizontal ? "E" : "S",
          type: "erratic",
          patrolPath: path,
          patrolIndex: 0,
          patrolDirection: 1,
          erraticPause: 0,
        });
        break;
      }
    }
  }

  // Place cover tiles near guard routes
  const coverPlaced = new Set<string>();
  for (let i = 0; i < params.coverCount; i++) {
    let attempts = 0;
    while (attempts < 40) {
      attempts++;
      // Pick a cell near a guard's patrol path
      const g = guards.length > 0 ? guards[rng.nextInt(0, guards.length - 1)] : null;
      let r: number, c: number;
      if (g && g.patrolPath.length > 0) {
        const [pr, pc] = g.patrolPath[rng.nextInt(0, g.patrolPath.length - 1)];
        r = pr + rng.nextInt(-2, 2);
        c = pc + rng.nextInt(-2, 2);
      } else {
        r = rng.nextInt(2, gs - 3);
        c = rng.nextInt(1, gs - 2);
      }
      if (r < 0 || r >= gs || c < 0 || c >= gs) continue;
      if (grid[r][c] !== "floor") continue;
      if (isProtected(r, c)) continue;
      if (coverPlaced.has(`${r},${c}`)) continue;
      if (guards.some((gg) => gg.row === r && gg.col === c)) continue;

      grid[r][c] = "cover";
      coverPlaced.add(`${r},${c}`);

      // Verify path still exists
      if (!hasPath(grid, startPos, exitPos, gs)) {
        grid[r][c] = "floor";
        coverPlaced.delete(`${r},${c}`);
      } else {
        break;
      }
    }
  }

  return {
    gridSize: gs,
    grid,
    guards,
    startPos,
    exitPos,
    beatInterval: params.beatInterval,
    visionDepth: params.visionDepth,
  };
}

export function createStealthState(config: StealthConfig, stealthBonus: number = 0): StealthState {
  // Calculate stat influence
  const warningFlash = 0.2 + 0.03 * stealthBonus;
  let freeCloseCalls = 0;
  if (stealthBonus >= 9) freeCloseCalls = 2;
  else if (stealthBonus >= 5) freeCloseCalls = 1;

  return {
    playerRow: config.startPos[0],
    playerCol: config.startPos[1],
    guards: config.guards.map((g) => ({ ...g })),
    beatCount: 0,
    beatTimer: config.beatInterval,
    caught: false,
    won: false,
    closeCalls: 0,
    maxCloseCalls: freeCloseCalls,
    warningFlashDuration: warningFlash,
    furthestRow: config.startPos[0],
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
    s.beatTimer += config.beatInterval;
    s.beatCount++;

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
            const dr = nr - g.row;
            const dc = nc - g.col;
            g.row = nr;
            g.col = nc;
            if (dr < 0) g.facing = "N";
            else if (dr > 0) g.facing = "S";
            else if (dc > 0) g.facing = "E";
            else if (dc < 0) g.facing = "W";
          }
        }
      }
    }

    // Detection check
    for (const g of s.guards) {
      const cone = getVisionCone(g, config);
      for (const [cr, cc] of cone) {
        if (cr === s.playerRow && cc === s.playerCol) {
          if (s.closeCalls < s.maxCloseCalls) {
            s.closeCalls++;
          } else {
            s.caught = true;
          }
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
  if (state.caught || state.won) return state;

  const nr = state.playerRow + dr;
  const nc = state.playerCol + dc;

  if (nr < 0 || nr >= config.gridSize || nc < 0 || nc >= config.gridSize) return state;
  if (config.grid[nr][nc] === "wall") return state;

  const s = { ...state };
  s.playerRow = nr;
  s.playerCol = nc;

  // Track progress
  if (nr < s.furthestRow) {
    s.furthestRow = nr;
  }

  // Check win
  if (nr === config.exitPos[0] && nc === config.exitPos[1]) {
    s.won = true;
  }

  return s;
}

/**
 * Compute vision cones for the NEXT beat (for warning flash).
 * Simulates one tick of guard movement without mutating state.
 */
export function getNextBeatVisionCells(
  state: StealthState,
  config: StealthConfig,
  rng: ReturnType<typeof createRNG>
): Set<string> {
  const cells = new Set<string>();

  // Simulate guard positions after next beat
  for (const g of state.guards) {
    const simGuard = { ...g };

    if (simGuard.type === "patrol") {
      let idx = simGuard.patrolIndex + simGuard.patrolDirection;
      if (idx >= simGuard.patrolPath.length - 1) idx = simGuard.patrolPath.length - 1;
      if (idx <= 0) idx = 0;
      const [nr, nc] = simGuard.patrolPath[idx];
      const dr = nr - simGuard.row;
      const dc = nc - simGuard.col;
      simGuard.row = nr;
      simGuard.col = nc;
      if (dr < 0) simGuard.facing = "N";
      else if (dr > 0) simGuard.facing = "S";
      else if (dc > 0) simGuard.facing = "E";
      else if (dc < 0) simGuard.facing = "W";
    } else if (simGuard.type === "rotating") {
      simGuard.facing = nextDir(simGuard.facing);
    }
    // Erratic guards are unpredictable, so we don't simulate them for warning

    const cone = getVisionCone(simGuard, config);
    for (const [r, c] of cone) {
      cells.add(`${r},${c}`);
    }
  }

  return cells;
}
