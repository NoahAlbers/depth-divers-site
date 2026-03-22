# Feature Request: Game Retry in Launcher, Arcane Conduit Remake, DM Launch Settings

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. Retry Requests Visible in Game Launcher

When a player requests a retry for a game, the request should be surfaced in the DM's Game Launcher (in the DM Area), not buried in notifications.

### Active Game Session View

When a game session is finished and the DM views it in the Game Launcher or game history, show a **"Retry Requests"** section:

- List each pending retry request with:
  - Player name (in their color)
  - Their current score
  - When they requested the retry
  - Two buttons: **"Approve"** (green) and **"Deny"** (red)
- Approving clears that player's result and allows them to play again
- Denying dismisses the request and notifies the player
- If there are no pending requests, this section is hidden

### Game Launcher Dashboard

At the top of the Game Launcher section (before the game selection grid), show a **notification bar** if there are any pending retry requests across ANY game session:

- "🔄 2 retry requests pending" — clickable, expands to show which players requested retries for which games
- This ensures the DM doesn't miss retry requests even if they're not actively looking at a specific game session

### Push Notification to DM

When a player submits a retry request, send a push notification to the DM: "[Player Name] is requesting a retry for [Game Name]"

---

## 2. Arcane Conduit — Complete Remake (Pipe Dream Style)

### Overview

Completely rebuild Arcane Conduit to match the gameplay of **Pipe Dream / Pipe Mania** — a real-time pipe placement game where the player places randomly queued pipe pieces on a grid before the flowing arcane energy reaches an open end.

This is a fundamentally different game from the current "rotate static pipes" version. The current version should be entirely replaced.

### Core Mechanic

- The player is presented with a **grid** (size varies by difficulty)
- Somewhere on the grid is a **source crystal** — arcane energy will begin flowing from this point after a short delay
- The player receives **random pipe pieces** from a queue/dispenser (visible: next 4-5 upcoming pieces)
- The player **places pipe pieces on empty grid cells** by tapping/clicking a cell — the next piece from the queue is placed there
- The arcane energy (the "flow") begins after the initial delay and flows through connected pipe segments at a steady speed
- The player must keep building the pipeline ahead of the flow to prevent it from reaching an open/dead end
- If the flow reaches a pipe opening that doesn't connect to another pipe → the run ends
- The goal: get the flow through as many pipe segments as possible. Each segment the flow passes through = 1 point. A **minimum segment count** must be reached to "succeed" (pass the level/round)

### Pipe Pieces (7 Types)

1. **Straight Horizontal**: `═` — flow passes left↔right
2. **Straight Vertical**: `║` — flow passes up↔down
3. **Corner Down-Right**: `╔` — flow turns from top→right or left→down
4. **Corner Down-Left**: `╗` — flow turns from top→left or right→down
5. **Corner Up-Right**: `╚` — flow turns from bottom→right or left→up
6. **Corner Up-Left**: `╝` — flow turns from bottom→left or right→up
7. **Cross**: `╬` — flow passes straight through in both directions (horizontal AND vertical). If the flow enters from the left, it exits right. The cross can be used twice (once horizontally, once vertically). Crossing earns bonus points.

Pieces are randomly generated using the session seed. Each piece has roughly equal probability, except crosses which are slightly rarer (~8% instead of ~14%).

### Placement Rules

- Tap/click any empty cell on the grid → the next piece from the queue is placed there
- **Replacing a piece**: If the player places a piece on a cell that already has an UNUSED pipe (flow hasn't reached it yet), the old piece is replaced with the new one. This costs a small score penalty (-1 point) and a brief delay before the next piece can be placed.
- **Cannot replace a piece that flow has already entered** — once the arcane energy is in a pipe, it's locked
- Pieces can be placed anywhere on the grid, not just adjacent to existing pieces — this allows pre-building paths ahead of the flow

### Flow Mechanics

- **Initial delay**: After the game starts, the flow doesn't begin immediately. The player has time to start laying pipes:
  - Easy: 8 seconds delay
  - Medium: 5 seconds delay
  - Hard: 3 seconds delay
- **Flow speed**: The flow moves through one pipe segment every:
  - Easy: 2.0 seconds
  - Medium: 1.5 seconds
  - Hard: 1.0 seconds
- Flow speed gradually increases over time (2% faster every 5 segments)
- **Flow direction**: The flow enters a pipe from one side and exits based on the pipe type. If it exits into an empty cell or a pipe that doesn't accept flow from that direction → game over
- **Cross bonus**: When the flow passes through a cross piece for the second time (from the perpendicular direction), award +3 bonus points
- **Visual**: The flow should visually animate through the pipes — a glowing arcane energy that fills each pipe segment progressively (not instantly). Think of liquid flowing through transparent tubes.

### Special Tiles (Medium and Hard)

- **Blocked cells** (Medium+): Some grid cells are walls/obstacles that cannot have pipes placed on them. These force the player to route around them.
- **Reservoir** (Hard): A special tile pre-placed on the grid that slows the flow to half speed while passing through it. Strategic to route through for extra building time.
- **End crystal** (Hard): A target endpoint on the grid. The flow MUST reach this crystal to succeed. Reaching the minimum segment count isn't enough — the path must terminate at the end crystal. This adds a directional challenge.

### Multi-Round Support

The DM can configure the number of **rounds** when launching:

- **1 round** (default): Single game, highest score wins
- **3 rounds**: Three consecutive games. Total score across all rounds determines the winner. Each round can have a different grid layout (different seed per round, but all players share the same seed per round).
- **5 rounds**: Five consecutive games. Highest total wins.
- Between rounds: show a brief scoreboard (5 seconds), then auto-advance to the next round
- The grid layout, source position, and blocked cells change each round (derived from seed + round number)

### Scoring

- **+1 point** per pipe segment the flow passes through
- **+3 bonus** for each cross piece used twice (flow passes through both directions)
- **-1 penalty** for replacing an unused pipe piece
- **+5 bonus** for reaching the end crystal (Hard difficulty)
- **+10 bonus** for using every cell on the grid (rare, massive achievement)
- If the player doesn't reach the minimum segment count → their score is recorded but flagged as "incomplete"

**Minimum segment count:**
- Easy: 10 segments
- Medium: 16 segments
- Hard: 22 segments

### Solvability Checks

Since pieces are random, it's theoretically possible to get an unsolvable sequence. Mitigate this:

- **Queue look-ahead**: The player can see the next 5 pieces. This gives them planning ability.
- **Guaranteed useful pieces**: The random generation algorithm ensures that within every 7 consecutive pieces, at least one of each basic direction (horizontal, vertical, and at least 2 different corners) appears. This prevents long streaks of unusable pieces.
- **Replace mechanic**: The ability to overwrite unused pieces means the player can always "dump" a bad piece on an unused cell and wait for a better one.
- **For Hard difficulty with end crystal**: The seed-based level generation must verify that a valid path EXISTS from the source to the end crystal, considering the blocked cells. If no valid path exists, regenerate with an incremented seed.

### Grid Size

- **Easy**: 7x7 grid
- **Medium**: 9x9 grid  
- **Hard**: 10x10 grid

### Controls

- **Mobile**: Tap a cell to place the next pipe piece there. The queue is displayed vertically on the side of the grid.
- **Desktop**: Click a cell. Alternatively, use the mouse to hover over a cell (shows a ghost preview of the next piece) and click to place.
- The next piece in the queue should be highlighted/enlarged so the player always knows what they're about to place

### DM Launch Settings

When launching Arcane Conduit, the DM can configure:

- **Difficulty**: Easy / Medium / Hard
- **Rounds**: 1 / 3 / 5
- **Time limit** (optional): 0 (no limit, play until flow ends) / 60s / 120s / 180s — if set, the game ends when time runs out regardless of flow state. Score = segments filled at that point.
- **Skill override**: Default INT / Arcana

### Stat Influence (INT / Arcana)

- Higher bonus → initial delay before flow starts is slightly longer (+0.3s per bonus point)
- Higher bonus → flow speed is slightly slower (multiplied by difficulty modifier)
- Higher bonus → queue shows one extra piece (6 instead of 5)

### Visuals

- **Grid**: Dark stone floor with carved channels where pipes will sit
- **Pipe pieces**: Metallic/crystalline tubes with a slight glow on their edges
- **Flow**: Bright arcane energy (gold/purple gradient) that visually fills each pipe segment as it flows through. The flow should animate smoothly — not jump from segment to segment but visually travel through.
- **Source crystal**: Pulsing gold/purple gem on the grid. Energy emanates from it.
- **End crystal** (Hard): Similar gem but a different color (blue/silver) pulsing as a target.
- **Queue/dispenser**: Displayed as a vertical column of upcoming pieces on the left (or right) side of the grid. The next piece is larger/highlighted.
- **Blocked cells**: Cracked dark stone or rubble — clearly different from empty cells.
- **Reservoir**: A wider, glowing pool section — visually distinct.
- **Score display**: Top of screen, showing current segment count, target count, and bonus points.
- **Flow warning**: When the flow is 2-3 segments away from an open end, the open end flashes red to warn the player they need to extend the path.

---

## 3. DM Launch Settings — Global Improvements

For ALL games (not just Arcane Conduit), ensure the DM Game Launcher configuration screen includes:

### Standard Settings (Every Game)

- **Difficulty**: Easy / Medium / Hard — with a description of what changes per difficulty for that specific game
- **Skill override**: Dropdown of all 18 skills + 6 raw ability scores. Defaults to the game's standard mapping. Include a tooltip: "This affects difficulty scaling based on players' character sheets."

### Game-Specific Settings

Each game should expose its unique configuration options. Compile all of these in the launcher:

| Game | Custom Settings |
|------|----------------|
| **Arcane Conduit** | Rounds (1/3/5), Time limit (none/60s/120s/180s) |
| **Rune Echoes** | Starting sequence length (3/4/5), Flash speed override |
| **Glyph Race** | Number of puzzles (3/5/7), Puzzle types to include (checkboxes) |
| **Stalactite Storm** | Starting speed (slow/normal/fast) |
| **Spider Swat** | Duration (15s/20s/30s), Include penalty mushrooms (yes/no) |
| **Lockpicking** | Timer (none/30s/60s/90s), Moving pins (yes/no) |
| **Stealth Sequence** | Grid size override, Guard count override |
| **Drinking Contest** | Starting round (1/5/10 — skip easy rounds for experienced players) |
| **Defuse the Glyph** | Timer (2min/3min/5min/8min), Number of nodes (3/4/5/6) |
| **Underdark Telephone** | Prompt mode (DM/auto/player), Drawing time (30s/45s/60s/90s), Writing time (15s/20s/30s/45s), Rounds (auto/manual number) |

### Settings Preview

After configuring, before launching, show a **preview summary**:

```
Arcane Conduit — Medium Difficulty
Rounds: 3
Time Limit: None
Skill: INT / Arcana
Players will receive random pipe pieces and must build 
a path for arcane energy before it overflows.
[Launch Game]  [Back]
```

This gives the DM a final confirmation before launching.

---

## Implementation Priority

1. **Retry requests in Game Launcher** — straightforward UI addition
2. **DM launch settings improvements** — config screen polish for all games
3. **Arcane Conduit remake** — complete rebuild with Pipe Dream mechanics