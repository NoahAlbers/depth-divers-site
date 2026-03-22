# Feature Request: Drawing Game, Game Launcher Polish, Stealth Rework

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. New Game: Underdark Telephone (Gartic Phone Style Drawing Game)

**Theme**: A message is passed through the party — but every other pass is a drawing. What starts as "a drow riding a giant spider" ends as... something very different.

**Category**: Social / Party Game
**Players**: 4-7 (all players + optionally DM)
**No skill mapping** — this is a pure fun/social game, no ability score influence.

### Game Flow

The game runs in **rounds**. Each round alternates between writing and drawing:

1. **Round 1 — Write**: Each player receives a **prompt** and writes a short description. The prompt can be:
   - DM-provided: The DM types custom prompts before launching (one per player, or one shared prompt)
   - Auto-generated: The system picks from a bank of Underdark-themed prompts (see prompt bank below)
   - Player-provided: Each player writes their own original prompt from scratch
2. **Round 2 — Draw**: Each player receives ANOTHER player's written description. They must **draw** it on a canvas. They cannot see who wrote it. Time limit per drawing (configurable, default 60 seconds).
3. **Round 3 — Write**: Each player receives another player's DRAWING. They must write a description of what they think the drawing shows. They don't see the original text.
4. **Round 4 — Draw**: Each player receives the new description and draws it.
5. Repeat until the chain has passed through all players.

At the end, each chain is revealed from start to finish — the original prompt, each drawing, each guess. The comedy comes from how distorted the message gets.

### Number of Rounds

- With N players, there are N rounds total (each prompt passes through every player)
- With 6 players: Write → Draw → Write → Draw → Write → Draw
- Each chain starts with one player and ends with another
- Chains are arranged so no player ever sees their own chain's previous entries

### Drawing Canvas

**Requirements:**
- Simple touch/mouse drawing canvas (HTML5 Canvas)
- **Tools:**
  - Brush (default): freehand drawing
  - 3-4 color options: black, white, red, blue (keep it simple — this isn't an art app)
  - 2-3 brush sizes: thin, medium, thick
  - Eraser
  - Undo button (undo last stroke)
  - Clear button (clear entire canvas, with confirmation)
- Canvas background: parchment/beige color for contrast
- Canvas size: square aspect ratio, responsive to screen size
- **Timer bar** at the top showing remaining drawing time
- Drawing is saved as a PNG/base64 image when the timer expires or the player hits "Done"

**Mobile-friendly:**
- Drawing with finger works naturally on the canvas
- Tools displayed as a compact toolbar below or above the canvas
- Ensure touch events don't conflict with page scroll — when touching the canvas, disable page scroll

### Writing Phase

- Text input field with a character limit (150 characters — forces concise descriptions)
- The player sees either:
  - A prompt/topic (Round 1)
  - Another player's drawing (subsequent write rounds)
- Timer bar at the top (configurable, default 30 seconds for writing)
- Auto-submits when timer expires (whatever they've typed so far, or "[no description]" if empty)

### Reveal Phase

After all rounds are complete, the game enters the **reveal phase**:

- All players see the same screen (or each on their own device, synced)
- One chain is revealed at a time
- Each step is shown sequentially with a brief pause between: original prompt → first drawing → first guess → second drawing → etc.
- Players can react/laugh in real time
- A "Next Chain" button (DM controls the pace) advances to the next chain
- After all chains are revealed, a summary screen shows all chains side by side

### Prompt Bank (Auto-Generated)

A bank of Underdark-themed prompts for when the DM doesn't provide custom ones. Mix of creatures, scenarios, and absurd situations:

```typescript
const DRAWING_PROMPTS = [
  // Creatures
  "A beholder having a bad hair day",
  "A mind flayer eating a sandwich",
  "A drow riding a giant spider into battle",
  "A gelatinous cube trying to make friends",
  "A myconid doing a little dance",
  "An aboleth remembering something embarrassing",
  "A kuo-toa worshipping a traffic cone",
  "A quaggoth in a fancy hat",
  "A drider knitting a web sweater",
  "Two hook horrors slow dancing",

  // Scenarios
  "A tavern brawl between dwarves and elves",
  "Someone falling into a pit trap",
  "A wizard casting a spell that went very wrong",
  "A dragon sleeping on a pile of gold coins",
  "An adventurer trying to haggle with a goblin merchant",
  "A minotaur lost in his own labyrinth",
  "A skeleton trying to drink a potion",
  "A party of adventurers arguing over a map",
  "A barbarian trying to read a spellbook",
  "A rogue stealing from another rogue",

  // Underdark-specific
  "Gracklstugh on a good day",
  "The Darklake at sunset (there is no sunset)",
  "A duergar forging a weapon angrily",
  "Mushrooms having a council meeting",
  "Faerzress making everything glow weird",
  "The Silken Paths — don't look down",
  "A derro explaining their conspiracy theory",
  "An underground waterfall of glowing water",
  "Stalactites and stalagmites arguing about who's who",
  "A deep gnome hiding so well you can barely draw them",
];
```

### DM Configuration (at launch)

- **Prompt mode**: "Auto-generated" / "DM-provided" / "Player-written"
  - If DM-provided: text fields to enter one prompt per player
  - If auto-generated: the system randomly selects from the prompt bank
  - If player-written: each player writes their own starting prompt in Round 1
- **Drawing time**: 30s / 45s / 60s / 90s (default 60s)
- **Writing time**: 15s / 20s / 30s / 45s (default 30s)
- **Number of rounds**: Auto (one per player) or manual override (fewer rounds for quicker games)

### Technical Implementation

**Data flow:**
- The game session stores all chains as a JSON structure
- Each chain is an array of entries: `{ type: "text" | "drawing", playerName: string, content: string }`
  - For text entries, `content` is the written text
  - For drawing entries, `content` is a base64-encoded PNG
- The chain assignment (who passes to whom) is determined by the seed and player count — use a rotation so no player sees their own chain

**Image storage:**
- Drawings are stored as base64 strings in the game session's results JSON
- For a 6-player game with 3 drawing rounds each, that's 18 drawings — manageable in size
- Canvas export: use `canvas.toDataURL('image/png', 0.5)` with reduced quality to keep size reasonable
- Maximum canvas resolution: 400x400px (sufficient for silly drawings, keeps file size small)

**Sync between rounds:**
- All players must complete the current round before anyone advances to the next
- The DM screen shows a progress indicator: "4/6 players have submitted"
- If a player's timer expires without submitting, auto-submit what they have
- A "Force Advance" button for the DM to skip anyone who's stalling (their entry becomes "[skipped]")

### API

- Uses the existing game session infrastructure
- Drawing/text submissions go through `POST /api/games/[sessionId]/result` with metadata containing the chain entries
- A new endpoint `POST /api/games/[sessionId]/round-submit` handles per-round submissions: `{ playerName, roundIndex, type, content }`
- `GET /api/games/[sessionId]/round-status` returns how many players have submitted for the current round
- `POST /api/games/[sessionId]/advance-round` DM forces the next round (DM auth required)

---

## 2. Game Launcher Improvements

The DM's Game Launcher in the DM Area needs better descriptions, previews, and configuration options so the DM can quickly understand and set up each game.

### Game Selection Screen

When the DM opens the Game Launcher, show a **card grid** of available games. Each card includes:

- **Game icon/emoji**: A thematic icon for the game
- **Game name**: Large, clear
- **Category tag**: Small badge — "Puzzle", "Reflex", "Cooperative", "Social", "Rhythm", etc.
- **Player count**: "2-6 players", "1 player (competitive)", "All players", etc.
- **Estimated time**: "~20 seconds", "~2 minutes", "~10 minutes"
- **Brief description**: 1-2 sentences explaining the game (see descriptions below)
- **Skill mapping**: Which ability/skill it maps to by default (e.g., "DEX / Sleight of Hand")

### Game Descriptions

```typescript
const GAME_INFO = {
  "arcane-conduit": {
    name: "Arcane Conduit",
    icon: "🔮",
    category: "Puzzle",
    players: "All players (competitive)",
    time: "~2-5 minutes",
    description: "Rotate pipe segments to connect arcane energy from the source crystal to the target rune. Fastest solve wins.",
    skill: "INT / Arcana",
  },
  "rune-echoes": {
    name: "Rune Echoes",
    icon: "🔔",
    category: "Memory",
    players: "All players (competitive)",
    time: "~2-4 minutes",
    description: "Runes flash in sequence — memorize and repeat. Each round adds one more. How far can you go?",
    skill: "INT / History",
  },
  "glyph-race": {
    name: "Glyph Race",
    icon: "⚡",
    category: "Speed / Puzzle",
    players: "All players (competitive)",
    time: "~2-3 minutes",
    description: "Solve a series of quick puzzles — math ciphers, patterns, and visual challenges. Fastest total time wins.",
    skill: "INT / Investigation",
  },
  "stalactite-storm": {
    name: "Stalactite Storm",
    icon: "🪨",
    category: "Reflex / Survival",
    players: "All players (competitive)",
    time: "~1-3 minutes",
    description: "Dodge falling stalactites and cave debris. Move left and right to survive. Longest survival time wins.",
    skill: "DEX / Acrobatics",
  },
  "spider-swat": {
    name: "Spider Swat",
    icon: "🕷️",
    category: "Reflex / Micro-Game",
    players: "All players (competitive)",
    time: "~20 seconds",
    description: "Spiders are swarming! Tap to squash them before they vanish. Don't hit the friendly mushroom. Highest score wins.",
    skill: "WIS / Perception",
  },
  "lockpicking": {
    name: "Lockpicking",
    icon: "🔐",
    category: "Dexterity / Skill Check",
    players: "1 player (solo, scores compared)",
    time: "~1-3 minutes",
    description: "Guide your lockpick through the mechanism without touching the walls. Three strikes and the pick breaks.",
    skill: "DEX / Sleight of Hand",
  },
  "stealth-sequence": {
    name: "Stealth Sequence",
    icon: "🥷",
    category: "Timing / Strategy",
    players: "All players (simultaneous)",
    time: "~2-4 minutes",
    description: "Sneak past patrolling guards. Move between their vision cones. One wrong step and you're caught.",
    skill: "DEX / Stealth",
  },
  "drinking-contest": {
    name: "Drinking Contest",
    icon: "🍺",
    category: "Rhythm / Endurance",
    players: "All players (competitive)",
    time: "~2-5 minutes",
    description: "Match the rhythm to keep drinking. The sweet spot shrinks, the screen blurs, and your vision doubles. Last one standing wins.",
    skill: "CON (raw score)",
  },
  "defuse-the-glyph": {
    name: "Defuse the Glyph",
    icon: "💣",
    category: "Cooperative / Communication",
    players: "2-6 players (cooperative)",
    time: "~3-8 minutes",
    description: "Each player sees a different piece of a magical trap. Communicate verbally to solve it together. Nobody can show their screen.",
    skill: "INT / Arcana",
  },
  "underdark-telephone": {
    name: "Underdark Telephone",
    icon: "🎨",
    category: "Social / Party",
    players: "4-7 players",
    time: "~10-20 minutes",
    description: "A game of telephone with drawings. Write, draw, guess, draw, guess — watch your message mutate into chaos.",
    skill: "None (pure fun)",
  },
};
```

### Configuration Screen

After selecting a game, the DM sees a configuration screen with:

- **Game name and full description** at the top
- **How to play**: A brief rules summary (3-5 bullet points explaining the core mechanic)
- **Difficulty selector**: Easy / Medium / Hard (with descriptions of what changes per difficulty)
- **Skill override**: Dropdown to change the mapped skill (defaults to the game's standard mapping). Shows "This affects difficulty based on players' character sheets."
- **Time limit** (where applicable): Number input or preset buttons
- **Game-specific options**: Each game can have unique config fields:
  - Glyph Race: number of puzzles (3 / 5 / 7)
  - Underdark Telephone: prompt mode, drawing time, writing time
  - Defuse the Glyph: timer duration
  - Spider Swat: game duration (15s / 20s / 30s)
  - Drinking Contest: starting difficulty
  - etc.
- **"Launch Game" button** — big, gold, prominent

### Active Game Dashboard

While a game is running, the DM Area shows:

- Game name and current status (lobby / active / finished)
- Which players have joined
- For multi-round games (Underdark Telephone): current round and progress (who has submitted)
- Live leaderboard as results come in
- "Force End" button to terminate the game early
- "Advance Round" button for round-based games

---

## 3. Stealth Sequence — Complete Rework

The current Stealth Sequence implementation isn't working well. Rebuild it from scratch with these specs:

### Core Concept

Top-down grid. You're sneaking through a drow outpost. Guards patrol in patterns. Move between their vision cones. Reach the exit.

### Grid & Visuals

- **Grid size by difficulty:**
  - Easy: 7x7
  - Medium: 9x9
  - Hard: 11x11
- Each cell is a square, sized to fit the screen (the entire grid should be visible at once — no scrolling)
- **Cell types:**
  - **Floor** (dark stone): Walkable
  - **Wall** (darker block): Impassable. Used to create corridors and cover.
  - **Start** (player color glow): Bottom area of the grid. Player spawns here.
  - **Exit** (gold glow): Top area of the grid. Reach this to win.
  - **Cover** (slightly different shade): Floor tiles that block vision cones. Guards can't see through cover even if it's in their cone. Creates safe spots.
- **Player**: A small circle in the player's color
- **Guards**: Small drow silhouettes or red/purple dots with attached vision cones

### Vision Cones

- Each guard has a **triangular vision cone** extending 2-3 cells in front of them in the direction they're facing
- Vision cones are rendered as **semi-transparent red/purple triangles** overlaid on the grid
- Vision cones DO NOT pass through walls or cover — line of sight is blocked
- The player can clearly see which cells are "dangerous" at any given moment

### Beat System

The game runs on a **beat** — a rhythmic tick that drives all movement.

- **Beat interval**: 1.5 seconds on Easy, 1.2 seconds on Medium, 1.0 seconds on Hard
- **On each beat:**
  1. Guards move one step along their patrol path
  2. Guards update their facing direction (and vision cone)
  3. **Detection check**: If the player is standing in any guard's vision cone at the moment of the beat → CAUGHT
- **Between beats:** The player can move. Each tap/click moves the player one cell in the chosen direction (up/down/left/right). The player can make multiple moves between beats if they're fast, but each move is one cell.
- **Visual beat indicator**: A subtle pulse/ripple across the grid on each beat, plus a small beat counter or rhythm indicator at the top. This helps the player feel the timing.

### Player Movement

- **Tap a cell** to move there (if it's adjacent — up/down/left/right, not diagonal)
- **Swipe** in a direction to move one cell that direction (mobile-friendly alternative)
- **Arrow keys / WASD** on desktop
- The player can stand still between beats (sometimes the right move is to wait)
- Moving into a wall does nothing (no penalty, just doesn't move)
- Moving is instant — the player teleports to the adjacent cell, no walking animation needed

### Guard Types

- **Patrol Guard**: Walks a fixed path back and forth (e.g., 4 cells right, then 4 cells left, repeat). Vision cone faces the direction of movement. The most common guard type.
  - Visual: The patrol path should be subtly indicated on the grid (very faint dotted line) so players can predict the pattern after watching for a few beats.

- **Rotating Guard**: Stands in one place. Rotates their vision cone 90° clockwise on each beat (N→E→S→W→N). Covers a wide area over time but has predictable gaps.

- **Erratic Guard** (Hard only): Like a patrol guard but randomly pauses for 1-2 extra beats before continuing. Throws off timing. No visual indicator of when they'll pause.

### Guard Count by Difficulty

- **Easy**: 2 patrol guards. Wide corridors. Generous safe zones. Lots of cover.
- **Medium**: 3 patrol guards + 1 rotating guard. Tighter corridors. Less cover. Requires timing.
- **Hard**: 4 patrol guards + 2 rotating guards + 1 erratic guard. Tight spaces. Minimal cover. Very precise timing required.

### Map Generation

- Use the session seed for deterministic generation
- Algorithm:
  1. Generate a grid with walls creating corridors and rooms
  2. Ensure a valid path exists from start to exit (pathfinding check)
  3. Place cover tiles in strategic positions (near guard patrol routes)
  4. Place guards with patrol routes that don't overlap too heavily
  5. Validate that the map is solvable — simulate an optimal player path and verify it can reach the exit without being caught
- If validation fails, increment the seed and regenerate

### Scoring

- **Score = number of beats taken to reach the exit** (lower is better)
- If caught: the player's score is recorded as their furthest progress (percentage of distance to exit) with a "CAUGHT" flag
- Caught players rank below all players who completed the map
- Display time as "X beats" rather than seconds, since the beat interval varies by difficulty

### Group Play

- All players play the **same map** simultaneously (same seed = same layout, same guard patterns)
- Each player's result is independent
- DM sees results: "Jonathan: 14 beats (completed), Mykolov: 22 beats (completed), Eric: CAUGHT (68% through)"
- The DM can use this narratively: "4 of you sneak through. Eric, a guard spots you and raises the alarm."

### Stat Influence (DEX / Stealth)

- **Higher bonus → Warning flash**: Before each beat, cells that WILL be in a guard's vision cone on the next beat briefly flash a faint yellow/orange for `0.2s + (0.03s × bonus)`. This gives high-stealth characters a preview of incoming danger. At bonus +0, the flash is barely noticeable (0.2s). At bonus +8, it's a clear 0.44s warning.
- **Higher bonus → Free "close call"**: Number of times the player can be in a vision cone on a beat and NOT get caught. Base: 0. At bonus +5: 1 free close call. At bonus +9: 2 free close calls. On a close call, the screen flashes red briefly and the guard shows a "?" but doesn't fully detect you.

### Visuals & Polish

- Dark stone grid with subtle texture
- Walls are solid dark blocks
- Vision cones: semi-transparent red/purple, clearly visible but not overwhelming
- Beat pulse: a subtle wave of light that ripples across the grid on each beat
- Player movement: instant position snap with a small trail particle effect
- On caught: dramatic red flash, guard turns to face player, "DETECTED" text, brief freeze before showing results
- On escape: gold flash on the exit cell, "ESCAPED" text, time/beats displayed
- Ambient feel: this should feel tense and quiet — no flashy colors except the vision cones

---

## Implementation Priority

1. **Game Launcher improvements** — descriptions, configuration screen, active dashboard
2. **Stealth Sequence rework** — complete rebuild per spec above
3. **Underdark Telephone** — drawing game (most complex new addition)