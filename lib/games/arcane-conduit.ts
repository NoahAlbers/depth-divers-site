import { createRNG } from "./seeded-random";

// Pipe connections: which directions each tile type connects in its base rotation (0)
// Directions: 0=up, 1=right, 2=down, 3=left
export type TileType = "straight" | "corner" | "tee" | "cross";

const TILE_CONNECTIONS: Record<TileType, number[]> = {
  straight: [0, 2],    // up-down
  corner: [0, 1],      // up-right
  tee: [0, 1, 2],      // up-right-down
  cross: [0, 1, 2, 3], // all four
};

export interface Tile {
  type: TileType;
  rotation: number; // 0, 1, 2, 3 (each = 90° clockwise)
  row: number;
  col: number;
  isSource: boolean;
  isTarget: boolean;
}

export interface Grid {
  rows: number;
  cols: number;
  tiles: Tile[][];
}

const OPPOSITE: Record<number, number> = { 0: 2, 1: 3, 2: 0, 3: 1 };
const DR = [-1, 0, 1, 0]; // direction row offsets: up, right, down, left
const DC = [0, 1, 0, -1];

function getConnections(tile: Tile): number[] {
  const base = TILE_CONNECTIONS[tile.type];
  return base.map((d) => (d + tile.rotation) % 4);
}

function connects(tile: Tile, direction: number): boolean {
  return getConnections(tile).includes(direction);
}

/**
 * Generate a solvable pipe grid.
 * Algorithm:
 * 1. Create a spanning tree via random walk from source to fill grid
 * 2. Assign tile types based on which neighbors are connected
 * 3. Randomize rotations for the puzzle
 */
export function generateGrid(
  seed: number,
  difficulty: "easy" | "medium" | "hard"
): Grid {
  const rng = createRNG(seed);
  const size = difficulty === "easy" ? 5 : difficulty === "medium" ? 7 : 9;
  const rows = size;
  const cols = size;

  // Build a spanning tree via randomized DFS
  const connected: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  );
  // Track which directions each cell connects to its neighbors
  const links: number[][][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [])
  );

  const stack: [number, number][] = [[0, 0]];
  connected[0][0] = true;

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const dirs = rng.shuffle([0, 1, 2, 3]);
    let found = false;

    for (const d of dirs) {
      const nr = r + DR[d];
      const nc = c + DC[d];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !connected[nr][nc]) {
        connected[nr][nc] = true;
        links[r][c].push(d);
        links[nr][nc].push(OPPOSITE[d]);
        stack.push([nr, nc]);
        found = true;
        break;
      }
    }

    if (!found) stack.pop();
  }

  // Assign tile types based on connection count
  const tiles: Tile[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const conns = links[r][c].sort();
      let type: TileType;
      let solvedRotation = 0;

      if (conns.length === 4) {
        type = "cross";
        solvedRotation = 0;
      } else if (conns.length === 3) {
        type = "tee";
        // Tee base connects 0,1,2 (up,right,down). Find rotation so base matches.
        // The "missing" direction determines rotation
        const missing = [0, 1, 2, 3].find((d) => !conns.includes(d))!;
        // Tee's missing direction in base is 3 (left). Rotate so missing aligns.
        solvedRotation = (missing - 3 + 4) % 4;
      } else if (conns.length === 2) {
        const [a, b] = conns;
        if ((a + 2) % 4 === b) {
          // Opposite directions = straight
          type = "straight";
          solvedRotation = a % 2 === 0 ? 0 : 1;
        } else {
          // Adjacent directions = corner
          type = "corner";
          // Corner base connects 0,1 (up,right). Find rotation.
          // We need the smallest direction in the pair, then rotate
          if ((a === 0 && b === 1) || (a === 1 && b === 0)) solvedRotation = 0;
          else if ((a === 1 && b === 2) || (a === 2 && b === 1)) solvedRotation = 1;
          else if ((a === 2 && b === 3) || (a === 3 && b === 2)) solvedRotation = 2;
          else solvedRotation = 3; // 3,0
        }
      } else {
        // 1 connection (leaf) or 0 — treat as straight pointing to the connection
        type = "straight";
        solvedRotation = conns.length > 0 ? (conns[0] % 2 === 0 ? 0 : 1) : 0;
      }

      // Randomize rotation for the puzzle
      const randomRotation = rng.nextInt(0, 3);

      return {
        type,
        rotation: randomRotation,
        row: r,
        col: c,
        isSource: r === 0 && c === 0,
        isTarget: r === rows - 1 && c === cols - 1,
      };
    })
  );

  // Store solved rotations as metadata so we can verify
  // We need to re-derive them for checkSolved instead

  return { rows, cols, tiles };
}

/**
 * Check if the grid is solved — flood fill from source through connected pipes.
 */
export function checkSolved(grid: Grid): boolean {
  const visited: boolean[][] = Array.from({ length: grid.rows }, () =>
    Array(grid.cols).fill(false)
  );

  const queue: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const tile = grid.tiles[r][c];

    for (const dir of getConnections(tile)) {
      const nr = r + DR[dir];
      const nc = c + DC[dir];

      if (nr < 0 || nr >= grid.rows || nc < 0 || nc >= grid.cols) continue;
      if (visited[nr][nc]) continue;

      const neighbor = grid.tiles[nr][nc];
      // Check if neighbor connects back
      if (connects(neighbor, OPPOSITE[dir])) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }

  return visited[grid.rows - 1][grid.cols - 1];
}

/**
 * Get all cells reachable from source (for visual energy flow).
 */
export function getConnectedCells(grid: Grid): boolean[][] {
  const visited: boolean[][] = Array.from({ length: grid.rows }, () =>
    Array(grid.cols).fill(false)
  );

  const queue: [number, number][] = [[0, 0]];
  visited[0][0] = true;

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const tile = grid.tiles[r][c];

    for (const dir of getConnections(tile)) {
      const nr = r + DR[dir];
      const nc = c + DC[dir];

      if (nr < 0 || nr >= grid.rows || nc < 0 || nc >= grid.cols) continue;
      if (visited[nr][nc]) continue;

      const neighbor = grid.tiles[nr][nc];
      if (connects(neighbor, OPPOSITE[dir])) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }

  return visited;
}
