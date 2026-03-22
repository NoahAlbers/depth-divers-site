import { createRNG } from "./seeded-random";

// ===== TYPES =====

export type PipeType =
  | "horizontal"  // ═  left↔right
  | "vertical"    // ║  up↔down
  | "corner-dr"   // ╔  top→right / left→down
  | "corner-dl"   // ╗  top→left / right→down
  | "corner-ur"   // ╚  bottom→right / left→up
  | "corner-ul"   // ╝  bottom→left / right→up
  | "cross";      // ╬  left↔right AND up↔down (dual use)

export type CellState = "empty" | "blocked" | "source" | "end-crystal" | "reservoir";

// Directions: 0=up, 1=right, 2=down, 3=left
const OPPOSITE: Record<number, number> = { 0: 2, 1: 3, 2: 0, 3: 1 };
const DR = [-1, 0, 1, 0];
const DC = [0, 1, 0, -1];

// Which direction pairs each pipe type connects
const PIPE_CONNECTIONS: Record<PipeType, [number, number][]> = {
  horizontal:  [[1, 3]],         // right↔left
  vertical:    [[0, 2]],         // up↔down
  "corner-dr": [[0, 1]],        // up→right (╔)
  "corner-dl": [[0, 3]],        // up→left (╗)
  "corner-ur": [[2, 1]],        // down→right (╚)
  "corner-ul": [[2, 3]],        // down→left (╝)
  cross:       [[1, 3], [0, 2]], // horizontal AND vertical (two independent paths)
};

/**
 * Given a pipe type and the direction flow ENTERS from,
 * return the direction flow EXITS to. Returns -1 if flow can't enter from that side.
 */
export function getExitDirection(pipe: PipeType, enterFrom: number): number {
  const pairs = PIPE_CONNECTIONS[pipe];
  for (const [a, b] of pairs) {
    if (a === enterFrom) return b;
    if (b === enterFrom) return a;
  }
  return -1;
}

/**
 * Check if a pipe accepts flow from a given direction.
 */
export function acceptsFlowFrom(pipe: PipeType, direction: number): boolean {
  return getExitDirection(pipe, direction) !== -1;
}

export interface PipeCell {
  pipe: PipeType | null;
  state: CellState;
  flowFilled: boolean;
  flowProgress: number;       // 0-1 for animation
  flowDirections: number[];   // which entry directions have been used
  locked: boolean;
}

export interface FlowHead {
  row: number;
  col: number;
  enterDir: number; // direction flow enters this cell from
}

export interface ArcaneConduitState {
  grid: PipeCell[][];
  gridSize: number;
  difficulty: string;
  sourcePos: [number, number];
  sourceExitDir: number;
  endCrystalPos: [number, number] | null;
  reservoirPos: [number, number] | null;
  queue: PipeType[];
  queueSize: number;
  score: number;
  segmentCount: number;
  penalties: number;
  flowActive: boolean;
  flowHead: FlowHead | null;
  flowTimer: number;
  flowSpeed: number;
  baseFlowSpeed: number;
  initialDelay: number;
  delayTimer: number;
  gameOver: boolean;
  reachedEndCrystal: boolean;
  minSegments: number;
  replaceCooldown: number;
  lastReplaced: [number, number] | null;
}

// ===== DIFFICULTY PARAMS =====

const DIFFICULTY_PARAMS = {
  easy:   { gridSize: 7,  flowDelay: 15, minSegments: 10, blockedCells: 0,  hasReservoir: false, hasEndCrystal: false },
  medium: { gridSize: 9,  flowDelay: 10, minSegments: 16, blockedCells: 4,  hasReservoir: false, hasEndCrystal: false },
  hard:   { gridSize: 10, flowDelay: 6,  minSegments: 22, blockedCells: 5,  hasReservoir: true,  hasEndCrystal: true },
};

// ===== FLOW SPEED RAMP =====

const FLOW_SPEED_CONFIGS: Record<string, { start: number; end: number; rampSegments: number }> = {
  easy:   { start: 3.0, end: 1.8, rampSegments: 15 },
  medium: { start: 2.5, end: 1.3, rampSegments: 15 },
  hard:   { start: 2.0, end: 0.8, rampSegments: 12 },
};

export function getFlowSpeed(difficulty: string, segmentCount: number): number {
  const c = FLOW_SPEED_CONFIGS[difficulty] || FLOW_SPEED_CONFIGS.medium;
  const t = Math.min(segmentCount / c.rampSegments, 1);
  return c.start + (c.end - c.start) * t;
}

// ===== PIPE GENERATION =====

const ALL_PIPES: PipeType[] = [
  "horizontal", "vertical", "corner-dr", "corner-dl", "corner-ur", "corner-ul", "cross",
];

const PIPE_WEIGHTS: Record<PipeType, number> = {
  horizontal: 15, vertical: 15, "corner-dr": 15, "corner-dl": 15, "corner-ur": 15, "corner-ul": 15, cross: 8,
};

function generatePipe(rng: ReturnType<typeof createRNG>): PipeType {
  const total = Object.values(PIPE_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  for (const pipe of ALL_PIPES) {
    r -= PIPE_WEIGHTS[pipe];
    if (r <= 0) return pipe;
  }
  return "horizontal";
}

/**
 * Generate a queue of pipes with guaranteed variety:
 * within every 7 consecutive pieces, at least 1 horizontal, 1 vertical, 2 different corners.
 */
function generateQueue(rng: ReturnType<typeof createRNG>, size: number): PipeType[] {
  const queue: PipeType[] = [];
  for (let i = 0; i < size; i++) {
    queue.push(generatePipe(rng));
  }
  // Validate variety in first 7
  ensureVariety(queue, rng, 0);
  return queue;
}

function ensureVariety(queue: PipeType[], rng: ReturnType<typeof createRNG>, startIdx: number) {
  const end = Math.min(startIdx + 7, queue.length);
  const slice = queue.slice(startIdx, end);
  const hasHoriz = slice.includes("horizontal");
  const hasVert = slice.includes("vertical");
  const corners = slice.filter((p) => p.startsWith("corner-"));
  const uniqueCorners = new Set(corners);

  if (!hasHoriz && end > startIdx) queue[startIdx] = "horizontal";
  if (!hasVert && end > startIdx + 1) queue[startIdx + 1] = "vertical";
  if (uniqueCorners.size < 2 && end > startIdx + 2) {
    const allCorners: PipeType[] = ["corner-dr", "corner-dl", "corner-ur", "corner-ul"];
    queue[startIdx + 2] = rng.pick(allCorners);
    const remaining = allCorners.filter((c) => c !== queue[startIdx + 2]);
    if (end > startIdx + 3) queue[startIdx + 3] = rng.pick(remaining);
  }
}

// ===== BFS PATH CHECK =====

function hasPath(grid: PipeCell[][], start: [number, number], end: [number, number], gridSize: number): boolean {
  const visited = new Set<string>();
  const queue: [number, number][] = [start];
  visited.add(`${start[0]},${start[1]}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === end[0] && c === end[1]) return true;

    for (let d = 0; d < 4; d++) {
      const nr = r + DR[d];
      const nc = c + DC[d];
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && grid[nr][nc].state !== "blocked") {
          visited.add(key);
          queue.push([nr, nc]);
        }
      }
    }
  }
  return false;
}

// ===== LEVEL GENERATION =====

export function generateLevel(
  seed: number,
  difficulty: "easy" | "medium" | "hard",
  queueSize: number = 5
): ArcaneConduitState {
  const rng = createRNG(seed);
  const params = DIFFICULTY_PARAMS[difficulty];
  const gs = params.gridSize;

  // Initialize grid
  const grid: PipeCell[][] = Array.from({ length: gs }, () =>
    Array.from({ length: gs }, () => ({
      pipe: null,
      state: "empty" as CellState,
      flowFilled: false,
      flowProgress: 0,
      flowDirections: [],
      locked: false,
    }))
  );

  // Place source on a random edge
  const edge = rng.nextInt(0, 3); // 0=top, 1=right, 2=bottom, 3=left
  let sourceRow: number, sourceCol: number, sourceExitDir: number;

  switch (edge) {
    case 0: // top edge, flow goes down
      sourceRow = 0;
      sourceCol = rng.nextInt(1, gs - 2);
      sourceExitDir = 2; // down
      break;
    case 1: // right edge, flow goes left
      sourceRow = rng.nextInt(1, gs - 2);
      sourceCol = gs - 1;
      sourceExitDir = 3; // left
      break;
    case 2: // bottom edge, flow goes up
      sourceRow = gs - 1;
      sourceCol = rng.nextInt(1, gs - 2);
      sourceExitDir = 0; // up
      break;
    default: // left edge, flow goes right
      sourceRow = rng.nextInt(1, gs - 2);
      sourceCol = 0;
      sourceExitDir = 1; // right
      break;
  }

  grid[sourceRow][sourceCol].state = "source";

  // Place end crystal (Hard only) on opposite side
  let endCrystalPos: [number, number] | null = null;
  if (params.hasEndCrystal) {
    const oppositeEdge = (edge + 2) % 4;
    let ecRow: number, ecCol: number;
    switch (oppositeEdge) {
      case 0: ecRow = 0; ecCol = rng.nextInt(1, gs - 2); break;
      case 1: ecRow = rng.nextInt(1, gs - 2); ecCol = gs - 1; break;
      case 2: ecRow = gs - 1; ecCol = rng.nextInt(1, gs - 2); break;
      default: ecRow = rng.nextInt(1, gs - 2); ecCol = 0; break;
    }
    grid[ecRow][ecCol].state = "end-crystal";
    endCrystalPos = [ecRow, ecCol];
  }

  // Place blocked cells
  for (let i = 0; i < params.blockedCells; i++) {
    let attempts = 0;
    while (attempts < 40) {
      attempts++;
      const r = rng.nextInt(1, gs - 2);
      const c = rng.nextInt(1, gs - 2);
      if (grid[r][c].state !== "empty") continue;
      // Don't block near source
      if (Math.abs(r - sourceRow) + Math.abs(c - sourceCol) <= 2) continue;

      grid[r][c].state = "blocked";

      // Check path still exists (to end crystal if present, otherwise just verify we haven't boxed things in)
      if (endCrystalPos && !hasPath(grid, [sourceRow, sourceCol], endCrystalPos, gs)) {
        grid[r][c].state = "empty"; // undo
      } else {
        break;
      }
    }
  }

  // Place reservoir (Hard only)
  let reservoirPos: [number, number] | null = null;
  if (params.hasReservoir) {
    let attempts = 0;
    while (attempts < 40) {
      attempts++;
      const r = rng.nextInt(2, gs - 3);
      const c = rng.nextInt(2, gs - 3);
      if (grid[r][c].state !== "empty") continue;
      grid[r][c].state = "reservoir";
      reservoirPos = [r, c];
      break;
    }
  }

  // Generate pipe queue
  const queue = generateQueue(rng, queueSize);

  const initialFlowSpeed = getFlowSpeed(difficulty, 0);

  return {
    grid,
    gridSize: gs,
    difficulty,
    sourcePos: [sourceRow, sourceCol],
    sourceExitDir,
    endCrystalPos,
    reservoirPos,
    queue,
    queueSize,
    score: 0,
    segmentCount: 0,
    penalties: 0,
    flowActive: false,
    flowHead: null,
    flowTimer: 0,
    flowSpeed: initialFlowSpeed,
    baseFlowSpeed: initialFlowSpeed,
    initialDelay: params.flowDelay,
    delayTimer: params.flowDelay,
    gameOver: false,
    reachedEndCrystal: false,
    minSegments: params.minSegments,
    replaceCooldown: 0,
    lastReplaced: null,
  };
}

// ===== GAME ACTIONS =====

/**
 * Place the next pipe from the queue onto the grid.
 */
export function placePipe(
  state: ArcaneConduitState,
  row: number,
  col: number,
  rng: ReturnType<typeof createRNG>
): ArcaneConduitState {
  if (state.gameOver) return state;
  if (state.replaceCooldown > 0) return state;

  const cell = state.grid[row][col];

  // Can't place on special cells
  if (cell.state === "blocked" || cell.state === "source" || cell.state === "end-crystal") {
    return state;
  }

  // Can't replace locked (flow-entered) pipes
  if (cell.locked) return state;

  const s = deepCopyState(state);
  const nextPipe = s.queue.shift()!;
  s.lastReplaced = null;

  // Replacing an existing unused pipe
  if (s.grid[row][col].pipe !== null) {
    s.penalties++;
    s.score--;
    s.replaceCooldown = 0.3; // 300ms cooldown
    s.lastReplaced = [row, col];
  }

  s.grid[row][col].pipe = nextPipe;
  s.grid[row][col].flowFilled = false;
  s.grid[row][col].flowProgress = 0;
  s.grid[row][col].flowDirections = [];

  // Add new pipe to queue
  s.queue.push(generatePipe(rng));

  // Ensure variety every 7 pieces
  if (s.queue.length >= 7) {
    ensureVariety(s.queue, rng, s.queue.length - 7);
  }

  return s;
}

/**
 * Tick the game state forward by dt seconds.
 */
export function tickArcaneConduit(
  state: ArcaneConduitState,
  dt: number,
  rng: ReturnType<typeof createRNG>
): ArcaneConduitState {
  if (state.gameOver) return state;

  const s = deepCopyState(state);

  // Cooldown
  if (s.replaceCooldown > 0) {
    s.replaceCooldown = Math.max(0, s.replaceCooldown - dt);
  }

  // Initial delay
  if (!s.flowActive) {
    s.delayTimer -= dt;
    if (s.delayTimer <= 0) {
      s.flowActive = true;
      // Flow starts: first cell is adjacent to source in the exit direction
      const nr = s.sourcePos[0] + DR[s.sourceExitDir];
      const nc = s.sourcePos[1] + DC[s.sourceExitDir];
      s.flowHead = {
        row: nr,
        col: nc,
        enterDir: OPPOSITE[s.sourceExitDir],
      };
      s.flowTimer = s.flowSpeed;

      // Mark source as filled
      s.grid[s.sourcePos[0]][s.sourcePos[1]].flowFilled = true;
      s.grid[s.sourcePos[0]][s.sourcePos[1]].flowProgress = 1;
      s.grid[s.sourcePos[0]][s.sourcePos[1]].locked = true;
    }
    return s;
  }

  // Flow animation on current head
  if (s.flowHead) {
    const { row, col } = s.flowHead;
    if (row >= 0 && row < s.gridSize && col >= 0 && col < s.gridSize) {
      const cell = s.grid[row][col];
      if (cell.pipe && cell.flowFilled && cell.flowProgress < 1) {
        // Flow speed adjustment for reservoir
        let speed = s.flowSpeed;
        if (cell.state === "reservoir") speed *= 2; // half speed = double time
        cell.flowProgress = Math.min(1, cell.flowProgress + dt / speed);
      }
    }
  }

  // Flow timer
  s.flowTimer -= dt;
  if (s.flowTimer <= 0) {
    s.flowTimer += s.flowSpeed;

    // Advance flow
    if (s.flowHead) {
      const { row, col, enterDir } = s.flowHead;

      // Check bounds
      if (row < 0 || row >= s.gridSize || col < 0 || col >= s.gridSize) {
        s.gameOver = true;
        return s;
      }

      const cell = s.grid[row][col];

      // Check if there's a pipe that accepts flow from this direction
      if (!cell.pipe || !acceptsFlowFrom(cell.pipe, enterDir)) {
        s.gameOver = true;
        return s;
      }

      // Check if this direction was already used on this pipe
      const alreadyUsedThisDir = cell.flowDirections.includes(enterDir);

      if (!alreadyUsedThisDir) {
        // Fill this cell
        cell.flowFilled = true;
        cell.flowProgress = 0; // start animation
        cell.locked = true;
        cell.flowDirections.push(enterDir);
        s.segmentCount++;
        s.score++;

        // Cross bonus: if this is the second direction pair used
        if (cell.pipe === "cross" && cell.flowDirections.length > 1) {
          s.score += 3;
        }

        // Check end crystal
        if (s.endCrystalPos && row === s.endCrystalPos[0] && col === s.endCrystalPos[1]) {
          s.reachedEndCrystal = true;
          s.score += 5;
        }

        // Gradual flow speed ramp
        s.flowSpeed = getFlowSpeed(s.difficulty, s.segmentCount);
      }

      // Get exit direction
      const exitDir = getExitDirection(cell.pipe, enterDir);
      if (exitDir === -1) {
        s.gameOver = true;
        return s;
      }

      // Next cell
      const nextRow = row + DR[exitDir];
      const nextCol = col + DC[exitDir];
      s.flowHead = {
        row: nextRow,
        col: nextCol,
        enterDir: OPPOSITE[exitDir],
      };

      // Reservoir slowdown: double the timer for next step
      if (cell.state === "reservoir") {
        s.flowTimer += s.flowSpeed; // extra time
      }
    }
  }

  return s;
}

/**
 * Get cells that are 1-3 segments ahead of the flow and have open/missing pipes.
 * Used for the warning flash effect.
 */
export function getWarningCells(state: ArcaneConduitState): [number, number][] {
  if (!state.flowHead || state.gameOver) return [];

  const warnings: [number, number][] = [];
  let head = { ...state.flowHead };

  for (let i = 0; i < 3; i++) {
    const { row, col, enterDir } = head;
    if (row < 0 || row >= state.gridSize || col < 0 || col >= state.gridSize) break;

    const cell = state.grid[row][col];
    if (!cell.pipe || !acceptsFlowFrom(cell.pipe, enterDir)) {
      warnings.push([row, col]);
      break;
    }

    const exitDir = getExitDirection(cell.pipe, enterDir);
    if (exitDir === -1) break;

    const nextRow = row + DR[exitDir];
    const nextCol = col + DC[exitDir];
    head = { row: nextRow, col: nextCol, enterDir: OPPOSITE[exitDir] };
  }

  return warnings;
}

// ===== HELPERS =====

function deepCopyState(state: ArcaneConduitState): ArcaneConduitState {
  return {
    ...state,
    grid: state.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        flowDirections: [...cell.flowDirections],
      }))
    ),
    queue: [...state.queue],
    sourcePos: [...state.sourcePos] as [number, number],
    endCrystalPos: state.endCrystalPos ? [...state.endCrystalPos] as [number, number] : null,
    reservoirPos: state.reservoirPos ? [...state.reservoirPos] as [number, number] : null,
    flowHead: state.flowHead ? { ...state.flowHead } : null,
  };
}
