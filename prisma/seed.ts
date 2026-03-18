import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PLAYERS = [
  { name: "Mykolov", password: "mykolov" },
  { name: "Brent", password: "brent" },
  { name: "Justin", password: "justin" },
  { name: "Eric", password: "eric" },
  { name: "Matthew", password: "matthew" },
  { name: "Noah", password: "noah" },
];

async function main() {
  for (const player of PLAYERS) {
    const hashed = await bcrypt.hash(player.password, 10);
    await prisma.player.upsert({
      where: { name: player.name },
      update: {},
      create: { name: player.name, password: hashed },
    });
    console.log(`Upserted player: ${player.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
