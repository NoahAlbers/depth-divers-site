PRD: Depth Divers V2
Overview
V2 of the Depth Divers D&D companion site. This builds on the existing Next.js/TypeScript/Tailwind/Prisma/Vercel Postgres (Neon) stack. No database migration — stay on the current setup.
Repo: https://github.com/NoahAlbers/depth-divers-site
The site serves 6 players (Mykolov, Brent, Johnathan, Justin, Eric, Matthew) and the DM (Noah). All existing auth (bcrypt passwords, DM mode) carries forward.
Design-first principle: This site is primarily used on tablets and phones at the D&D table. Every feature must be mobile-first, touch-friendly, and responsive. Desktop is secondary.

Table of Contents

Seating Chart Lock
Messaging System Overhaul
Initiative Tracker — Phase System
DM Area
Games & Puzzles Framework
Push Notifications
Database Schema Changes
Priority Order


1. Seating Chart Lock
Current State
The seating page shows all 48 arrangements. The DM can random-pick one. Players see all arrangements equally.
V2 Changes

DM can "lock" a seating arrangement for the upcoming session
When locked, players visiting /seating see a prominent "This Session's Seating" hero card showing the locked arrangement with full player names and colors
Below it, a collapsible "Browse All Arrangements" section with the existing 48-card grid (collapsed by default when a plan is locked)
DM controls (behind DM auth):

"Lock This Arrangement" button appears on any arrangement card or the random pick result
"Unlock" button to clear the active plan
Locking a new arrangement automatically replaces the previous one


The locked arrangement is stored in the database (single row, like InitiativeState)

API

GET /api/seating — returns the currently locked arrangement (or null)
POST /api/seating/lock — DM locks an arrangement { seats: [player1, player2, ...player6] } (DM auth required)
DELETE /api/seating/lock — DM unlocks (DM auth required)


2. Messaging System Overhaul
Current State
Basic messaging with player/DM selection. Functional but not intuitive. No group chats. No notifications.
V2 — Full Redesign
Layout (Tablet/Desktop — Three Panel)
┌─────────────┬──────────────────────┬─────────────┐
│ Friends      │ Name/Group           │ Pinboard    │
│ Groups       │                      │             │
│              │                      │             │
│ [Player List]│   [Message Thread]   │ [Shared     │
│ [Group List] │                      │  Notepad]   │
│              │                      │             │
│              │ [IC/OOC] [Chat Bar]  │             │
└─────────────┴──────────────────────┴─────────────┘

Left Panel: Two tabs — "Friends" and "Groups"

Friends tab: List of all players + DM, each with their assigned color. Shows unread badge count per conversation. Click to open that DM (direct message) conversation in the center panel.
Groups tab: List of group chats. A "+" button to create a new group. Groups have a name and selected members. Creator or DM can delete groups.


Center Panel: The active conversation

Header shows the conversation name (player name or group name)
Messages displayed in a scrollable thread, newest at the bottom
Each message shows: sender name (in their color), message body, relative timestamp, and an IC/OOC tag if applicable
Chat input bar at the bottom with:

Text input field
Send button
Two optional toggle checkboxes: "In Character" and "Out of Character" — selecting one tags the message. These are mutually exclusive (selecting one deselects the other). Neither selected = no tag (default casual message).


Messages from the current user align right; messages from others align left (standard chat bubble layout)


Right Panel: Pinboard — a shared notepad per conversation

Simple rich-text or plain-text area that all participants in that conversation can edit
Auto-saves on edit (debounced)
Each conversation (DM and group) has its own independent pinboard
Useful for jotting down clues, plans, coordinates, NPC names during the session



Layout (Mobile — Single Panel with Navigation)

Default view: the contact/group list (left panel)
Tapping a contact or group slides to the chat view (center panel) with a back button
Pinboard accessible via a small icon/button in the chat header (slides in as an overlay or bottom sheet)
No three-panel split on mobile — everything is stacked/navigated

DM God Mode

Same as V1: DM sees ALL messages across all conversations (player-to-player included)
DM can filter by conversation pair or group
Players do NOT know the DM can see their private messages
DM can participate in any conversation as "DM"

Group Chats

Any player can create a group
Creator selects members from the player list + optionally the DM
Group has a name (editable by creator or DM)
Creator or DM can delete the group
Messages in groups are visible to all group members
DM can see all group messages regardless of membership (god mode)

In Character / Out of Character Tags

Two toggle checkboxes next to the chat input: "IC" and "OOC"
Mutually exclusive — tapping one deselects the other
If IC is active: message gets a subtle visual treatment — slightly different background color or a small "IC" badge, and optionally rendered in a more thematic font
If OOC is active: message gets an "OOC" badge, rendered normally
If neither is selected: no tag, default appearance
The tag is stored with the message in the database as an enum field (tag: "IC" | "OOC" | null)

Unread Indicators

Each conversation in the left panel shows an unread badge (count of unread messages)
Track "last read" per player per conversation — store a lastReadAt timestamp
Messages with createdAt > lastReadAt are unread
Badge clears when the player opens that conversation
The nav bar "Messages" link also shows a global unread badge (total unread across all conversations)


3. Initiative Tracker — Phase System
Current State
DM manages everything. Players can only view.
V2 — Player Entry with Phases
Phase Flow

Idle Phase: No encounter active. Players see "Waiting for encounter..." DM sees a "Start Encounter" button.
Entry Phase: DM presses "Start Encounter" (optionally with "Quick Add Players" to pre-populate all 6 names). Each player can now enter/update their own initiative roll on their device. Players see an input field next to their name. They CANNOT see or edit other players' rolls. DM can see all entries in real-time and can edit any entry. DM can also add monster entries during this phase.
Locked Phase: DM presses "Lock & Sort." Initiative order is finalized and sorted (highest first). No more player edits. The DM's full control panel is active: advance turn, add/remove entries, edit values, reset.

Player View by Phase

Idle: "No active encounter" message
Entry: Their name with an input field for their roll. A "Submit" button. They can see who has/hasn't submitted (show checkmarks) but NOT the actual values others entered.
Locked: Full initiative order visible. Current turn highlighted. Read-only.

DM View by Phase

Idle: "Start Encounter" button. "Quick Add Players" option.
Entry: See all entries and their submitted values. Edit any value. Add monster entries. "Lock & Sort" button.
Locked: Full control — advance turn, edit, add, remove, reset. "Reset Encounter" returns to Idle phase.

API Changes

Update InitiativeState to include a phase field: "idle" | "entry" | "locked"
POST /api/initiative/start — DM starts encounter, sets phase to "entry" (DM auth required)
POST /api/initiative/submit — Player submits their roll { playerName, roll } (only allowed during entry phase, only for their own name)
POST /api/initiative/lock — DM locks and sorts, sets phase to "locked" (DM auth required)
POST /api/initiative/reset — DM resets to idle (DM auth required)
Existing routes (advance, add, edit, delete) remain but only work during locked phase


4. DM Area (/dm)
A password-protected staging page exclusively for the DM. Hidden from the nav for regular players. Accessible via a DM-only link or the existing DM mode toggle.
Tools
4a. Recap Order Randomizer

A button: "Randomize Recap Order"
Shuffles all 6 players into a random order
Displays the order as a numbered list with player colors
"Re-roll" button to shuffle again
Optionally: "Push to Players" button that sends the recap order to a visible display on the homepage or as a notification
Fully client-side, no database needed

4b. Game Launcher

Browse available games (see Section 5)
Configure game settings (difficulty, time limit)
Launch a game to all players
View live results/leaderboard as players complete the game

4c. Seating Lock Controls

Quick access to lock/unlock seating arrangements without navigating to /seating
Shows current locked arrangement if one exists

4d. Initiative Quick Controls

Start/lock/reset encounter from the DM area without navigating to /initiative
Shows current phase and initiative order

4e. Session Notes (Future — Placeholder)

A simple text area for DM session notes that persists between sessions
Not critical for V2 launch but reserve the UI space


5. Games & Puzzles Framework
Architecture
Core Concepts

Game Definition: Each game is a self-contained React component with standardized props/interfaces
Game Session: A database record tracking an active game instance (which game, settings, status, player scores)
Game Lobby: When the DM launches a game, players see a "Game is starting!" notification. They tap to join. The game loads on their device.
Local Execution: ALL gameplay runs locally on each player's device. No real-time sync during gameplay. This ensures connection speed and device speed don't create unfair advantages.
Fixed Timestep: For any game with physics or timing (Dodge), use fixed timestep logic (e.g., game ticks at exactly 60 updates/second regardless of frame rate). This ensures a phone at 30fps and a tablet at 60fps produce identical game outcomes.
Result Submission: When a player finishes, their score/result is submitted to the server. The DM screen collects results as they arrive and displays a leaderboard.
Seed-Based Randomness: For competitive games where all players should face the same challenge (Speed Solve, Pipe Connect), the server generates a random seed when the game launches. All players receive the same seed, ensuring identical puzzle generation on every device.

Game Interface (Standard Contract)
typescriptinterface GameConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  defaultTimeLimit: number; // seconds, 0 = unlimited
  difficulties: ("easy" | "medium" | "hard")[];
  category: "puzzle" | "reflex" | "memory" | "race";
}

interface GameSession {
  id: string;
  gameId: string;
  status: "lobby" | "active" | "finished";
  config: {
    difficulty: string;
    timeLimit: number;
    seed: number; // for deterministic puzzle generation
  };
  players: string[]; // player names who joined
  results: {
    playerName: string;
    score: number;
    completedAt: string;
    metadata?: Record<string, unknown>; // game-specific data
  }[];
  createdAt: string;
}

interface GameComponentProps {
  session: GameSession;
  playerName: string;
  seed: number;
  difficulty: string;
  timeLimit: number;
  onComplete: (score: number, metadata?: Record<string, unknown>) => void;
}
Game Flow

DM opens Game Launcher in DM Area
DM selects a game, configures difficulty and time limit
DM hits "Launch" → creates a GameSession in the database with status "lobby"
All players receive a push notification + on-site notification: "A game is starting!"
Players navigate to /games (or tap the notification) → see the lobby with game name, rules summary, and a "Ready" button
DM sees who has joined. Hits "Start" when ready → status changes to "active", seed is generated
Each player's device loads the game component with the session config and seed. Game runs locally.
On completion, each player's score is POSTed to the server. The DM screen shows a live leaderboard updating as results arrive.
DM can "End Game" at any time (force-finishes for anyone still playing). Status changes to "finished."
Results screen shows final leaderboard with rankings, player colors, and scores.

API Routes

GET /api/games — list available game definitions
POST /api/games/launch — DM creates a game session (DM auth required) { gameId, difficulty, timeLimit }
GET /api/games/active — get the currently active game session (for players to detect launches)
POST /api/games/[sessionId]/join — player joins the lobby { playerName }
POST /api/games/[sessionId]/start — DM starts the game (generates seed, sets status to active) (DM auth required)
POST /api/games/[sessionId]/result — player submits score { playerName, score, metadata }
POST /api/games/[sessionId]/end — DM force-ends the game (DM auth required)
GET /api/games/[sessionId] — get session state (lobby status, results, leaderboard)

Starter Games (D&D Themed)
All games use the dark fantasy visual style consistent with the rest of the site. Gold accents, dark backgrounds, thematic fonts.
5a. Arcane Conduit (Pipe Connect)

Theme: Rotate pipe segments to connect the flow of arcane energy from a source crystal to a target rune
Category: Puzzle
Gameplay: Grid of rotatable pipe segments. Tap to rotate 90°. Connect source to target. Multiple difficulty levels change grid size and pipe complexity.
Difficulties:

Easy: 5x5 grid, simple paths
Medium: 7x7 grid, multiple branches and dead ends
Hard: 9x9 grid, multiple sources/targets, decoy paths


Scoring: Time to complete (lower is better). If timed, incomplete = no score.
Competitive fairness: Same seed = same puzzle for all players. Pure logic, no device advantage.
Visual: Glowing arcane energy flows through completed connections. Faerzress-purple pipes on dark stone background.

5b. Rune Echoes (Sequence Memory)

Theme: A series of glowing Underdark runes flash in sequence. Repeat the sequence from memory. Each successful round adds one more rune.
Category: Memory
Gameplay: Grid of 4-9 rune symbols (scales with difficulty). A sequence flashes (runes light up one at a time). Player taps them back in order. Each correct round adds one to the sequence. Fail = game over.
Difficulties:

Easy: 4 runes, slow flash speed (1s per rune), start with sequence of 3
Medium: 6 runes, medium flash speed (0.7s per rune), start with sequence of 4
Hard: 9 runes, fast flash speed (0.5s per rune), start with sequence of 5


Scoring: Longest sequence completed before failure.
Competitive fairness: Same seed = same sequence order for all players. Memory-based, no device advantage.
Visual: Stone tablet with carved runes that glow gold/purple when active. Cavern background.

5c. Stalactite Storm (Dodge)

Theme: You're running through a collapsing cavern. Dodge falling stalactites, faerzress bolts, and cave debris.
Category: Reflex
Gameplay: Side-view or top-down. Player character moves left/right (touch: drag or tilt, desktop: arrow keys). Obstacles fall from above in patterns. Survive as long as possible. Speed gradually increases.
Difficulties:

Easy: Slow fall speed, wide gaps, fewer obstacle types
Medium: Moderate speed, narrower gaps, mixed obstacles
Hard: Fast, tight gaps, obstacles that split or accelerate


Scoring: Survival time in seconds (higher is better).
Competitive fairness: Same seed = same obstacle pattern and timing for all players. Fixed timestep (60 ticks/sec) ensures identical gameplay regardless of device frame rate. The game logic runs deterministically — a player on a slow phone gets the same obstacle positions at the same game-time as someone on a fast tablet. Rendering may be smoother on faster devices but the game itself is identical.
Visual: Dark cavern with parallax background layers. Player character is a small adventurer silhouette. Stalactites glow faintly as they fall. Screen shake on near-misses.

5d. Glyph Race (Speed Solve)

Theme: A magical puzzle appears — all players race to solve it. First to solve wins. Fastest time = highest rank.
Category: Race
Puzzle types (randomly selected per round, or DM-configured):

Anagram: Unscramble a D&D/Underdark themed word (e.g., "ZARFESRE" → "FAERZRESS")
Pattern Match: A grid shows a pattern with one piece missing. Select the correct piece from 4 options.
Symbol Sequence: Given a sequence of Underdark symbols with a pattern, select what comes next.
Math Cipher: A simple arithmetic equation using rune symbols (e.g., ☽ + ◆ = 9, ☽ = 4, ◆ = ?). Solve for the unknown.


Difficulties:

Easy: Simple anagrams (5-6 letters), basic patterns
Medium: Longer words, multi-step patterns
Hard: Complex ciphers, layered logic


Scoring: Time to solve (lower is better). DNF if time runs out.
Competitive fairness: Same seed = same puzzle. Pure mental speed, no device advantage.
Multi-round option: DM can configure 1, 3, or 5 rounds. Total time across rounds determines winner.
Visual: Ancient scroll/tablet unfurling with the puzzle. Timer bar draining at the top. Flash of gold when solved.


6. Push Notifications
Implementation

Service Worker: Register a service worker (/sw.js) for handling push events
Web Push API: Use the VAPID protocol for push notifications
Subscription Flow:

On login, prompt the player: "Enable notifications to get alerts for messages and games?" with Accept/Decline
If accepted, the browser generates a push subscription
Store the subscription endpoint in the database (linked to the player)
Server sends push notifications via the web-push npm package


VAPID Keys: Generate a VAPID key pair, store in environment variables (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL)

Notification Triggers

New message: "[Player Name] sent you a message" (DM gets notifications for all messages)
New group message: "New message in [Group Name]"
Game launching: "A game is starting! Tap to join."
Initiative phase change: "Roll initiative!" (when DM starts entry phase)
Seating locked: "Seating plan for this session is set. Check your seat!"

On-Site Badge Notifications (in addition to push)

Nav bar: Red badge on "Messages" with total unread count. Red badge on "Games" when a game is in lobby/active.
Tab title: Update the browser tab title with unread count (e.g., "(3) Depth Divers")

Platform Notes

Works on: Android Chrome (full support), iOS Safari 16.4+ (requires user to "Add to Home Screen" for best experience)
Graceful degradation: if push is declined or unsupported, on-site badges still work
The push subscription should be stored per device (a player might have multiple devices)


7. Database Schema Changes
Add these new models to the existing Prisma schema:
prisma// --- Seating Lock ---
model SeatingLock {
  id        String   @id @default("active")
  seats     String   // JSON array of 6 player names in seat order [seat1, seat2, ..., seat6]
  lockedBy  String   // "DM" or player name
  lockedAt  DateTime @default(now())
}

// --- Messaging V2 ---
model Conversation {
  id        String   @id @default(cuid())
  type      String   // "dm" (direct message) or "group"
  name      String?  // group name (null for DMs)
  members   String   // JSON array of player names in this conversation
  createdBy String   // player who created the group (or system for DMs)
  createdAt DateTime @default(now())
}

model MessageV2 {
  id             String   @id @default(cuid())
  conversationId String   // FK to Conversation
  from           String   // sender name
  body           String
  tag            String?  // "IC", "OOC", or null
  createdAt      DateTime @default(now())
}

model ConversationRead {
  id             String   @id @default(cuid())
  conversationId String
  playerName     String
  lastReadAt     DateTime @default(now())
  @@unique([conversationId, playerName])
}

model Pinboard {
  id             String   @id @default(cuid())
  conversationId String   @unique
  content        String   @default("") // plain text or markdown
  updatedAt      DateTime @updatedAt
  updatedBy      String?  // last editor
}

// --- Games ---
model GameSession {
  id         String   @id @default(cuid())
  gameId     String   // e.g., "arcane-conduit", "rune-echoes", "stalactite-storm", "glyph-race"
  status     String   @default("lobby") // "lobby", "active", "finished"
  difficulty String   @default("medium")
  timeLimit  Int      @default(0) // seconds, 0 = unlimited
  seed       Int?     // generated on start, shared to all players
  players    String   @default("[]") // JSON array of player names who joined
  results    String   @default("[]") // JSON array of { playerName, score, completedAt, metadata }
  createdAt  DateTime @default(now())
  startedAt  DateTime?
  endedAt    DateTime?
}

// --- Push Subscriptions ---
model PushSubscription {
  id           String   @id @default(cuid())
  playerName   String
  endpoint     String
  p256dh       String   // encryption key
  auth         String   // auth secret
  createdAt    DateTime @default(now())
  @@unique([playerName, endpoint])
}

// --- Initiative (Update existing) ---
// Add phase field to InitiativeState:
// phase String @default("idle") // "idle", "entry", "locked"
Migration Notes

The old Message model can be kept for backward compatibility or migrated to MessageV2 + Conversation with a data migration script
DM conversations between each player pair should be auto-created on first load (or seeded)
Run schema changes via Neon SQL Editor if CLI is unavailable (as done in V1)


8. Environment Variables (New)
Add to Vercel dashboard:
VAPID_PUBLIC_KEY=     # Generated VAPID public key
VAPID_PRIVATE_KEY=    # Generated VAPID private key
VAPID_EMAIL=mailto:noah@example.com  # Contact email for VAPID
Generate VAPID keys with: npx web-push generate-vapid-keys

9. File Structure (New/Changed)
/app
  /dm/page.tsx                    — DM Area (protected)
  /games
    /page.tsx                     — Game lobby / active game view
    /[sessionId]/page.tsx         — Active game session
  /messages/page.tsx              — Messaging V2 (overhaul)
  /api
    /seating
      /lock/route.ts              — POST lock, DELETE unlock
      /route.ts                   — GET current lock
    /messages
      /conversations/route.ts     — GET list, POST create group
      /conversations/[id]/route.ts — GET messages, DELETE group
      /conversations/[id]/read/route.ts — POST mark as read
      /send/route.ts              — POST send message
      /unread/route.ts            — GET unread counts
    /pinboard
      /[conversationId]/route.ts  — GET and PUT pinboard content
    /initiative
      /start/route.ts             — POST start encounter (entry phase)
      /submit/route.ts            — POST player submits roll
      /lock/route.ts              — POST lock and sort
    /games
      /route.ts                   — GET available games
      /launch/route.ts            — POST create session
      /active/route.ts            — GET active session
      /[sessionId]/route.ts       — GET session state
      /[sessionId]/join/route.ts  — POST join
      /[sessionId]/start/route.ts — POST start (generate seed)
      /[sessionId]/result/route.ts — POST submit score
      /[sessionId]/end/route.ts   — POST end game
    /push
      /subscribe/route.ts         — POST save push subscription
      /send/route.ts              — Internal: send push notification
/components
  /messaging
    /conversation-list.tsx        — Left panel (friends + groups tabs)
    /chat-thread.tsx              — Center panel (message thread)
    /chat-input.tsx               — Input bar with IC/OOC toggles
    /pinboard-panel.tsx           — Right panel (shared notepad)
    /unread-badge.tsx             — Notification badge component
  /games
    /game-lobby.tsx               — Lobby waiting room
    /game-leaderboard.tsx         — Results display
    /arcane-conduit.tsx           — Pipe Connect game
    /rune-echoes.tsx              — Sequence Memory game
    /stalactite-storm.tsx         — Dodge game
    /glyph-race.tsx               — Speed Solve game
  /dm
    /recap-randomizer.tsx         — Recap order tool
    /game-launcher.tsx            — Game selection and config
/lib
  /games.ts                       — Game definitions and registry
  /push.ts                        — Push notification helpers
  /seeded-random.ts               — Deterministic RNG from seed
/public
  /sw.js                          — Service worker for push notifications

10. Priority Order
Build in this order:
Phase 1: Core Updates

Seating Chart Lock — small, self-contained, quick win
Initiative Phase System — update existing tracker with phases and player entry
DM Area — basic page with recap randomizer and quick controls for seating + initiative

Phase 2: Messaging Overhaul

Messaging V2 data model — conversations, groups, message tags, pinboard, unread tracking
Messaging UI — three-panel layout (tablet/desktop), single-panel (mobile), IC/OOC toggles
Pinboard — shared notepad per conversation
Unread badges — nav bar badges, conversation list badges

Phase 3: Push Notifications

Service worker + VAPID setup — subscription flow, storage
Push triggers — messages, games, initiative, seating

Phase 4: Games Framework

Game session infrastructure — database model, API routes, lobby system, seeded RNG
DM Game Launcher UI — browse games, configure, launch, view results
Player game view — lobby, game loading, result submission
Arcane Conduit (Pipe Connect) — first game, proves the framework
Rune Echoes (Sequence Memory) — second game
Glyph Race (Speed Solve) — third game
Stalactite Storm (Dodge) — fourth game, most complex (fixed timestep physics)


Design Guidelines (Carried from V1)

Dark theme: #0d1117 background, #e5c07b gold accents
Player colors are sacred — use them consistently everywhere:

Mykolov: #e06c75, Brent: #61afef, Johnathan: #e5c07b, Justin: #98c379, Eric: #c678dd, Matthew: #d19a66, Noah (DM): #ffffff


Fonts: Cinzel for headings, JetBrains Mono for UI/data
Mobile-first: touch targets minimum 44x44px, no hover-only interactions
All modals/popups: position: fixed, viewport-centered, max-height: 90vh, overflow-y: auto
Games should feel like part of the D&D world — Underdark themed visuals, not generic arcade


Security (Carried from V1)

DM-only routes require DM auth header (server-side check)
Player identity from authenticated session
Initiative submit only allows players to set their own roll
Game results are validated server-side (score within plausible range for the game type)
Push subscriptions are tied to authenticated player names
No sensitive data beyond hashed passwords