import { createRNG } from "./seeded-random";

export const TICK_RATE = 1000 / 60; // ~16.67ms per tick
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 36;
export const PLAYER_Y = GAME_HEIGHT - 55;

export type ObstacleType = "stalactite" | "bolt" | "debris";

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  speedY: number;
  speedX: number; // non-zero for bolts
  type: ObstacleType;
}

export interface GameState {
  playerX: number;
  obstacles: Obstacle[];
  survivalTime: number;
  alive: boolean;
  spawnAccumulator: number;
  speedMultiplier: number;
  tickCount: number;
}

export interface DifficultyConfig {
  baseSpeed: number;
  spawnInterval: number; // seconds between spawns
  speedRampPercent: number; // % increase every ramp interval
  speedRampInterval: number; // seconds between ramp-ups
}

export function getDifficultyConfig(
  difficulty: "easy" | "medium" | "hard"
): DifficultyConfig {
  switch (difficulty) {
    case "easy":
      return { baseSpeed: 120, spawnInterval: 1.0, speedRampPercent: 10, speedRampInterval: 15 };
    case "medium":
      return { baseSpeed: 160, spawnInterval: 0.7, speedRampPercent: 12, speedRampInterval: 12 };
    case "hard":
      return { baseSpeed: 200, spawnInterval: 0.45, speedRampPercent: 15, speedRampInterval: 10 };
  }
}

export function createInitialState(): GameState {
  return {
    playerX: GAME_WIDTH / 2,
    obstacles: [],
    survivalTime: 0,
    alive: true,
    spawnAccumulator: 0,
    speedMultiplier: 1.0,
    tickCount: 0,
  };
}

function spawnObstacle(
  rng: ReturnType<typeof createRNG>,
  config: DifficultyConfig,
  speedMult: number
): Obstacle {
  const roll = rng.next();
  let type: ObstacleType;
  let width: number;
  let height: number;
  let speedX = 0;

  if (roll < 0.60) {
    // Stalactite — falls straight down
    type = "stalactite";
    width = 18 + rng.nextInt(0, 14);
    height = 24 + rng.nextInt(0, 20);
  } else if (roll < 0.85) {
    // Faerzress bolt — falls at an angle
    type = "bolt";
    width = 12 + rng.nextInt(0, 8);
    height = 12 + rng.nextInt(0, 8);
    speedX = (rng.next() > 0.5 ? 1 : -1) * (40 + rng.nextInt(0, 60)) * speedMult;
  } else {
    // Cave debris — wider
    type = "debris";
    width = 40 + rng.nextInt(0, 30);
    height = 16 + rng.nextInt(0, 10);
  }

  const x = rng.nextInt(Math.floor(width / 2), Math.floor(GAME_WIDTH - width / 2));
  const baseSpeedY = config.baseSpeed * speedMult * (0.85 + rng.next() * 0.3);

  return {
    x,
    y: -height - rng.nextInt(0, 30),
    width,
    height,
    speedY: baseSpeedY,
    speedX,
    type,
  };
}

/**
 * Fixed-timestep game tick. Runs at exactly 60Hz.
 * Same seed + same inputs = identical results on every device.
 */
export function tick(
  state: GameState,
  input: { targetX: number },
  rng: ReturnType<typeof createRNG>,
  config: DifficultyConfig
): GameState {
  if (!state.alive) return state;

  const dt = TICK_RATE / 1000; // convert to seconds
  const s = { ...state };

  s.tickCount++;
  s.survivalTime += dt;

  // Speed ramp: increase every rampInterval seconds
  s.speedMultiplier = 1.0 + Math.floor(s.survivalTime / config.speedRampInterval) * (config.speedRampPercent / 100);

  // Move player toward target
  const playerSpeed = 500;
  const diff = input.targetX - s.playerX;
  const maxMove = playerSpeed * dt;
  if (Math.abs(diff) > maxMove) {
    s.playerX += Math.sign(diff) * maxMove;
  } else {
    s.playerX = input.targetX;
  }
  s.playerX = Math.max(PLAYER_WIDTH / 2, Math.min(GAME_WIDTH - PLAYER_WIDTH / 2, s.playerX));

  // Spawn obstacles
  s.spawnAccumulator += dt;
  const spawnInterval = config.spawnInterval / s.speedMultiplier;
  while (s.spawnAccumulator >= spawnInterval) {
    s.spawnAccumulator -= spawnInterval;
    s.obstacles = [...s.obstacles, spawnObstacle(rng, config, s.speedMultiplier)];
  }

  // Move obstacles
  s.obstacles = s.obstacles
    .map((o) => ({
      ...o,
      y: o.y + o.speedY * dt,
      x: o.x + o.speedX * dt,
    }))
    .filter((o) => o.y < GAME_HEIGHT + 60 && o.x > -60 && o.x < GAME_WIDTH + 60);

  // Collision detection (AABB with slightly forgiving hitbox)
  const hitboxShrink = 4; // pixels smaller on each side
  const px1 = s.playerX - PLAYER_WIDTH / 2 + hitboxShrink;
  const px2 = s.playerX + PLAYER_WIDTH / 2 - hitboxShrink;
  const py1 = PLAYER_Y + hitboxShrink;
  const py2 = PLAYER_Y + PLAYER_HEIGHT - hitboxShrink;

  for (const o of s.obstacles) {
    const ox1 = o.x - o.width / 2;
    const ox2 = o.x + o.width / 2;
    const oy1 = o.y;
    const oy2 = o.y + o.height;

    if (px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1) {
      s.alive = false;
      break;
    }
  }

  return s;
}
