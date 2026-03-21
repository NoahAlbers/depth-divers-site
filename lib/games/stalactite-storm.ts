import { createRNG } from "./seeded-random";

export const TICK_RATE = 1 / 60; // 60 ticks per second
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const PLAYER_WIDTH = 30;
export const PLAYER_HEIGHT = 40;
export const PLAYER_Y = GAME_HEIGHT - 60;

export interface Stalactite {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface GameState {
  playerX: number;
  stalactites: Stalactite[];
  survivalTime: number;
  alive: boolean;
  spawnTimer: number;
  difficultyMult: number;
}

export interface DifficultyConfig {
  baseSpeed: number;
  spawnInterval: number;
  minGap: number;
  stalactiteWidth: number;
  speedRamp: number; // speed increase per second
}

export function getDifficultyConfig(
  difficulty: "easy" | "medium" | "hard"
): DifficultyConfig {
  switch (difficulty) {
    case "easy":
      return {
        baseSpeed: 150,
        spawnInterval: 1.2,
        minGap: 80,
        stalactiteWidth: 25,
        speedRamp: 3,
      };
    case "medium":
      return {
        baseSpeed: 200,
        spawnInterval: 0.8,
        minGap: 60,
        stalactiteWidth: 30,
        speedRamp: 5,
      };
    case "hard":
      return {
        baseSpeed: 260,
        spawnInterval: 0.5,
        minGap: 45,
        stalactiteWidth: 35,
        speedRamp: 8,
      };
  }
}

export function createInitialState(): GameState {
  return {
    playerX: GAME_WIDTH / 2,
    stalactites: [],
    survivalTime: 0,
    alive: true,
    spawnTimer: 0,
    difficultyMult: 1,
  };
}

/**
 * Fixed-timestep game tick. Runs at exactly 60Hz regardless of frame rate.
 * Same seed + same inputs = identical results on every device.
 */
export function tick(
  state: GameState,
  input: { targetX: number },
  rng: ReturnType<typeof createRNG>,
  config: DifficultyConfig
): GameState {
  if (!state.alive) return state;

  const dt = TICK_RATE;
  const newState = { ...state };

  // Update survival time
  newState.survivalTime += dt;
  newState.difficultyMult = 1 + newState.survivalTime * config.speedRamp / 100;

  // Move player towards target (smooth)
  const playerSpeed = 600; // px/sec
  const diff = input.targetX - newState.playerX;
  const maxMove = playerSpeed * dt;
  if (Math.abs(diff) > maxMove) {
    newState.playerX += Math.sign(diff) * maxMove;
  } else {
    newState.playerX = input.targetX;
  }

  // Clamp player within bounds
  newState.playerX = Math.max(
    PLAYER_WIDTH / 2,
    Math.min(GAME_WIDTH - PLAYER_WIDTH / 2, newState.playerX)
  );

  // Spawn stalactites
  newState.spawnTimer += dt;
  const spawnInterval = config.spawnInterval / newState.difficultyMult;

  if (newState.spawnTimer >= spawnInterval) {
    newState.spawnTimer -= spawnInterval;

    const width = config.stalactiteWidth + rng.nextInt(-5, 10);
    const height = 20 + rng.nextInt(0, 30);
    const x = rng.nextInt(width, GAME_WIDTH - width);
    const speed =
      config.baseSpeed * newState.difficultyMult * (0.8 + rng.next() * 0.4);

    newState.stalactites = [
      ...newState.stalactites,
      { x, y: -height, width, height, speed },
    ];
  }

  // Move stalactites
  newState.stalactites = newState.stalactites
    .map((s) => ({ ...s, y: s.y + s.speed * dt }))
    .filter((s) => s.y < GAME_HEIGHT + 50); // Remove off-screen

  // Collision detection (AABB)
  const px = newState.playerX - PLAYER_WIDTH / 2;
  const py = PLAYER_Y;

  for (const s of newState.stalactites) {
    const sx = s.x - s.width / 2;
    const sy = s.y;

    if (
      px < sx + s.width &&
      px + PLAYER_WIDTH > sx &&
      py < sy + s.height &&
      py + PLAYER_HEIGHT > sy
    ) {
      newState.alive = false;
      break;
    }
  }

  return newState;
}
