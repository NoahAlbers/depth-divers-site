import { createRNG } from "./seeded-random";

export const GAME_DURATION = 20; // seconds
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 500;

export type CreatureType = "spider" | "glowing" | "scuttler" | "swarm" | "mushroom";

export interface Creature {
  id: number;
  type: CreatureType;
  x: number;
  y: number;
  size: number;
  lifespan: number; // seconds before disappearing
  age: number; // seconds since spawn
  alive: boolean;
  points: number;
  speedX: number; // for scuttlers
  speedY: number;
}

export interface SpiderSwatState {
  creatures: Creature[];
  score: number;
  time: number; // elapsed seconds
  spawnAccumulator: number;
  nextId: number;
  gameOver: boolean;
}

export function createInitialState(): SpiderSwatState {
  return {
    creatures: [],
    score: 0,
    time: 0,
    spawnAccumulator: 0,
    nextId: 1,
    gameOver: false,
  };
}

function getSpawnInterval(elapsed: number): number {
  // 0.8s at start, down to 0.3s at end
  const progress = elapsed / GAME_DURATION;
  return 0.8 - progress * 0.5;
}

function spawnCreature(
  rng: ReturnType<typeof createRNG>,
  nextId: number
): Creature {
  const roll = rng.next();
  let type: CreatureType;
  let size: number;
  let lifespan: number;
  let points: number;
  let speedX = 0;
  let speedY = 0;

  if (roll < 0.60) {
    type = "spider";
    size = 30 + rng.nextInt(0, 10);
    lifespan = 1.5;
    points = 1;
  } else if (roll < 0.75) {
    type = "glowing";
    size = 25 + rng.nextInt(0, 8);
    lifespan = 0.8;
    points = 3;
  } else if (roll < 0.85) {
    type = "scuttler";
    size = 28 + rng.nextInt(0, 8);
    lifespan = 2.0;
    points = 5;
    speedX = (rng.next() > 0.5 ? 1 : -1) * (60 + rng.nextInt(0, 40));
    speedY = (rng.next() > 0.5 ? 1 : -1) * (30 + rng.nextInt(0, 20));
  } else if (roll < 0.95) {
    type = "swarm";
    size = 18;
    lifespan = 1.0;
    points = 1;
  } else {
    type = "mushroom";
    size = 28 + rng.nextInt(0, 10);
    lifespan = 1.5;
    points = -3;
  }

  const margin = size;
  const x = rng.nextInt(margin, GAME_WIDTH - margin);
  const y = rng.nextInt(margin, GAME_HEIGHT - margin);

  return {
    id: nextId,
    type,
    x,
    y,
    size,
    lifespan,
    age: 0,
    alive: true,
    points,
    speedX,
    speedY,
  };
}

export function tickSpiderSwat(
  state: SpiderSwatState,
  dt: number,
  rng: ReturnType<typeof createRNG>
): SpiderSwatState {
  if (state.gameOver) return state;

  const s = { ...state };
  s.time += dt;

  if (s.time >= GAME_DURATION) {
    s.gameOver = true;
    return s;
  }

  // Spawn creatures
  s.spawnAccumulator += dt;
  const interval = getSpawnInterval(s.time);
  while (s.spawnAccumulator >= interval) {
    s.spawnAccumulator -= interval;
    s.creatures = [...s.creatures, spawnCreature(rng, s.nextId++)];
  }

  // Update creatures
  s.creatures = s.creatures
    .map((c) => ({
      ...c,
      age: c.age + dt,
      x: c.x + c.speedX * dt,
      y: c.y + c.speedY * dt,
    }))
    .filter((c) => c.alive && c.age < c.lifespan);

  return s;
}

export function handleTap(
  state: SpiderSwatState,
  tapX: number,
  tapY: number
): SpiderSwatState {
  if (state.gameOver) return state;

  const s = { ...state };

  // Find the nearest alive creature within tap range
  for (let i = s.creatures.length - 1; i >= 0; i--) {
    const c = s.creatures[i];
    if (!c.alive) continue;

    const dx = tapX - c.x;
    const dy = tapY - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= c.size) {
      s.score += c.points;
      s.creatures = s.creatures.map((cr, idx) =>
        idx === i ? { ...cr, alive: false } : cr
      );
      break; // Only hit one creature per tap
    }
  }

  return s;
}
