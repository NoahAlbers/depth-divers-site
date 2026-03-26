# Depth Divers

**A D&D campaign companion web app that turns your table into a connected experience.**

Depth Divers is an open-source web application built for tabletop RPG groups. It gives every player a connected screen at the table — enabling secret messaging, real-time initiative tracking, cooperative and competitive minigames, and tools that replace dice rolls with actual player skill.

Originally built for an Out of the Abyss campaign set in the Underdark, but designed to work with any D&D 5e game.

 **Live site**: [depthdivers.com](https://depthdivers.com)

---

## Features

### Messaging System
A full messaging platform with direct messages, group chats, and a shared pinboard per conversation. Supports in-character (IC) and out-of-character (OOC) message tagging, emoji reactions with personalized quick-access rows, read receipts, markdown formatting, and link previews. The DM has a god-mode view that sees all messages — including player-to-player private chats — without the players knowing.

### Initiative Tracker
Real-time combat initiative tracker with a three-phase system: the DM opens an encounter, players submit their own rolls, and the DM locks and sorts the order. Players see the live turn order on their phones. The DM advances turns, adds monsters, and resets encounters — all synced to every player's screen within seconds.

### Minigames & Puzzles
A game framework with a lobby system, DM-controlled launcher, and a growing library of D&D-themed games. Games run locally on each player's device with seeded randomness for competitive fairness, and player ability scores influence difficulty. Current games include:

- **Arcane Conduit** — Pipe Dream-style real-time pipe placement puzzle
- **Rune Echoes** — Simon-says sequence memory game
- **Glyph Race** — Warioware-style rapid-fire micro-puzzles (13 puzzle types across 4 categories)
- **Stalactite Storm** — Dodge falling obstacles in a collapsing cavern
- **Spider Swat** — 20-second tap frenzy micro-game
- **Defuse the Glyph** — Cooperative asymmetric information game (Keep Talking and Nobody Explodes style)
- **Lockpicking** — Guide a pick through a maze without touching walls
- **Stealth Sequence** — Sneak past patrolling guards on a beat-timed grid
- **Drinking Contest** — Rhythm game with progressive drunk visual effects
- **Underdark Telephone** — Gartic Phone-style drawing telephone game

### Seating Arrangements
Generates all valid seating arrangements based on configurable player constraints. The DM can lock a seating plan for the session so players know where they're sitting.

### Character Sheets
Players input their ability scores, skills, and character info. These stats feed into the game difficulty system — a rogue with high Sleight of Hand gets wider corridors in the lockpicking game, while a wizard with high Arcana gets extra setup time in Arcane Conduit.

### DM Area
A command center for the DM with quick tools: recap order randomizer, game launcher with full configuration, live message feed, seating controls, initiative controls, quick polls, countdown timers, and player impersonation for testing.

### Quick Polls & Countdown Timers
The DM can launch polls that pop up on all players' screens (un-dismissable until they vote) and dramatic countdown timers that persist in the navbar. Perfect for "left or right?" decisions and "the cave is collapsing in 5 minutes" moments.

### Push Notifications
Web Push API integration for real-time notifications on players' phones — new messages, game launches, initiative calls, and poll alerts.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14+ (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: PostgreSQL via [Neon](https://neon.tech/) + [Prisma](https://www.prisma.io/) ORM
- **Deployment**: [Vercel](https://vercel.com/)
- **Real-time**: Client-side polling (2-3 second intervals)
- **Push Notifications**: Web Push API with VAPID
- **Auth**: Bcrypt-hashed passwords, DM admin mode

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (we recommend [Neon](https://neon.tech/) — free tier works great)
- A [Vercel](https://vercel.com/) account (for deployment)

### Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/NoahAlbers/depth-divers-site.git
   cd depth-divers-site
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the project root:
   ```env
   POSTGRES_PRISMA_URL=your_neon_pooled_connection_string
   POSTGRES_URL_NON_POOLING=your_neon_direct_connection_string
   POSTGRES_URL=your_neon_pooled_connection_string
   DM_PASSWORD=your_dm_password
   NEXT_PUBLIC_ENVIRONMENT=dev
   
   # Optional: Push notifications
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_EMAIL=mailto:your@email.com
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Run the dev server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

Default player passwords are each player's name in lowercase. The DM password is whatever you set in `DM_PASSWORD`.

### Deployment

The project is designed for Vercel deployment:

1. Push to GitHub
2. Import the repo in Vercel
3. Add environment variables in Vercel dashboard
4. Provision a Neon Postgres database
5. Deploy

See [SETUP-MULTI-ENVIRONMENT.md](SETUP-MULTI-ENVIRONMENT.md) for setting up dev/demo/production environments with separate databases and subdomains.

---

## Customizing for Your Group

### Players

Edit `lib/players.ts` to configure your player list:

```typescript
export const PLAYERS = [
  { name: "Player1", short: "P1", color: "#e06c75" },
  { name: "Player2", short: "P2", color: "#61afef" },
  // ... add your players
] as const;

export const DM = { name: "YourName", short: "DM", color: "#ffffff" };
```

Then update the database with matching player entries (run the seed script or manually insert via SQL).

### Seating Constraints

Edit the seating generation logic in `lib/seating.ts` to match your table layout and player requirements.

### Taglines

The homepage displays rotating taglines themed to your campaign. Edit the `TAGLINES` array in `app/page.tsx` to customize them for your world.

### Games

Games are modular — each game is a self-contained React component in `components/games/` with its logic in `lib/games/`. To add a new game:

1. Create the game component in `components/games/your-game.tsx`
2. Create the game logic in `lib/games/your-game.ts`
3. Register it in `lib/games.ts`
4. Add launch configuration in the game launcher

---

## Project Structure

```
app/
  page.tsx              — Homepage with rotating taglines
  layout.tsx            — Root layout, nav, fonts, providers
  messages/             — Messaging system
  initiative/           — Initiative tracker
  games/                — Game lobby and active games
  seating/              — Seating arrangement tool
  character/            — Character sheet page
  dm/                   — DM Area (admin tools)
  notifications/        — Push notification settings
  api/                  — API routes
components/
  nav.tsx               — Navigation bar
  messaging/            — Chat UI components
  games/                — Game components (one per game)
  dm/                   — DM Area components
lib/
  players.ts            — Player configuration
  seating.ts            — Seating arrangement logic
  games/                — Game logic modules
  games.ts              — Game registry
  polling.ts            — Polling hook
  push.ts               — Push notification helpers
  player-context.tsx    — Auth context
  player-colors-context.tsx — Dynamic player colors
prisma/
  schema.prisma         — Database schema
  seed.ts               — Database seeder
public/
  sw.js                 — Service worker
  manifest.json         — PWA manifest
  icons/                — App icons
```

---

## Contributing

Contributions are welcome! This is an open-source project built for the D&D community.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Submit a pull request

### Adding New Games

The game framework is designed to be extensible. If you build a cool minigame for your table, consider contributing it back! See the existing games in `components/games/` for the pattern to follow. Every game implements the same `GameComponentProps` interface:

```typescript
interface GameComponentProps {
  seed: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
  config?: Record<string, unknown>;
}
```

### Ideas for New Games

- Lockpicking with physical lock simulation
- Arm wrestling (rapid tap competition)
- Campaign trivia quiz
- NPC relationship deduction game
- Shared puzzle board with per-player controls
- Chase sequence (cooperative endless runner)

---

## License

This project is open source. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built with love for the Depth Divers D&D group and the broader tabletop RPG community.

Made possible by [Next.js](https://nextjs.org/), [Vercel](https://vercel.com/), [Neon](https://neon.tech/), [Prisma](https://www.prisma.io/), and [Tailwind CSS](https://tailwindcss.com/).

*"Trust nothing that glows."*
