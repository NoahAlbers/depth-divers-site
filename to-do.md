PRD: D&D Group Hub — Web Application
Overview
Build a Next.js web application that serves as a central hub for our D&D group. The site will be deployed on Vercel under a custom domain. It should feel like a themed, polished D&D companion — not a generic dashboard. The vibe is dark fantasy with warm accents (golds, ambers, parchment tones on dark backgrounds).
The site has 6 players: Mykolov, Brent, Johnathan, Justin, Eric, Matthew.
The DM is Noah.

Tech Stack

Framework: Next.js 14+ (App Router)
Language: TypeScript
Styling: Tailwind CSS
Database: Vercel Postgres (via @vercel/postgres) with Prisma ORM
Real-time: Client-side polling (2–3 second intervals on active pages)
Fonts: Cinzel (Google Fonts) for headings, JetBrains Mono for data/UI
Deployment: Vercel
Auth: Minimal — DM password protection on DM-only features; players select name from dropdown (honor system)


Global Design Requirements

Dark theme throughout (#0d1117 or similar deep dark background)
Gold/amber accent color (#e5c07b) for headings, borders, highlights
Each player has a consistent assigned color used across ALL tools:

Mykolov: #e06c75 (red)
Brent: #61afef (blue)
Johnathan: #e5c07b (gold)
Justin: #98c379 (green)
Eric: #c678dd (purple)
Matthew: #d19a66 (orange)
Noah (DM): #ffffff (white)


Responsive design — must work well on mobile (players will check on phones at the table)
Shared nav bar across all pages with the site name and links to each tool
Subtle CSS animations and transitions (hover states, card reveals, staggered entrances)
Player identity: On first visit, a player selects their name from a dropdown. Store the selection in localStorage so they don't have to pick every time. Show a small "Logged in as [Name]" indicator in the nav with an option to switch.


Authentication Model
There is no full auth system. This is a private site for friends.

Players: Select their name from a dropdown (honor system). Stored in localStorage.
DM (Noah): Certain features are DM-only (viewing all messages, resetting initiative, managing encounters). DM mode is accessed by entering a password.

DM password: noah
Store DM auth in localStorage after entry so Noah doesn't re-enter it every page load
DM-only controls should be hidden (not just disabled) from regular players
A small "DM Mode" toggle or link in the nav/footer for Noah to authenticate




Real-Time Strategy
Use client-side polling for all real-time features. This keeps the stack simple with no extra services.

Active pages (messaging, initiative) poll their respective API endpoints every 2–3 seconds
Only poll when the browser tab is active (use document.visibilityState to pause polling on hidden tabs)
API routes return JSON with a lastUpdated timestamp; client can skip re-rendering if nothing changed
Polling interval can be a shared constant (e.g., POLL_INTERVAL_MS = 2500)


Database Schema (Prisma)
prismamodel Message {
  id        String   @id @default(cuid())
  from      String   // player or "DM" 
  to        String   // player name, "DM", or "ALL" for group messages
  body      String
  createdAt DateTime @default(now())
}

model Initiative {
  id        String   @id @default(cuid())
  name      String   // player name or monster name
  roll      Int      // initiative value
  isPlayer  Boolean  @default(true)
  isActive  Boolean  @default(false) // whose turn it is
  order     Int      @default(0)     // sort order
  createdAt DateTime @default(now())
}

model InitiativeState {
  id        String   @id @default("singleton")
  round     Int      @default(1)
  isActive  Boolean  @default(false) // is an encounter running?
  updatedAt DateTime @updatedAt
}

Pages
1. Homepage (/)
A landing page for the group. Should feel like opening a campaign book.
Content:

Large hero section with the site title (placeholder: "The Adventurer's Table" — can rename later)
Subtitle: "Campaign tools for the party"
Navigation cards for each tool/page, styled like fantasy cards or tavern notice boards
Each card shows the tool name, a brief tagline, and a thematic icon/emoji
Cards animate in on page load (staggered entrance)

Design notes:

Most visually impressive page
Subtle background texture or pattern (parchment grain, dark noise, etc.)
Cards should feel tactile — slight hover lift, border glow, etc.


2. Seating Arrangement Tool (/seating)
Generates and displays all valid seating arrangements for 6 players across 6 seats. Fully client-side, no database needed.
Seat layout (as seen from DM's perspective):
3   4
2   5
1   6
  DM
Seats 1 and 6 are closest to the DM. Seats 3 and 4 are furthest.
Constraints:

Johnathan: Must be in seat 1 or 6 (closest to DM)
Eric: Must be in seat 3 or 4 (furthest from DM)
Matthew: Must be in seat 1, 3, 4, or 6 (closest or furthest, not middle)
Mykolov, Brent, Justin: No restrictions (any seat)

This produces exactly 48 valid arrangements.
Features:

Display all 48 arrangements as small visual seat-map cards in a grid
Each card shows the 6 seats in the 3-left / 3-right layout with player abbreviations colored by player color
Click any card to expand/highlight it with full player names
Random Pick button — randomly selects one arrangement and shows it enlarged
Filter by player — click a player name in a legend bar to filter to arrangements containing that player. Optional secondary filter: filter by specific seat number.
Constraint reference displayed at the bottom of the page
Responsive: cards wrap nicely on mobile

Logic:

Generate arrangements client-side: iterate Johnathan (2 options) x Eric (2 options) x Matthew (2 remaining options) x 3! permutations of Mykolov/Brent/Justin = 48 total


3. Secret Messaging System (/messages)
A messaging system where players can send private messages to each other or to the DM. The DM can see ALL messages (including player-to-player messages). Players can only see messages they sent or received.
Player View:

Select a recipient from a dropdown: any other player, "DM", or "Everyone" (group message)
Message input with send button
Conversation view: shows messages grouped by conversation thread (between you and the selected recipient)
Unread indicator — highlight conversations with new messages since last check
Messages display with sender's player color, message body, and relative timestamp ("2m ago")

DM View (password protected):

God mode inbox: See ALL messages across all players, grouped by conversation pair
Filter by conversation (e.g., "Mykolov to Eric", "Justin to DM", "Group")
Can send messages as "DM" to any player or to the group
Visual distinction so it's clear which messages are player-to-player vs involving the DM
A "DM is watching" indicator should NOT be shown to players — they should not know the DM can see their private messages (that's the fun of it)

API Routes:

GET /api/messages?player=[name] — returns messages for a player (sent + received). If player=DM and DM auth cookie/header is present, returns ALL messages.
POST /api/messages — send a message { from, to, body }
Polling: message list page polls every 2–3 seconds

Data model:

to: "ALL" for group messages visible to everyone
to: "[PlayerName]" for direct messages
DM queries simply return all messages unfiltered


4. Initiative Tracker (/initiative)
A real-time initiative tracker visible to all players. The DM manages it; players view it live.
Player View:

See the current initiative order as a vertical list or horizontal track
Each entry shows: name, initiative roll, and a visual indicator for whose turn it is
Player entries use their assigned color; monster entries use a neutral red/gray
Current turn is highlighted prominently (glowing border, enlarged, arrow indicator)
Round counter displayed at the top
If no encounter is active, show a "Waiting for encounter..." state
Polls every 2–3 seconds to stay in sync

DM View (password protected):
All player view features, PLUS:

Add Entry: Input field for name + initiative roll. Toggle for "Player" vs "Monster". Add button.
Remove Entry: X button on each entry to remove it
Edit: Click an entry to edit name or roll value
Advance Turn: A prominent "Next Turn" button that moves the active indicator to the next entry in order. Automatically increments round when cycling back to the top.
Sort: Auto-sorts by initiative roll (highest first). Manual drag-to-reorder for ties.
Reset/Clear: Button to clear all entries and reset to round 1. Requires confirmation ("Are you sure?").
Quick Add Players: A button that adds all 6 player names with empty initiative values, so the DM just needs to fill in the rolls.

API Routes:

GET /api/initiative — returns current initiative list + state (round, active turn, isActive)
POST /api/initiative — add an entry { name, roll, isPlayer } (DM only)
PUT /api/initiative/[id] — update an entry (DM only)
DELETE /api/initiative/[id] — remove an entry (DM only)
POST /api/initiative/advance — advance to next turn (DM only)
POST /api/initiative/reset — clear all entries, reset round (DM only)
DM-only routes should check for DM auth (can be a simple header or cookie check — this is a friends-only site, not Fort Knox)

Behavior:

When DM advances turn, all polling players see the update within 2–3 seconds
When DM resets, all players see the "Waiting for encounter..." state
Initiative list is sorted by roll descending; ties preserve insertion order or manual sort


Shared Components
Player Chip (/components/player-chip.tsx)
Reusable component showing a player's name (or abbreviation) with their assigned color. Used everywhere.
Nav Bar (/components/nav.tsx)

Site title linking to home
Links to: Seating, Messages, Initiative
"Logged in as [Name]" with option to switch
If DM mode is active, show a subtle "DM" badge

Die Face (/components/dice.tsx)
SVG die face component for use in seating tool and potentially other places.

Player Config (Single Source of Truth)
typescript// lib/players.ts
export const PLAYERS = [
  { name: "Mykolov", short: "MYK", color: "#e06c75" },
  { name: "Brent", short: "BRE", color: "#61afef" },
  { name: "Johnathan", short: "JON", color: "#e5c07b" },
  { name: "Justin", short: "JUS", color: "#98c379" },
  { name: "Eric", short: "ERI", color: "#c678dd" },
  { name: "Matthew", short: "MAT", color: "#d19a66" },
] as const;

export const DM = { name: "Noah", short: "DM", color: "#ffffff" };
export const DM_PASSWORD = process.env.DM_PASSWORD || "noah";
// Store DM_PASSWORD in Vercel environment variables for production

Environment Variables
Set these in the Vercel dashboard:
POSTGRES_URL=              # Provided by Vercel Postgres
POSTGRES_PRISMA_URL=       # Provided by Vercel Postgres
POSTGRES_URL_NON_POOLING=  # Provided by Vercel Postgres
DM_PASSWORD=noah           # DM authentication password
For local development, use .env.local with the same variables.

File Structure
/app
  /layout.tsx              — Root layout: nav, fonts, global styles, player context provider
  /page.tsx                — Homepage
  /seating/page.tsx        — Seating arrangement tool (client-side only)
  /messages/page.tsx       — Messaging system
  /initiative/page.tsx     — Initiative tracker
  /api
    /messages
      /route.ts            — GET (list) and POST (send) messages
    /initiative
      /route.ts            — GET (list) and POST (add) initiative entries
      /[id]/route.ts       — PUT (update) and DELETE (remove) single entry
      /advance/route.ts    — POST advance turn
      /reset/route.ts      — POST reset encounter
    /auth
      /dm/route.ts         — POST verify DM password
/components
  /nav.tsx
  /player-chip.tsx
  /dice.tsx
  /dm-gate.tsx             — Password prompt wrapper for DM-only features
/lib
  /players.ts              — Player config (single source of truth)
  /seating.ts              — Seating arrangement generation logic
  /polling.ts              — Shared polling hook (usePolling)
/prisma
  /schema.prisma           — Database schema

Shared Utilities
usePolling Hook (/lib/polling.ts)
typescript// Custom hook for polling an API endpoint
// - Polls every POLL_INTERVAL_MS (2500ms)
// - Pauses when tab is hidden (document.visibilityState)
// - Returns { data, isLoading, error, refetch }
// - Accepts a lastUpdated comparison to skip unnecessary re-renders
DmGate Component (/components/dm-gate.tsx)
A wrapper component that checks for DM auth in localStorage. If not authenticated, shows a password input. If authenticated, renders children (DM-only controls).
typescript// Usage:
<DmGate>
  <button onClick={resetEncounter}>Reset Encounter</button>
</DmGate>
// This button only renders if DM password has been entered

Non-Goals (Out of Scope)

No real user accounts or OAuth — this is a friends-only site
No WebSockets or third-party real-time services — polling is sufficient
No campaign/character sheet tracking (maybe a future addition)
No dice roller (everyone has apps for that)
No file uploads or image sharing
No mobile app — responsive web is enough


Deployment Notes

Repo pushed to GitHub, connected to Vercel for auto-deploy
Custom domain configured in Vercel dashboard + registrar DNS settings
Vercel Postgres provisioned from Vercel dashboard (free tier: 256MB storage, sufficient for this use case)
Run npx prisma migrate deploy as part of the Vercel build command or via postinstall script
Environment variables set in Vercel dashboard (Postgres connection strings auto-populated when you provision the DB)


Priority Order
Build in this order:

Global layout — nav, fonts, theme, player config, player identity selector, DM auth gate
Homepage — hero + navigation cards
Seating Arrangement Tool — port existing logic, fully client-side
Database setup — Prisma schema, Vercel Postgres connection, migrations
Secret Messaging System — API routes, player view, DM god-mode view, polling
Initiative Tracker — API routes, player view, DM controls, polling


Security Notes
This is a private site for a friend group, so security is lightweight but sensible:

DM password is checked server-side on DM-only API routes (not just hidden in the UI)
API routes for initiative mutation (add/edit/delete/advance/reset) require DM auth header
Message sending only requires a from field matching a valid player name — honor system
No sensitive data is stored. Worst case if someone finds the site: they see D&D seating charts and initiative orders.
Store DM_PASSWORD as an environment variable, not hardcoded in client-side code. The dm-gate component sends the password to a server-side check endpoint.