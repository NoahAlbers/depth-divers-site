# Feature Request: Character Sheets, Game Fixes, & New Games

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## Table of Contents

1. My Character Page
2. Navbar Fix — Hide DM Area from Players
3. Game Fixes (Glyph Race, Stalactite Storm)
4. Ability Score → Game Difficulty System
5. New Games (Defuse the Glyph, Lockpicking, Stealth Sequence, Drinking Contest, Spider Swat)

---

## 1. My Character Page (`/character`)

A page where each player inputs and views their D&D character stats. These stats are used by the game system to adjust difficulty.

### Layout

Dark fantasy themed. Character name displayed large at the top in the player's assigned color. Below that, organized sections:

#### Character Name
- Large text input field at the top
- This is the character's in-game name (e.g., "Jaedo", "Korvash"), separate from the player name
- Displayed in the player's color

#### Ability Scores
- 6 scores in a 3x2 or 6-column grid: **STR, DEX, CON, INT, WIS, CHA**
- Each shows:
  - The ability name (abbreviated)
  - A number input field for the score (range: 1-30)
  - The **modifier** auto-calculated below it: `Math.floor((score - 10) / 2)`, displayed as "+3" or "-1" etc.
- Styled as card-like boxes with the score prominent and the modifier smaller below

#### Skills
- All 18 D&D 5e skills listed, grouped by their parent ability:
  - **STR**: Athletics
  - **DEX**: Acrobatics, Sleight of Hand, Stealth
  - **CON**: (none)
  - **INT**: Arcana, History, Investigation, Nature, Religion
  - **WIS**: Animal Handling, Insight, Medicine, Perception, Survival
  - **CHA**: Deception, Intimidation, Performance, Persuasion
- Each skill shows:
  - Skill name
  - Parent ability abbreviation (muted)
  - **Proficiency checkbox** (adds proficiency bonus when checked)
  - **Expertise checkbox** (doubles proficiency bonus — only available if proficiency is checked)
  - The **total bonus** auto-calculated: `ability modifier + (proficient ? proficiency bonus : 0) + (expertise ? proficiency bonus : 0)`
- Proficiency bonus is derived from level (default to +2 if level isn't set, standard 5e formula: `Math.ceil(level / 4) + 1`)

#### Movement Speed
- Simple number input, default 30
- Label: "Movement Speed (ft)"

#### Level
- Number input, range 1-20
- Used to calculate proficiency bonus

#### Save Button
- Prominent "Save Character" button at the bottom
- Auto-saves on change would be nice too (debounced 2 seconds)
- Success feedback: "Character saved!" toast/message

### Permissions
- Players can edit their own character sheet
- DM can view and edit any player's character sheet (via DM Area or impersonate mode)
- The character data is linked to the player's account

### Data Model

```prisma
model CharacterSheet {
  id             String @id @default(cuid())
  playerName     String @unique // FK to Player
  characterName  String @default("")
  level          Int    @default(1)
  movementSpeed  Int    @default(30)
  
  // Ability Scores
  strength       Int    @default(10)
  dexterity      Int    @default(10)
  constitution   Int    @default(10)
  intelligence   Int    @default(10)
  wisdom         Int    @default(10)
  charisma       Int    @default(10)
  
  // Skills — stored as JSON for flexibility
  // Format: { "athletics": { proficient: true, expertise: false }, ... }
  skills         String @default("{}")
  
  updatedAt      DateTime @updatedAt
}
```

### API
- `GET /api/character?player=[name]` — get a player's character sheet
- `PUT /api/character` — update character sheet `{ playerName, ...fields }` (player can only update their own; DM can update anyone's)

### Nav Integration
- Add "My Character" link to the navbar between "Seating" and "DM Area"
- Updated nav order: Messages, Initiative, Games, Seating, My Character, DM Area (DM only)
- Also add a card for it on the homepage

---

## 2. Navbar Fix — Hide DM Area from Players

The "DM Area" link in the navbar should ONLY be visible when the user is authenticated as the DM. Regular players should never see it in the nav — not in the desktop links and not in the mobile hamburger menu.

The `navLinks` array already conditionally includes DM Area with `...(isDM ? [{ href: "/dm", label: "DM Area" }] : [])` — verify this is working correctly for both desktop and mobile menu. If the mobile menu is rendering all links including DM Area regardless of auth state, fix it so it uses the same filtered `navLinks` array.

---

## 3. Game Fixes

### 3a. Glyph Race — Fix Puzzle Types & Timeout Behavior

**Problem 1: Anagrams are too hard.** The current anagrams use creature names from the campaign that nobody knows how to spell. 

**Fix:** Remove anagram puzzles entirely. Replace with puzzle types that don't require campaign-specific knowledge:

- **Math Cipher**: Simple arithmetic with rune symbols. "☽ + ◆ = 12, ☽ = 7, ◆ = ?" Scale difficulty by adding more unknowns or operations.
- **Pattern Match**: A sequence of shapes/symbols with a pattern, pick what comes next from 4 options. Scale by making patterns more complex.
- **Spot the Difference**: Two similar rune grids side by side, tap the differences. Scale by grid size and subtlety of differences.
- **Color Sequence**: A grid of colored gems flashes briefly, then goes dark. Reproduce the color pattern from memory. Scale by grid size and flash duration.
- **Quick Math**: Simple arithmetic problems that get progressively harder. "7 × 8 = ?", "156 ÷ 12 = ?", etc.

All puzzles should be things anyone can solve with general knowledge — no D&D lore, no spelling, no trivia.

**Problem 2: If a player can't solve one puzzle, they get a 999 time and are effectively eliminated.**

**Fix:** When the per-puzzle timer runs out:
- The puzzle is marked as failed/skipped
- A time penalty is added to their total (e.g., the full timer duration counts as their time for that puzzle)
- The game automatically advances to the NEXT puzzle
- The player continues playing the remaining puzzles
- Final score = total time across all puzzles (including penalty time for skipped ones)
- This way, failing one puzzle is punishing but not game-ending — a player who skips one but blazes through the other four can still compete

### 3b. Stalactite Storm — Complete Rebuild

**Problem:** The stalactites don't reach the ground and the game resets every few seconds. The game is fundamentally broken.

**Fix — Rebuild from scratch with these specs:**

**Core Gameplay:**
- Side-view perspective. The player character is at the bottom of the screen, can move left and right
- Stalactites (and other obstacles) fall from the top of the screen at varying speeds
- The player dodges obstacles by moving left/right
- Survival time = score (higher is better)
- Speed gradually increases over time

**Controls:**
- **Mobile**: Touch and drag left/right on the screen. The character follows the finger's X position. OR use left/right screen halves (tap left half = move left, tap right half = move right)
- **Desktop**: Arrow keys or A/D keys, or mouse position

**Critical Technical Requirements:**
- **Fixed timestep game loop**: Game logic runs at exactly 60 ticks per second regardless of frame rate. This ensures identical gameplay across devices.
  ```javascript
  const TICK_RATE = 1000 / 60; // ~16.67ms per tick
  let accumulator = 0;
  let lastTime = performance.now();
  
  function gameLoop(currentTime) {
    const delta = currentTime - lastTime;
    lastTime = currentTime;
    accumulator += delta;
    
    while (accumulator >= TICK_RATE) {
      updateGameState(); // Fixed timestep update
      accumulator -= TICK_RATE;
    }
    
    render(); // Render at whatever frame rate the device supports
    requestAnimationFrame(gameLoop);
  }
  ```
- **Seeded randomness**: Use the session seed for obstacle generation so all players face the same pattern
- **Obstacles must actually traverse the full screen**: Spawn at y=0 (or above viewport), move downward each tick, despawn when they pass below the play area. Verify the y-position is incrementing correctly each tick.
- **Collision detection**: Simple AABB (axis-aligned bounding box) between player hitbox and obstacle hitboxes. Player hitbox should be slightly smaller than the visual sprite for forgiving gameplay.
- **No resets**: The game runs continuously until the player collides with an obstacle. There should be no timer-based resets or restarts.

**Obstacle Types:**
- **Stalactites**: Fall straight down. Basic obstacle.
- **Faerzress Bolts**: Fall at an angle (diagonal movement). Harder to predict.
- **Cave Debris**: Wider obstacles that block more horizontal space.
- **Speed increase**: Every 10-15 seconds, base fall speed increases by 10-15%.

**Visuals:**
- Dark cavern background with parallax layers (distant wall scrolling slowly, closer details scrolling faster)
- Player character: small adventurer silhouette or simple sprite
- Stalactites: pointed rock shapes, slightly glowing edges
- Screen shake on near-misses (optional)
- Score/time displayed prominently at the top

---

## 4. Ability Score → Game Difficulty System

### Overview

When a game launches, the system checks the player's relevant character stats and applies a **moderate difficulty adjustment** (10-20% shift). Player skill still dominates — stats provide an edge, not a guarantee.

### DM Configures Skill Mapping at Launch

When the DM launches a game from the Game Launcher, they can **optionally select which skill applies** to that game instance. This allows narrative flexibility — lockpicking is usually Sleight of Hand, but for an arcane lock the DM could map it to Arcana.

**Default skill mappings** (used if the DM doesn't override):
- **Lockpicking** → Sleight of Hand (DEX)
- **Stealth Sequence** → Stealth (DEX)
- **Spider Swat** → Perception (WIS)
- **Drinking Contest** → Constitution (raw ability score, no skill)
- **Defuse the Glyph** → Arcana (INT)
- **Stalactite Storm** → Acrobatics (DEX)
- **Arcane Conduit** → Arcana (INT)
- **Rune Echoes** → History (INT)
- **Glyph Race** → Investigation (INT)

### How the Adjustment Works

Calculate the player's **total bonus** for the mapped skill: `ability modifier + proficiency bonus (if proficient) + expertise bonus (if applicable)`.

The bonus typically ranges from -1 (low stat, no proficiency) to +11 (20 in stat + proficiency + expertise at high level). Map this to a difficulty multiplier:

```typescript
function getDifficultyMultiplier(skillBonus: number): number {
  // Baseline is 1.0 (no adjustment) at bonus +3 (average adventurer)
  // Range: 0.85 (easiest, very high bonus) to 1.15 (hardest, very low bonus)
  const baseline = 3;
  const adjustment = (baseline - skillBonus) * 0.03; // 3% per point of difference
  return Math.max(0.8, Math.min(1.2, 1.0 + adjustment));
}
```

So a player with +7 Sleight of Hand gets a 0.88 multiplier (12% easier) and a player with -1 gets a 1.12 multiplier (12% harder).

### What the Multiplier Affects (Per Game)

- **Lockpicking**: Corridor width multiplied (wider = easier). Wall-touch tolerance.
- **Stealth Sequence**: Time between guard beats. Vision cone warning flash duration.
- **Spider Swat**: Target size. Time targets stay on screen.
- **Drinking Contest**: Sweet spot size. Rate at which effects intensify.
- **Defuse the Glyph**: Number of decoy elements. Optional hint flash duration.
- **Stalactite Storm**: Player movement speed. Hitbox size.
- **Arcane Conduit**: Number of pre-solved pipes. Grid size adjustment.
- **Rune Echoes**: Flash duration per rune. Free replays.
- **Glyph Race**: Per-puzzle time limit.

### API Changes

- Update `POST /api/games/launch` to accept an optional `skillOverride` field: `{ gameId, difficulty, timeLimit, skillOverride?: string }`
- Update `GET /api/games/[sessionId]` to include the skill mapping so the client can look up the player's stats
- The client calculates the difficulty multiplier locally using the player's cached character sheet data

---

## 5. New Games

All games use the dark fantasy visual style. Gold accents, dark backgrounds, Underdark theming. All games run locally on each player's device with results submitted to the server on completion. Seeded randomness for competitive fairness.

### 5a. Defuse the Glyph (Cooperative Puzzle)

**Theme**: A magical trap is active. The party must work together to disarm it. Each player sees a DIFFERENT piece of the puzzle on their own screen. They must verbally communicate to solve it. Nobody can show their screen to others.

**Category**: Cooperative / Communication
**Players**: 2-6 (scales content to player count)
**Mapped Skill**: Arcana (INT) by default

**Core Mechanic — Template-Based Puzzles:**

Use pre-designed puzzle templates rather than procedural generation. This ensures every puzzle is solvable, balanced, and has clear logic. Build 10-15 templates per difficulty level for replayability. The seed determines which template is selected and how variables are randomized within it.

**Puzzle Structure (Example with 4 players):**

The trap has 4-6 "nodes" that must be set to the correct state (a color, a symbol, a number, etc.)

- **Player 1 — The Grid**: Sees the nodes arranged spatially. Can interact with them (tap to cycle states). But doesn't know the correct states.
- **Player 2 — The Key**: Sees a mapping table (Symbol A = Red, Symbol B = Blue, etc.) but some entries are marked "UNSTABLE" — those are decoys.
- **Player 3 — The Validator**: Sees which Key entries are real vs unstable, but described indirectly (e.g., "The entry below the spiral is a decoy" or "Entries in the left column are safe").
- **Player 4 — The Sequence**: Sees the order nodes must be activated in, but using Player 2's symbol language, not colors.

With fewer players, combine roles (one player gets two panels). With more players, split information further.

**Flow:**
1. DM launches Defuse the Glyph, configures difficulty and timer
2. All players join the lobby
3. DM starts — each player's screen loads their unique panel
4. A shared countdown timer is visible on all screens
5. Players communicate verbally — "What does the crescent symbol map to?" "Is the third entry safe?" etc.
6. Player 1 sets the nodes based on group consensus
7. Player 1 hits "DEFUSE" when ready
8. Success: All nodes correct → victory animation on all screens, DM sees success
9. Failure: Wrong nodes or timer expires → failure animation, DM sees which nodes were wrong

**Difficulty Levels:**
- **Easy**: 3 nodes, generous timer (5 min), straightforward clues, fewer decoys
- **Medium**: 4-5 nodes, moderate timer (3 min), indirect clues, more decoys
- **Hard**: 6 nodes, tight timer (2 min), abstract/riddle-based clues, many decoys

**Stat Influence (INT/Arcana):**
- Higher bonus → fewer decoy entries on your panel, or a brief "hint flash" that highlights the correct info for 1 second at the start

**Technical:**
- Each player's panel is determined by their player index in the session
- The puzzle template + seed generates all the correct answers, clue distributions, and decoys
- Only Player 1 (The Grid) submits the final answer
- The server validates the answer against the template's solution

---

### 5b. Lockpicking (Maze/Dexterity Game)

**Theme**: Navigate a lockpick through the internal mechanism of a lock without touching the walls. Think Operation meets a maze.

**Category**: Dexterity / Skill Check Replacement
**Players**: 1 (solo, but multiple players can play sequentially with scores compared)
**Mapped Skill**: Sleight of Hand (DEX) by default

**Core Mechanic:**
- Top-down view of a lock's internal maze
- The "pick" is a small glowing dot that the player controls
- Navigate from the entry point (left side) to the lock mechanism (right side)
- Touching a wall = a "click" (strike). Visual/haptic feedback (screen flash, vibration if supported)
- 3 strikes = pick breaks (fail). The game ends with time-to-failure as the score.
- Successfully reaching the end = completion. Score = time to complete (lower is better).

**Controls:**
- **Mobile**: Drag finger to move the pick. The pick follows the finger position (with slight offset so your finger doesn't cover it).
- **Desktop**: Mouse movement. The pick follows the cursor.

**NOT timed by default** — the tension comes purely from "don't touch the walls." The DM can optionally set a timer when launching ("the guards return in 60 seconds") which adds a countdown.

**Difficulty Levels:**
- **Easy**: Wide corridors (24px+), simple path with few turns, no moving elements
- **Medium**: Narrower corridors (16px), more complex path with dead ends, 1-2 spring pins (sections of wall that slide back and forth slowly)
- **Hard**: Tight corridors (10px), labyrinthine path, multiple spring pins moving at different speeds, some one-way gates

**Stat Influence (DEX/Sleight of Hand):**
- Higher bonus → wider corridors (multiplied by difficulty modifier), more allowed strikes (3 base + bonus/4 rounded down, so a +8 gives 5 strikes)
- Spring pins move slightly slower

**Maze Generation:**
- Use seeded procedural maze generation (recursive backtracking or similar algorithm)
- Seed ensures all players face the same maze
- Post-process to ensure the solution path meets minimum corridor width for the difficulty level

**Visuals:**
- Dark metallic background (inside of a lock)
- Walls are brass/iron colored
- The pick glows faintly gold
- On strike: red flash on the walls, the pick briefly turns red
- On success: the lock mechanism turns with a satisfying "click" animation
- Strike counter displayed as small pick icons (filled = remaining, dimmed = used)

---

### 5c. Stealth Sequence (Timing/Stealth Game)

**Theme**: Sneak past patrolling guards in a drow outpost. Move when they're not looking. Get caught and the infiltration fails.

**Category**: Timing / Skill Check Replacement
**Players**: All players simultaneously (group stealth check replacement)
**Mapped Skill**: Stealth (DEX) by default

**Core Mechanic:**
- Top-down grid view (8x8 to 12x12 depending on difficulty)
- Player starts at the bottom, exit is at the top
- Guards patrol the grid in set patterns (back-and-forth, L-shaped, circular)
- Guards have **vision cones** — triangular areas in front of them that they can "see"
- The game runs on a **beat system**: every 1.5 seconds is one beat
- On each beat: guards move one step and their vision cones update
- **Between beats**: the player can tap an adjacent square to move (up, down, left, right — no diagonal)
- If the player is in ANY guard's vision cone when the beat hits → **CAUGHT** (fail)
- Reach the exit → success. Score = number of beats taken (lower is better)

**Group Play:**
- All players play the SAME map simultaneously on their own devices (same seed = same guard patterns)
- Each player's success/failure is independent
- The DM sees a results screen: "4/6 players made it through"
- The DM can decide narratively what partial success means

**Guards:**
- **Patrol Guard**: Walks a fixed path back and forth. Predictable. Vision cone faces movement direction.
- **Rotating Guard**: Stands still but rotates their vision cone 90° each beat (N→E→S→W)
- **Erratic Guard** (Hard only): Pauses randomly for 1-2 extra beats, then moves. Throws off timing.

**Difficulty Levels:**
- **Easy**: 8x8 grid, 2-3 patrol guards, no rotating guards, wide safe corridors
- **Medium**: 10x10 grid, 3-4 patrols + 1-2 rotating guards, tighter paths
- **Hard**: 12x12 grid, 4-5 patrols + 2-3 rotating + 1 erratic guard, very tight windows

**Stat Influence (DEX/Stealth):**
- Higher bonus → a brief "warning flash" shows on squares that will be in a vision cone NEXT beat (duration: 0.3s base + 0.05s per bonus point). This gives high-stealth characters a preview of danger.
- Higher bonus → 1 free "close call" (if caught, the first time is forgiven and the player gets a warning flash instead). Bonus of +6 or higher = 2 free close calls.

**Visuals:**
- Dark stone grid floor. Walls/obstacles as darker blocks.
- Guards as small drow silhouettes with visible vision cones (semi-transparent red/purple triangles)
- Player character as a small glowing dot in their player color
- The exit glows gold
- On beat: a subtle pulse/ripple across the grid
- On caught: red flash, guard turns toward player, "DETECTED" text

---

### 5d. Drinking Contest (Rhythm Game)

**Theme**: You're in a tavern. Mugs are flowing. Match the rhythm to keep drinking. Last one standing wins.

**Category**: Rhythm / Endurance
**Players**: All players simultaneously (competitive)
**Mapped Skill**: Constitution (raw score, no skill)

**Core Mechanic:**
- A marker (a mug, a glowing orb, etc.) oscillates back and forth along a horizontal bar
- There's a "sweet spot" zone in the center of the bar
- Tap/click when the marker is inside the sweet spot = successful drink
- Miss the sweet spot = stumble. 3 stumbles = you're out (passed out)
- Each successful drink advances to the next round

**Progression (Drunkenness):**
- **Rounds 1-5**: Marker moves at steady pace. Sweet spot is generous. Easy to hit.
- **Rounds 6-10**: Marker speeds up. Sweet spot shrinks slightly. Screen starts to subtly tilt/sway.
- **Rounds 11-15**: Marker moves erratically (stutters, changes speed mid-swing). Sweet spot shrinks more. Screen blur effect. Colors start shifting.
- **Rounds 16-20**: Marker is fast and erratic. Sweet spot is tiny. Screen is tilting, blurring, and the bar itself starts swaying. Double-vision effect (two markers, only one is real).
- **Round 20+**: Survival mode. It only gets worse.

**"Burp" Mechanic:**
- Every 5 rounds, there's a "BURP" round where the marker freezes briefly and the player must NOT tap. Tapping during a burp = stumble. This adds a rhythm-break that catches players who are just spam-tapping.
- Visual: the mug overflows / the character hiccups. A "WAIT!" indicator flashes.

**Scoring:**
- All players play simultaneously on their own devices
- Score = total rounds survived
- Last player standing wins
- If multiple players survive the same round, the one who hit closest to center on their last tap wins the tiebreaker

**Stat Influence (CON):**
- Higher CON → sweet spot shrinks slower (each round shrinks it by `base_shrink * difficulty_multiplier`)
- Higher CON → screen effects (blur, tilt) kick in 2-3 rounds later
- Higher CON → 1 extra stumble allowed (4 instead of 3) at CON 16+

**Visuals:**
- Tavern background (warm wood tones — a contrast to the usual dark cavern aesthetic)
- The bar/slider is a wooden tavern bar
- The marker is a sloshing mug
- Sweet spot zone glows gold
- Progressive drunk effects: screen tilt (CSS transform), blur (CSS filter), color shift (hue-rotate), double vision (duplicate overlay with offset)
- On stumble: mug spills animation
- On elimination: character faceplants on the bar

---

### 5e. Spider Swat (Quick Tap Micro-Game)

**Theme**: A swarm of cave spiders drops from the ceiling! Swat them before they scatter!

**Category**: Reflex / Micro-Game (Warioware-style)
**Players**: All players simultaneously (competitive)
**Mapped Skill**: Perception (WIS) by default (DM can remap)

**Core Mechanic:**
- Creatures appear at random positions on screen
- Tap/click to swat them before they disappear
- Game lasts 20 seconds (short, intense, Warioware energy)
- Score = total points from successful swats

**Creature Types:**
- **Cave Spider** (common): Appears, sits for 1.5 seconds, disappears. Worth 1 point. Small-medium size.
- **Glowing Spider** (uncommon): Appears briefly (0.8 seconds). Worth 3 points. Slightly smaller. Glows faintly.
- **Scuttler** (rare): Appears and MOVES across the screen quickly. Worth 5 points. Must tap it while it's moving.
- **Baby Spiders** (swarm): A cluster of 5 tiny spiders appears. Each tap gets one. Worth 1 point each but they scatter after 1 second.
- **Friendly Mushroom** (penalty): A small myconid appears. Tapping it = -3 points. Don't swat the mushroom!

**Spawn Rate:**
- Starts with 1 creature every 0.8 seconds
- Accelerates to 1 every 0.3 seconds by the end
- Creature type weighted: 60% cave spider, 15% glowing, 10% scuttler, 10% baby swarm, 5% mushroom

**Stat Influence (WIS/Perception):**
- Higher bonus → creatures stay on screen slightly longer (1.5s base + 0.05s per bonus point for cave spiders, proportional for others)
- Higher bonus → friendly mushrooms are more visually distinct (brighter glow, slight green tint) making them easier to identify and avoid

**Visuals:**
- Dark cave ceiling background (looking up)
- Spiders are dark with glowing eyes (red dots)
- Glowing spiders have a faint purple/blue aura
- On successful tap: squish animation + small splatter
- On mushroom tap: sad myconid face + point deduction flash
- Score counter prominent at the top
- Timer bar draining across the top of the screen
- Final: SWARM CLEARED or point total with ranking

**DM Use Case:**
- Perfect for random encounters: "Spiders drop from the ceiling! Everyone grab your phones!" → 20 seconds later → "Korvash swatted 23, Knaz got 18, Jaedo accidentally punched a mushroom"
- Can be launched rapid-fire multiple times
- Score could influence narrative: highest score gets first pick of loot, lowest score takes 1d4 bite damage, etc.

---

## Implementation Priority

Build in this order:

1. **Navbar fix** — quick, one line change essentially
2. **Glyph Race fixes** — puzzle type replacement + timeout behavior
3. **Stalactite Storm rebuild** — complete rewrite with proper game loop
4. **My Character page** — data model, API, UI
5. **Ability Score → Difficulty system** — the multiplier logic and DM skill picker in game launcher
6. **Spider Swat** — simplest new game, proves the pattern
7. **Lockpicking** — solo dexterity game
8. **Drinking Contest** — multiplayer rhythm game
9. **Stealth Sequence** — most complex solo game (grid, guards, vision cones)
10. **Defuse the Glyph** — most complex overall (unique panels per player, cooperative)