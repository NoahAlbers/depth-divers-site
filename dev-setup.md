# Task: Set Up Dev Database

**Repo**: https://github.com/NoahAlbers/depth-divers-site
**Branch**: `dev`

---

## What to Do

The dev environment is set up on Vercel pointing to a fresh Neon database branch. The database is empty — no tables, no data. You need to:

1. **Switch to the `dev` branch** if not already on it
2. **Push the Prisma schema to the dev database** to create all tables:
   ```bash
   npx prisma db push
   ```
   This reads the current `prisma/schema.prisma` and creates all tables in the dev database. The dev database connection strings are already configured in the Vercel environment variables, but for this CLI command you'll need them locally. Create a temporary `.env` file (or `.env.local`) with:
   ```
   POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_rqgjQy5xl0Ho@ep-blue-pine-amb8bhu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_rqgjQy5xl0Ho@ep-blue-pine-amb8bhu8.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   POSTGRES_URL=postgresql://neondb_owner:npg_rqgjQy5xl0Ho@ep-blue-pine-amb8bhu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   DM_PASSWORD=noah
   NEXT_PUBLIC_ENVIRONMENT=dev
   ```
   **IMPORTANT**: Do NOT commit this `.env` file. Delete it after seeding, or make sure it's in `.gitignore`.

3. **Run the seed script** to populate the Players table with all 7 players (6 players + DM Noah) with their default bcrypt-hashed passwords:
   ```bash
   npx prisma db seed
   ```
   This should run `prisma/seed.ts` which creates the player entries. If the seed script doesn't exist or doesn't work, create the players manually by running this in a Node script or via Prisma:
   ```typescript
   import { PrismaClient } from "@prisma/client";
   import bcrypt from "bcryptjs";
   
   const prisma = new PrismaClient();
   
   const PLAYERS = [
     { name: "Mykolov", password: "mykolov" },
     { name: "Brent", password: "brent" },
     { name: "Jonathan", password: "jonathan" },
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
     .then(() => console.log("Seeding complete"))
     .catch((e) => console.error(e))
     .finally(() => prisma.$disconnect());
   ```
   Note: the player name is "Jonathan" (not "Johnathan").

4. **Verify the setup** by running:
   ```bash
   npx prisma studio
   ```
   This opens a browser UI where you can see all tables and confirm the Player table has 7 entries with hashed passwords.

5. **Clean up**: Remove the temporary `.env` file if you created one, or ensure it's in `.gitignore` and won't be committed.

6. **Add the environment banner**: If not already present, add a dev environment indicator to the site. In the root layout or nav component, check `process.env.NEXT_PUBLIC_ENVIRONMENT`:
   - If `"dev"`: render a fixed banner at the very top of the page (above the nav): 
     ```tsx
     {process.env.NEXT_PUBLIC_ENVIRONMENT === "dev" && (
       <div className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white text-xs text-center py-1 font-bold">
         🔧 DEV ENVIRONMENT
       </div>
     )}
     ```
   - Add matching top padding to the body/main content so the banner doesn't overlap the nav
   - If `"production"` or undefined: show nothing
   - Commit this change to the `dev` branch

7. **Test**: Visit `dev.depthdivers.com` (once DNS propagates and Vercel deploys). Verify:
   - The red "DEV ENVIRONMENT" banner shows at the top
   - You can log in as any player (password = their lowercase name)
   - You can log in as DM (Noah, password: noah)
   - The site functions normally (messages, initiative, games, etc.)
   - The data is separate from production (no production messages or game history should appear)