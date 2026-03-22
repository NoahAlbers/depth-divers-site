import { createRNG } from "./seeded-random";

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 400;

export interface MazeCell {
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
}

export interface SpringPin {
  row: number;
  col: number;
  direction: "horizontal" | "vertical";
  offset: number; // current position offset
  speed: number;
  range: number;
}

export interface LockpickingState {
  pickX: number;
  pickY: number;
  startX: number;
  startY: number;
  exitX: number;
  exitY: number;
  strikes: number;
  maxStrikes: number;
  alive: boolean;
  won: boolean;
  startTime: number;
  elapsedTime: number;
  strikeFlash: number; // countdown for red flash
}

export interface MazeConfig {
  gridCols: number;
  gridRows: number;
  corridorWidth: number;
  wallThickness: number;
  springPins: SpringPin[];
}

export function getMazeConfig(
  difficulty: "easy" | "medium" | "hard",
  seed: number
): MazeConfig {
  const rng = createRNG(seed + 9999);
  const pins: SpringPin[] = [];

  if (difficulty === "easy") {
    return { gridCols: 6, gridRows: 6, corridorWidth: 24, wallThickness: 4, springPins: [] };
  } else if (difficulty === "medium") {
    // 1-2 spring pins
    for (let i = 0; i < 2; i++) {
      pins.push({
        row: rng.nextInt(1, 6),
        col: rng.nextInt(1, 6),
        direction: rng.next() > 0.5 ? "horizontal" : "vertical",
        offset: 0,
        speed: 20 + rng.nextInt(0, 15),
        range: 8,
      });
    }
    return { gridCols: 8, gridRows: 8, corridorWidth: 16, wallThickness: 3, springPins: pins };
  } else {
    for (let i = 0; i < 4; i++) {
      pins.push({
        row: rng.nextInt(1, 8),
        col: rng.nextInt(1, 8),
        direction: rng.next() > 0.5 ? "horizontal" : "vertical",
        offset: 0,
        speed: 25 + rng.nextInt(0, 25),
        range: 10,
      });
    }
    return { gridCols: 10, gridRows: 10, corridorWidth: 10, wallThickness: 3, springPins: pins };
  }
}

/**
 * Generate a maze using recursive backtracking.
 */
export function generateMaze(
  rows: number,
  cols: number,
  seed: number
): MazeCell[][] {
  const rng = createRNG(seed);
  const grid: MazeCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      walls: { top: true, right: true, bottom: true, left: true },
    }))
  );

  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );

  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  const directions = [
    { dr: -1, dc: 0, wall: "top" as const, opposite: "bottom" as const },
    { dr: 0, dc: 1, wall: "right" as const, opposite: "left" as const },
    { dr: 1, dc: 0, wall: "bottom" as const, opposite: "top" as const },
    { dr: 0, dc: -1, wall: "left" as const, opposite: "right" as const },
  ];

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const unvisited = directions.filter(({ dr, dc }) => {
      const nr = r + dr;
      const nc = c + dc;
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc];
    });

    if (unvisited.length === 0) {
      stack.pop();
      continue;
    }

    const dir = rng.pick(unvisited);
    const nr = r + dir.dr;
    const nc = c + dir.dc;

    grid[r][c].walls[dir.wall] = false;
    grid[nr][nc].walls[dir.opposite] = false;
    visited[nr][nc] = true;
    stack.push([nr, nc]);
  }

  return grid;
}

/**
 * Convert maze grid coordinates to pixel coordinates.
 */
export function cellToPixel(
  row: number,
  col: number,
  config: MazeConfig
): { x: number; y: number } {
  const cellW = GAME_WIDTH / config.gridCols;
  const cellH = GAME_HEIGHT / config.gridRows;
  return {
    x: col * cellW + cellW / 2,
    y: row * cellH + cellH / 2,
  };
}

/**
 * Check if a point collides with any maze wall.
 */
export function checkWallCollision(
  px: number,
  py: number,
  pickRadius: number,
  maze: MazeCell[][],
  config: MazeConfig
): boolean {
  const cellW = GAME_WIDTH / config.gridCols;
  const cellH = GAME_HEIGHT / config.gridRows;
  const wt = config.wallThickness;

  for (let r = 0; r < config.gridRows; r++) {
    for (let c = 0; c < config.gridCols; c++) {
      const x = c * cellW;
      const y = r * cellH;
      const cell = maze[r][c];

      // Check each wall as a thin rectangle
      if (cell.walls.top && rectCircleCollision(x, y, cellW, wt, px, py, pickRadius)) return true;
      if (cell.walls.bottom && rectCircleCollision(x, y + cellH - wt, cellW, wt, px, py, pickRadius)) return true;
      if (cell.walls.left && rectCircleCollision(x, y, wt, cellH, px, py, pickRadius)) return true;
      if (cell.walls.right && rectCircleCollision(x + cellW - wt, y, wt, cellH, px, py, pickRadius)) return true;
    }
  }

  // Outer boundaries
  if (px - pickRadius < 0 || px + pickRadius > GAME_WIDTH) return true;
  if (py - pickRadius < 0 || py + pickRadius > GAME_HEIGHT) return true;

  return false;
}

function rectCircleCollision(
  rx: number, ry: number, rw: number, rh: number,
  cx: number, cy: number, cr: number
): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < cr * cr;
}
