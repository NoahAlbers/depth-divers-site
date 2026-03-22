# Feature Request: Defuse the Glyph — Complete Overhaul

**Repo**: https://github.com/NoahAlbers/depth-divers-site

Reference: `components/games/defuse-the-glyph.tsx` and `lib/games/defuse-the-glyph.ts`

---

## Overview

Defuse the Glyph needs to be rebuilt from the ground up as a proper cooperative asymmetric information game. Currently it shows all puzzle info to one player (solo mode essentially). The entire point of this game is that **each player sees DIFFERENT information on their own screen** and must **verbally communicate** to solve it together.

This is the "Keep Talking and Nobody Explodes" of Depth Divers. It should be the most memorable game in the entire system.

---

## Core Design Principles

1. **No player sees the full picture.** Every player has a piece. No single screen contains enough info to solve the puzzle alone.
2. **Players MUST talk to each other.** The game is unsolvable in silence.
3. **One player acts.** Only the "Operator" can interact with the puzzle. Everyone else reads, interprets, and advises.
4. **Information is noisy.** Decoys, ambiguity, and indirect clues force careful communication.
5. **Time pressure creates drama.** A visible countdown on all screens drives urgency.
6. **Scales from 2 to 6 players.** With fewer players, each person gets more panels. With more, information is split finer.

---

## Player Roles

The game assigns **panels** to players. Each panel shows different information. The number of panels and how they're distributed depends on player count.

### Panel Types

There are 5 panel types. With fewer players, some players get multiple panels.

**Panel 1 — The Operator (always exactly 1 player)**
- The ONLY player who can interact with the puzzle
- Sees a grid of **nodes** (colored circles/runes) that can be cycled through states by tapping
- Sees a **DEFUSE button** to submit the final answer
- Does NOT see the key, the sequence, the validator clues, or which mappings are real
- Must rely entirely on other players telling them what to set each node to and in what order

**Panel 2 — The Key Reader**
- Sees a table of **symbol → color mappings**
- Some mappings are REAL and some are DECOYS — but the Key Reader doesn't know which are which
- They can read the symbols and their mapped colors to the group
- Example: "The crescent maps to blue. The diamond maps to red. The spiral maps to green."

**Panel 3 — The Validator**  
- Sees **clues that identify which Key mappings are decoys**
- Clues are indirect — they describe properties of decoy entries rather than naming them directly
- Easy: "The third entry is a decoy" (direct)
- Medium: "Entries mapping to warm colors are decoys" (categorical)
- Hard: "The entry whose symbol has curves is lying" (abstract/descriptive)
- The Validator must interpret their clues and tell the group which mappings to trust

**Panel 4 — The Sequencer**
- Sees the **activation order** — which nodes must be set FIRST, SECOND, THIRD, etc.
- But the nodes are referenced by SYMBOLS (from the Key), not by colors or numbers
- So the Sequencer says "First activate the crescent, then the diamond" and the Key Reader has to translate that to colors, and the Operator has to find and set those colors in order

**Panel 5 — The Observer (only in 5-6 player games)**
- Sees a **partial view of the solution** — knows the CORRECT state of 1-2 specific nodes but not which nodes they are on the Operator's grid
- Described indirectly: "One node must be blue. It's not the first or last node."
- Provides confirmation/contradiction to help the group verify their work
- With 6 players, there are 2 Observers with different partial info

### Panel Distribution by Player Count

| Players | Operator | Key Reader | Validator | Sequencer | Observer |
|---------|----------|------------|-----------|-----------|----------|
| 2 | Player 1 | Player 2 | Player 2 | Player 2 | — |
| 3 | Player 1 | Player 2 | Player 3 | Player 2 or 3* | — |
| 4 | Player 1 | Player 2 | Player 3 | Player 4 | — |
| 5 | Player 1 | Player 2 | Player 3 | Player 4 | Player 5 |
| 6 | Player 1 | Player 2 | Player 3 | Player 4 | Player 5 + 6 |

*With 3 players, the Sequencer panel is given to whichever of Player 2 or 3 has fewer clues on their existing panel (determined by seed).

### How Panels Are Assigned

- The DM launches the game. Players join the lobby.
- The Operator is assigned based on the seed + player list order (or the DM can manually assign the Operator in the launch settings).
- Remaining panels are distributed in order. Each player's screen shows ONLY their assigned panel(s).
- The DM's screen shows ALL panels (god view) so they can monitor progress and give hints if the group is stuck.

---

## The Puzzle Structure

### Nodes

- **Easy**: 3 nodes
- **Medium**: 4-5 nodes
- **Hard**: 5-6 nodes

Each node must be set to a specific **color state**. Available colors: Red, Blue, Green, Purple (4 options per node).

The Operator sees the nodes as large tappable circles numbered 1 through N. Tapping cycles through the colors: Red → Blue → Green → Purple → Red.

### Key Mappings

Each node has a corresponding **symbol** and a correct **color**.

The Key Reader's panel shows ALL symbols with their color mappings — but some are decoys.

- **Easy**: 1 decoy entry (out of 4-5 total)
- **Medium**: 2 decoy entries (out of 6-7 total)  
- **Hard**: 3-4 decoy entries (out of 8-9 total)

Decoy entries look identical to real entries. Only the Validator's clues reveal which are fake.

### Validator Clues

Clues that help identify decoys. The clues scale in abstractness:

**Easy clues** (direct):
- "Entry #3 is a decoy"
- "The mapping for the star symbol is wrong"
- "Ignore any entry that maps to green"

**Medium clues** (categorical/logical):
- "Entries with angular symbols (triangle, diamond, square) are all trustworthy"
- "Exactly one mapping to a warm color (red, purple) is a decoy"
- "The decoy entry is between two real entries in the list"

**Hard clues** (abstract/riddle):
- "The symbol that looks like it could hold water is lying"
- "If you read the colors top to bottom, the decoy breaks the pattern"
- "The entry that shares no visual similarity with its neighbors is false"
- "Trust the symbols that are symmetrical. Question the rest."

### Activation Sequence

The Sequencer sees the order in which nodes must be ACTIVATED (set to their correct color). The order matters — if the Operator sets node 3 before node 1, it fails even if the colors are right.

The sequence is described using SYMBOLS, not node numbers or colors. This forces communication through the Key Reader to translate symbols → colors, which the Operator then matches to node positions.

- **Easy**: No sequence required — just get the colors right
- **Medium**: Sequence matters for the last 2 nodes (the first N-2 can be set in any order)
- **Hard**: Full sequence — every node must be set in the exact order

---

## Stat Influence (INT / Arcana)

Each player's Arcana bonus affects their individual panel:

**Operator** (higher bonus →):
- Nodes briefly flash their correct color for 0.5s at game start (hint flash)
- At very high bonus (+7 or higher): one node starts pre-set to the correct color

**Key Reader** (higher bonus →):
- Decoy entries have a subtle visual difference (slightly dimmer text, faint border) — not obvious, but a perceptive player might notice
- At very high bonus: one decoy is explicitly marked with a small "?" icon

**Validator** (higher bonus →):
- One extra clue is provided (e.g., Easy gets 2 clues instead of 1)
- Clues are slightly more direct (one difficulty tier easier in phrasing)

**Sequencer** (higher bonus →):
- The sequence shows one extra piece of info: which symbol is FIRST (even on Hard where normally they'd have to figure out the whole order)

**Observer** (higher bonus →):
- Knows the state of one additional node (2-3 instead of 1-2)

---

## Game Flow

### 1. Lobby
- Players join. The instructions screen explains the game and each role.
- Players see which role they've been assigned.
- DM can optionally reassign the Operator.
- DM hits "Start."

### 2. Countdown Intro (3 seconds)
- All screens show: "DEFUSE THE GLYPH" with a dramatic countdown 3... 2... 1...
- Then each player's screen transitions to their unique panel.

### 3. Active Game
- The shared countdown timer is visible on ALL screens (top of the screen, prominent)
- Timer is synced via server timestamp (same approach as the Countdown Timer tool — all clients calculate locally from `startedAt`)
- Players talk, debate, and direct the Operator.
- The Operator sets nodes and can hit DEFUSE when the group is confident.

### 4. Defuse Attempt
- When the Operator hits DEFUSE:
  - **Check colors**: Are all nodes set to the correct color?
  - **Check sequence** (Medium/Hard): Were the nodes set in the correct order? Track the order in which the Operator changed each node to its final correct color.
  - If BOTH pass → **SUCCESS**. All screens flash green. "DEFUSED!" celebration.
  - If colors are wrong → **FAILURE — WRONG COLORS**. All screens flash red. Show which nodes were wrong (highlighted on the Operator's grid).
  - If colors are right but sequence is wrong → **FAILURE — WRONG SEQUENCE**. All screens flash orange. "Correct colors, wrong order!"

### 5. Multiple Attempts
- On failure, the game does NOT end immediately (unless the timer runs out).
- The Operator can try again. The group can re-discuss.
- Each failed attempt costs a **time penalty**: 15 seconds removed from the remaining timer.
- After 3 failed attempts on Hard (or timer runs out) → forced failure.

### 6. Results
- **Success**: Score = time remaining (higher is better). All players share the same score.
- **Failure**: Score = 0. Metadata records: timed out, wrong colors, wrong sequence, number of attempts.

---

## UI Design

### Operator Panel

```
┌────────────────────────────┐
│  ⏱ 2:34        OPERATOR   │
├────────────────────────────┤
│                            │
│   ①    ②    ③    ④        │
│  🔴   🔵   🟢   🟣       │
│                            │
│  Tap a node to cycle its   │
│  color. Set all correctly  │
│  then hit DEFUSE.          │
│                            │
│  [═══ DEFUSE ═══]          │
│                            │
│  Attempts: 0/3             │
└────────────────────────────┘
```

- Nodes are LARGE (80x80px minimum) colored circles with numbers inside
- Tapping cycles: Red → Blue → Green → Purple → Red
- Current color shown as both the fill color AND a text label below (for colorblind accessibility)
- DEFUSE button is large, gold, and prominent at the bottom
- Attempt counter shows how many tries remain

### Key Reader Panel

```
┌────────────────────────────┐
│  ⏱ 2:34      KEY READER   │
├────────────────────────────┤
│                            │
│  Symbol Mappings:          │
│                            │
│  ☽ Crescent  →  Blue      │
│  ◆ Diamond   →  Red       │
│  ✦ Star      →  Green     │
│  ⬡ Hexagon   →  Purple    │
│  ∞ Infinity  →  Red       │
│  ▲ Triangle  →  Blue      │
│                            │
│  Read these to your team.  │
│  Some may be decoys!       │
└────────────────────────────┘
```

- Clean list with symbol, name, arrow, and color (color name displayed in that color)
- Each entry has a colored dot/swatch next to the color name
- Decoy entries look IDENTICAL to real ones (no visual hint unless the player's stat bonus provides one)

### Validator Panel

```
┌────────────────────────────┐
│  ⏱ 2:34      VALIDATOR    │
├────────────────────────────┤
│                            │
│  Your clues about the Key: │
│                            │
│  • "The mapping for the    │
│     symbol with curves is  │
│     a decoy."              │
│                            │
│  • "Entries mapping to     │
│     warm colors are all    │
│     trustworthy."          │
│                            │
│  Tell your team which      │
│  Key entries to trust.     │
└────────────────────────────┘
```

- Clues displayed as styled quote blocks
- Clear instruction text explaining the Validator's job

### Sequencer Panel

```
┌────────────────────────────┐
│  ⏱ 2:34      SEQUENCER    │
├────────────────────────────┤
│                            │
│  Activation Order:         │
│                            │
│  1st → ☽ (Crescent)       │
│  2nd → ▲ (Triangle)       │
│  3rd → ◆ (Diamond)        │
│  4th → ✦ (Star)           │
│                            │
│  Nodes must be set in      │
│  this order. Tell the      │
│  Operator which to do      │
│  first!                    │
└────────────────────────────┘
```

- Numbered list with symbols
- Clear step-by-step format

### Observer Panel

```
┌────────────────────────────┐
│  ⏱ 2:34       OBSERVER    │
├────────────────────────────┤
│                            │
│  You know the following:   │
│                            │
│  • One node must be set    │
│    to BLUE. It is NOT the  │
│    first node.             │
│                            │
│  • The last node is NOT    │
│    green.                  │
│                            │
│  Share this info to help   │
│  verify the team's work.   │
└────────────────────────────┘
```

- Partial solution clues in a clear format
- Phrased as positive and negative constraints

### DM View (God Mode)

The DM sees ALL panels side by side (or tabbed) plus:
- The correct solution displayed clearly
- Which nodes the Operator has set so far (live updates via polling)
- A "Give Hint" button that sends a text hint to all players' screens (appears as a gold notification bar)
- An "End Game" button to force-finish

---

## Puzzle Generation (`lib/games/defuse-the-glyph.ts`)

### Template System

Use hand-crafted **puzzle templates** rather than fully procedural generation. Templates ensure every puzzle is solvable, has clean clue logic, and doesn't accidentally create contradictory information.

Create **10-15 templates per difficulty level** (30-45 total). Each template defines:

```typescript
interface PuzzleTemplate {
  difficulty: "easy" | "medium" | "hard";
  nodeCount: number;
  
  // The correct solution
  solution: NodeState[]; // e.g., ["blue", "red", "green", "purple"]
  
  // Symbol assignments (one per node)
  symbols: { icon: string; name: string }[];
  
  // Key mappings (real + decoys)
  keyEntries: {
    symbol: { icon: string; name: string };
    color: NodeState;
    isDecoy: boolean;
  }[];
  
  // Validator clues
  validatorClues: string[];
  
  // Activation sequence (indexes into nodes, empty array if no sequence required)
  sequence: number[];
  
  // Observer hints
  observerHints: string[];
}
```

The seed selects which template to use and randomizes variable elements within the template (shuffle node positions, swap color assignments, rearrange key entry order). This gives replayability while maintaining quality.

### Symbol Set

Use a consistent set of distinct, describable symbols:

```typescript
const SYMBOLS = [
  { icon: "☽", name: "Crescent" },
  { icon: "◆", name: "Diamond" },
  { icon: "✦", name: "Star" },
  { icon: "⬡", name: "Hexagon" },
  { icon: "∞", name: "Infinity" },
  { icon: "▲", name: "Triangle" },
  { icon: "◎", name: "Bullseye" },
  { icon: "⚡", name: "Lightning" },
  { icon: "♠", name: "Spade" },
  { icon: "⬢", name: "Gem" },
  { icon: "↺", name: "Spiral" },
  { icon: "☀", name: "Sun" },
];
```

Symbols should be visually distinct and easy to describe verbally ("the crescent", "the diamond shape", "the lightning bolt").

---

## Multiplayer Sync

### How Each Player Gets Their Panel

1. When the game starts, the server generates the puzzle from the seed and determines panel assignments based on player count and order.
2. Each player's client calls `GET /api/games/[sessionId]` which returns the session data including the seed and player list.
3. The client generates the puzzle locally from the seed (same deterministic generation).
4. The client determines which panel(s) this player should see based on their index in the player list.
5. The client renders ONLY their assigned panel(s). They never see other panels' data.

This means **no panel data is sent over the network** — each client generates the full puzzle but only displays their portion. This prevents cheating via network inspection.

### Operator Action Sync

The Operator's node changes need to be visible to the DM (for monitoring). Two approaches:

**Approach A (Simple — Recommended):** The Operator's actions are local only. The DM can't see live changes — they just see the final result when DEFUSE is pressed. This is simpler and sufficient since the DM is physically at the table and can observe.

**Approach B (Full sync):** The Operator's node states are posted to the server every time they change. The DM's view polls for updates. More complex but gives the DM a live view.

Recommend Approach A for initial implementation. The DM can always ask the Operator what they've set so far.

### Defuse Submission

When the Operator hits DEFUSE:
1. Client sends `POST /api/games/[sessionId]/result` with `{ nodeStates, setOrder }` 
2. Server generates the puzzle from the seed, validates the submission
3. Server returns success/failure
4. All clients poll for the session status change and display the result

---

## DM Launch Settings

- **Difficulty**: Easy / Medium / Hard
- **Timer**: 2min / 3min / 5min / 8min (default: Easy=5min, Medium=3min, Hard=2min)
- **Assign Operator**: Dropdown to pick which player is the Operator (or "Random" which uses the seed)
- **Max Attempts**: 1 / 2 / 3 / Unlimited (default: 3)
- **Hints Enabled**: Yes/No — whether the DM can send hints during the game
- **Sequence Required**: On Easy, sequence is off by default. DM can toggle it on for extra challenge. On Medium/Hard it's always on.
- **Skill Override**: Default INT / Arcana

---

## Implementation Priority

1. **Puzzle template system** — write 5 templates per difficulty (15 total) as a starting set. More can be added later.
2. **Panel rendering** — create separate components for each panel type (OperatorPanel, KeyReaderPanel, ValidatorPanel, SequencerPanel, ObserverPanel)
3. **Panel assignment logic** — distribute panels based on player count
4. **Operator interaction** — node cycling, sequence tracking, defuse submission
5. **Timer sync** — shared countdown using server timestamp
6. **DM view** — god mode showing all panels + hint system
7. **Result handling** — success/failure states, multiple attempt support, score calculation