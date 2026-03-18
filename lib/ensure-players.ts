import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { PLAYERS, DM } from "./players";

const DEFAULT_PLAYERS = [
  ...PLAYERS.map((p) => ({ name: p.name, password: p.name.toLowerCase() })),
  { name: DM.name, password: "noah" },
];

let seeded = false;

export async function ensurePlayersExist() {
  if (seeded) return;

  try {
    const count = await prisma.player.count();
    if (count >= DEFAULT_PLAYERS.length) {
      seeded = true;
      return;
    }

    for (const p of DEFAULT_PLAYERS) {
      const exists = await prisma.player.findUnique({ where: { name: p.name } });
      if (!exists) {
        const hashed = await bcrypt.hash(p.password, 10);
        await prisma.player.create({ data: { name: p.name, password: hashed } });
      }
    }
    seeded = true;
  } catch {
    // DB might not be migrated yet — silently fail
  }
}
