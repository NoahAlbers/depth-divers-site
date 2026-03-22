# Feature Request: Game Lobby Instructions & Arcane Conduit Tuning

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. Game Lobby — "How to Play" Instructions Screen

Before every game starts, after players join the lobby and before the DM hits "Start," each player should see a **"How to Play" instructions screen** on their device. This screen teaches them the game before they're thrown into it.

### Layout

When a player joins a game lobby, their screen shows:

```
┌──────────────────────────────────┐
│  [Game Icon]  ARCANE CONDUIT     │
│  Category: Puzzle | ~2-5 min     │
├──────────────────────────────────┤
│                                  │
│  HOW TO PLAY                     │
│                                  │
│  [Visual diagrams / examples]    │
│  [Step-by-step rules]            │
│                                  │
│  YOUR STAT BONUS                 │
│  [Skill info + their bonus]      │
│                                  │
├──────────────────────────────────┤
│  Waiting for DM to start...      │
│  Players ready: 4/6              │
│  [✓ Ready]                       │
└──────────────────────────────────┘
```

### Contents (Per Game)

Each game has a custom instructions screen with:

1. **Game name, icon, and category** at the top
2. **Goal**: One sentence explaining what they're trying to do. Bold and clear.
3. **How it works**: 3-5 bullet points explaining the core mechanic. Keep it short — players won't read paragraphs.
4. **Visual guide**: Game-specific diagrams or illustrations showing key concepts. This is the most important part — show, don't tell.
5. **Scoring**: How they earn points / how the winner is determined.
6. **Stat influence**: Which skill/ability affects their difficulty, what their current bonus is, and what it does for them. Example: "Your Arcana bonus (+5) gives you a slightly longer setup time and an extra piece in the queue."
7. **Difficulty**: The current difficulty setting and what it means for this game.

### Arcane Conduit Instructions (Example)

**Goal:** Build a pipeline of arcane conduits to channel magical energy as far as possible before it overflows.

**How it works:**
- Pipe pieces appear in a queue on the left. Tap any cell on the grid to place the next piece.
- After a short delay, arcane energy begins flowing from the **source crystal** (purple diamond ◆).
- The energy flows through connected pipes. Keep building ahead of it!
- If the energy reaches an open pipe end with nowhere to go — overflow. Game over.
- Reach the minimum segment count to succeed. More segments = more points.

**Visual guide:**
- Show all 7 pipe types with labels: "Straight ═", "Corner ╗", "Cross ╬ (bonus points!)"
- Show the source crystal icon with an arrow indicating flow direction: "Energy flows FROM here"
- Show the end crystal icon (if Hard): "Energy must reach HERE"
- Show a mini example of 4-5 connected pipes with arrows showing flow direction
- Show what "replacing" a pipe looks like: "Tap an unused pipe to replace it (-1 point penalty)"

**Scoring:** +1 per segment, +3 per cross used twice, -1 per replaced pipe. Reach [X] segments to complete.

**Your stat bonus:** "Arcana (+5) → Longer setup delay before energy starts flowing, extra queue visibility"

### Instructions for Other Games

Each game needs its own instructions screen. Key visual elements per game:

**Rune Echoes:** Show the rune grid, an example flash sequence with arrows, and "repeat the pattern"

**Glyph Race:** Show example puzzle types (math cipher, pattern match) with a sample and solution

**Stalactite Storm:** Show the player character, falling obstacles, and left/right movement controls

**Spider Swat:** Show spider types with point values, especially highlight the mushroom penalty

**Lockpicking:** Show the maze, the pick dot, walls, and the "3 strikes" mechanic

**Stealth Sequence:** Show the grid, a guard with vision cone, the beat indicator, and safe vs dangerous cells

**Drinking Contest:** Show the oscillating marker, the sweet spot zone, and what happens as rounds progress

**Defuse the Glyph:** Explain that each player sees different info, they must talk to solve it, and show a simplified example of how clues connect

**Underdark Telephone:** Show the write → draw → write → draw cycle with a funny example

### Implementation

- Create a `GameInstructions` component that takes a `gameId` and renders the appropriate instructions
- Each game's instructions are defined as a config object with text, visual elements, and stat info
- The visual guides can be simple inline SVGs, styled divs, or small canvas renders — they don't need to be elaborate, just clear
- The instructions screen is shown in the game lobby view (`/games/[sessionId]`) before the DM starts the game
- Players can scroll through the instructions while waiting
- Once the DM hits "Start," the instructions screen transitions to the actual game

---

## 2. Arcane Conduit — Tuning Fixes

The current Arcane Conduit has several playability issues based on testing. Apply these fixes:

### 2a. Flow Starts Way Too Fast

The initial delay before flow starts is too short, especially for players who've never played before. They barely have time to understand the grid before energy is flowing.

**Fix — Increase initial delays significantly:**
- Easy: **15 seconds** (was 8s)
- Medium: **10 seconds** (was 5s)  
- Hard: **6 seconds** (was 3s)

Additionally, add a **visual countdown** that's prominent on screen during the delay:
- Large text in the center of the grid: "FLOW STARTS IN 12..." counting down
- The text should pulse and change color in the last 3 seconds (gold → orange → red)
- This gives players a clear sense of urgency and how much prep time they have left

### 2b. Flow Speed Too Fast in Early Segments

Even after the delay, the flow moves too quickly for new players to build ahead of it.

**Fix — Slower initial flow speed, gradual ramp:**
- Easy: **3.0 seconds** per segment for the first 5 segments, then gradually speed up to 2.0s by segment 15
- Medium: **2.5 seconds** per segment for the first 5 segments, ramping to 1.5s by segment 15
- Hard: **2.0 seconds** per segment for the first 3 segments, ramping to 1.0s by segment 12

Use a smooth interpolation rather than a sudden jump:
```typescript
function getFlowSpeed(difficulty: string, segmentCount: number): number {
  const configs = {
    easy: { start: 3.0, end: 1.8, rampSegments: 15 },
    medium: { start: 2.5, end: 1.3, rampSegments: 15 },
    hard: { start: 2.0, end: 0.8, rampSegments: 12 },
  };
  const c = configs[difficulty];
  const t = Math.min(segmentCount / c.rampSegments, 1);
  return c.start + (c.end - c.start) * t; // Linear interpolation
}
```

### 2c. Source and End Crystals Not Obvious Enough

Players don't immediately understand where energy flows from or where it needs to go.

**Fix — Make source and destination much more visually prominent:**

**Source crystal:**
- Larger pulsing animation (scale 1.0 → 1.2 → 1.0, repeating)
- Radiating particle effect — small glowing dots emanating outward from the crystal
- A clear **arrow** pointing in the flow direction, extending from the crystal into the adjacent cell
- Label text above or below: "START" in small purple text
- The source cell's background should have a faint purple glow

**End crystal (Hard difficulty):**
- Same pulsing treatment but in blue
- Radiating particles in blue
- Label: "END" in small blue text  
- The end cell's background should have a faint blue glow
- A subtle dotted line or breadcrumb trail could hint at the general direction (not the exact path) from source to end

**First-time hint:**
- On the very first beat (before flow starts), briefly flash the cells adjacent to the source crystal that could receive flow, with a pulsing highlight and text: "Build pipes starting here →"
- This disappears after 3 seconds or when the player places their first pipe

### 2d. Queue Not Obvious Enough

The queue on the left side is easy to miss, especially on mobile.

**Fix:**
- The next piece in the queue should be **larger** and more prominently highlighted (current implementation does this but increase the size differential — next piece should be ~80% of cell size, others ~40%)
- Add a small animated arrow pointing from the next piece toward the grid: "Place this →"
- The queue label "NEXT" should be more prominent — slightly larger font, gold color
- On mobile, consider placing the queue **below** the grid instead of to the left (since vertical space is more available than horizontal on phones). Detect orientation/screen width and adjust layout.

### 2e. Replacing Pipes Not Discoverable

Players don't realize they can overwrite unused pipes.

**Fix:**
- In the instructions screen (Section 1), explicitly show this mechanic with a visual
- When a player taps a cell that already has an unused pipe, show a brief toast/hint the first time: "Pipe replaced! (-1 point)" — only show this hint once per game session
- The replaced pipe should have a brief visual effect (the old pipe fades out, new pipe fades in) to make the replacement feel intentional, not like a misclick

---

## Implementation Priority

1. **Arcane Conduit tuning** (2a-2e) — immediate playability improvements
2. **Game lobby instructions screen** — component structure + Arcane Conduit instructions first
3. **Instructions for remaining games** — fill in each game's instructions using the same component