# Feature Request: Glyph Race — Complete Overhaul

**Repo**: https://github.com/NoahAlbers/depth-divers-site

Reference: `components/games/glyph-race.tsx` and `lib/games/glyph-race.ts`

---

## Overview

Glyph Race needs to be a fast, fun, Warioware-style rapid-fire puzzle game. The current version has too few puzzle types (mostly math), the anagrams were removed but not properly replaced, and the overall feel is more like a test than a game.

The overhaul goals:
- **10+ distinct puzzle types** so it never feels repetitive
- **Visual puzzles** (not just text/math) — tap-based, spatial, and reaction challenges mixed in
- **Warioware pacing** — each puzzle is fast (5-15 seconds), punchy, and immediately followed by the next
- **Difficulty scaling that feels fair** — Easy should be fun for everyone, Hard should be a real challenge
- **No D&D-specific knowledge required** — anyone can play regardless of campaign knowledge

---

## Puzzle Types

### Category 1: Math & Logic (Text Input)

**1. Quick Math**
- A simple arithmetic problem. Answer is always a whole number.
- Easy: single operation, small numbers (`7 + 5 = ?`, `12 - 3 = ?`)
- Medium: two operations (`4 × 3 + 7 = ?`, `20 ÷ 4 - 2 = ?`)
- Hard: larger numbers, three operations (`15 × 4 - 12 ÷ 3 = ?`)

**2. Rune Cipher**
- Symbols represent numbers. A key shows 2-3 symbol values. Solve for the unknown.
- Easy: `🌙 = 3, ⭐ = 5, 🌙 + ⭐ = ?` → 8
- Medium: `🌙 + ◆ = 10, 🌙 = 4, ◆ = ?` → 6
- Hard: `🌙 × ◆ = 24, 🌙 + ◆ = 10, 🌙 = ?` → 4 or 6

**3. Number Sequence**
- A sequence of numbers with a pattern. What comes next?
- Easy: `2, 4, 6, 8, ?` → 10 (simple addition)
- Medium: `3, 6, 12, 24, ?` → 48 (multiplication)
- Hard: `1, 1, 2, 3, 5, 8, ?` → 13 (fibonacci)

### Category 2: Visual Pattern (Multiple Choice — Tap to Answer)

**4. Pattern Match**
- A grid of symbols/shapes with a pattern. One is missing. Pick the correct one from 4 options.
- Displayed as colored shapes (circles, squares, triangles in different colors)
- Easy: simple color alternation (red, blue, red, blue, ?)
- Medium: two-dimensional pattern (color AND shape alternate)
- Hard: 3x3 grid where rows and columns each follow a rule

**5. Odd One Out**
- 4-6 items displayed. One doesn't belong. Tap it.
- Easy: 5 circles and 1 square
- Medium: shapes that differ in a subtle property (fill vs outline, rotation)
- Hard: complex symbols where the odd one differs in 2 properties

**6. Mirror Match**
- A shape/pattern is shown on the left. Pick its mirror image from 4 options on the right.
- Easy: simple shapes (arrow pointing left → which arrow points right?)
- Medium: multi-part shapes
- Hard: complex asymmetric patterns

**7. Color Count**
- A grid of colored dots flashes for 2-3 seconds, then disappears. "How many RED dots were there?"
- Easy: 3x3 grid, 2 colors, count is 1-5
- Medium: 4x4 grid, 3 colors, count is 3-8
- Hard: 5x5 grid, 4 colors, count flashes for only 1.5 seconds

### Category 3: Reaction & Speed (Tap-Based)

**8. Tap the Target**
- A single target appears at a random position on the puzzle area. Tap it as fast as possible. That's it.
- Score is based on reaction time.
- Easy: large target, stays visible for 3 seconds
- Medium: medium target, visible for 2 seconds
- Hard: small target, visible for 1.5 seconds, might move once

**9. Sequence Repeat**
- 3-5 colored buttons flash in a sequence. Repeat the sequence by tapping them in order.
- Easy: 3 buttons, sequence of 3
- Medium: 4 buttons, sequence of 4
- Hard: 5 buttons, sequence of 5, faster flash speed

**10. Sort Order**
- 3-5 numbers or letters appear scrambled. Tap them in the correct order (ascending for numbers, alphabetical for letters).
- Easy: 3 single-digit numbers
- Medium: 4 numbers (some two-digit)
- Hard: 5 numbers or 5 letters

### Category 4: Word & Spatial (Mixed Input)

**11. Missing Letter**
- A common English word with one letter replaced by `_`. Type the missing letter.
- Easy: short words (`C_T` → A, `D_G` → O)
- Medium: longer words (`BR__GE` → ID, `MO_STER` → N)
- Hard: less common words, multiple missing letters

**12. Spot the Difference**
- Two small grids (3x3 to 5x5) of colored cells side by side. One cell is different. Tap it.
- Easy: 3x3, obvious color difference
- Medium: 4x4, subtle shade difference
- Hard: 5x5, very subtle difference, grid flashes briefly then you must tap from memory

**13. Direction Match**
- An arrow points in a direction. 4 buttons: ↑ ↓ ← →. Tap the matching direction.
- Twist: the text label might say "LEFT" while the arrow points RIGHT. Player must follow the ARROW not the text.
- Easy: arrow and text match (no trick)
- Medium: arrow and text sometimes conflict — follow the arrow
- Hard: arrow, text, AND color all may conflict (arrow is red but points up, text says "down", follow the arrow)

---

## Round Structure

Each game session consists of multiple rounds. Each round is one puzzle.

**Round count by difficulty:**
- Easy: 5 rounds
- Medium: 7 rounds
- Hard: 10 rounds

**Time per round by difficulty:**
- Easy: 15 seconds
- Medium: 10 seconds
- Hard: 7 seconds

**Puzzle selection:**
- The seed determines which puzzles appear and in what order
- The game should select puzzles from DIFFERENT categories across rounds — never two of the same type in a row
- Aim for variety: a math puzzle, then a visual puzzle, then a reaction puzzle, then a word puzzle, etc.
- Each difficulty level has access to all puzzle types — the difficulty setting affects the PARAMETERS within each type (as described above)

**DM can configure:**
- Round count: 3 / 5 / 7 / 10 / 15
- Time per round: 5s / 7s / 10s / 15s / 20s
- Puzzle categories to include (checkboxes): Math & Logic / Visual Pattern / Reaction & Speed / Word & Spatial — DM can uncheck categories to focus on specific types
- If only one category is checked, puzzles cycle through the types within that category

---

## Timeout Behavior (Keep from Previous)

When the per-round timer expires:
- The puzzle is marked as skipped
- The full timer duration is added as penalty time to their total
- The game immediately advances to the next puzzle with a brief "TIME'S UP" flash (1 second)
- The player continues — they are NOT eliminated
- Final score = total time across all rounds (lower is better), including penalties

---

## Visual Overhaul

### Transition Between Rounds
- When a round is solved correctly: **green flash** on the puzzle area, brief "✓" animation, 0.5 second pause, then next puzzle slides in from the right
- When a round is wrong: **red flash**, "✗" shake animation, answer clears, player can try again (timer keeps running)
- When a round times out: **orange flash**, "SKIPPED" text, 0.8 second pause, next puzzle slides in

### Puzzle Area
- The puzzle area should feel like a **magical scroll or tablet** — dark background with a subtle border glow
- Each puzzle type should have a small icon/label in the top-left indicating what kind of puzzle it is (🔢 for math, 👁 for visual, ⚡ for reaction, 📝 for word)
- The puzzle prompt should be large, centered, and immediately readable

### Answer Input
- For **text input** puzzles (math, missing letter): show a text field with a "Go" button, same as current but larger touch targets
- For **multiple choice** puzzles (pattern match, odd one out, mirror match): show 4 large tappable option buttons in a 2x2 grid
- For **tap target** puzzles: the puzzle area itself is the input — just tap
- For **sequence repeat**: colored buttons displayed in a row at the bottom
- For **sort order**: numbered/lettered tiles that the player taps in sequence
- For **spot the difference**: the two grids are tappable — tap the different cell
- For **direction match**: 4 large arrow buttons (↑ ↓ ← →)

### Scoring Display
- Running total time displayed subtly at the bottom
- Round counter prominent at the top
- After all rounds: final score screen with total time, rounds completed, rounds skipped, and a performance rating:
  - Under 15s total (Easy): "Blazing Fast! 🔥"
  - Under 30s total (Easy): "Quick Reflexes! ⚡"
  - Under 60s total (Easy): "Solid Work! 💪"
  - Over 60s / many skips: "The Underdark Waits for No One 🕯️"

---

## Implementation Notes

### Puzzle Generation (`lib/games/glyph-race.ts`)

Refactor `generatePuzzle` to be a router that calls type-specific generators:

```typescript
export function generatePuzzle(seed: number, round: number, difficulty: Difficulty, allowedCategories?: string[]): Puzzle {
  const rng = createRNG(seed + round * 100);
  
  // Select puzzle type (different from previous round)
  const availableTypes = getAvailableTypes(allowedCategories);
  const previousType = round > 0 ? getPreviousType(seed, round - 1, difficulty) : null;
  const filtered = availableTypes.filter(t => t !== previousType);
  const type = filtered[Math.floor(rng() * filtered.length)];
  
  switch (type) {
    case "quick-math": return generateQuickMath(rng, difficulty);
    case "rune-cipher": return generateRuneCipher(rng, difficulty);
    case "number-sequence": return generateNumberSequence(rng, difficulty);
    case "pattern-match": return generatePatternMatch(rng, difficulty);
    case "odd-one-out": return generateOddOneOut(rng, difficulty);
    case "mirror-match": return generateMirrorMatch(rng, difficulty);
    case "color-count": return generateColorCount(rng, difficulty);
    case "tap-target": return generateTapTarget(rng, difficulty);
    case "sequence-repeat": return generateSequenceRepeat(rng, difficulty);
    case "sort-order": return generateSortOrder(rng, difficulty);
    case "missing-letter": return generateMissingLetter(rng, difficulty);
    case "spot-difference": return generateSpotDifference(rng, difficulty);
    case "direction-match": return generateDirectionMatch(rng, difficulty);
  }
}
```

### Puzzle Type Interface

Extend the `Puzzle` type to support all the different input modes:

```typescript
export interface Puzzle {
  type: string;
  category: "math" | "visual" | "reaction" | "word";
  prompt: string;          // Main display text (for text-based puzzles)
  answer: string;          // Correct answer
  hint?: string;           // Optional hint text
  options?: string[];      // For multiple choice
  inputMode: "text" | "choice" | "tap" | "sequence" | "sort" | "grid-tap" | "direction";
  
  // Visual puzzle data (for canvas-rendered puzzles)
  visualData?: {
    type: string;
    grid?: string[][];       // Color grid for spot-difference, pattern match
    grid2?: string[][];      // Second grid for spot-difference
    shapes?: { shape: string; color: string; x: number; y: number }[];  // For odd-one-out
    sequence?: string[];     // For sequence repeat (colors)
    items?: string[];        // For sort order
    targetX?: number;        // For tap target
    targetY?: number;
    targetSize?: number;
    arrow?: string;          // For direction match (arrow direction)
    trickText?: string;      // For direction match (misleading text)
    flashDuration?: number;  // For color count
  };
}
```

### Component Rendering

The `GlyphRace` component needs to render different UI based on `puzzle.inputMode`:

- `"text"`: Text input + Go button (current behavior)
- `"choice"`: 2x2 or 1x4 grid of option buttons
- `"tap"`: Canvas or div-based area where the player taps a specific position
- `"sequence"`: Row of colored buttons, player taps in order
- `"sort"`: Row of tiles, player taps in ascending order (tapped tiles move to a "sorted" row)
- `"grid-tap"`: Two grids displayed, player taps the differing cell
- `"direction"`: 4 arrow buttons (↑ ↓ ← →)

Each input mode should be its own sub-component for cleanliness.

---

## DM Launch Settings

Update the Glyph Race entry in the Game Launcher:

- **Difficulty**: Easy / Medium / Hard
- **Rounds**: 3 / 5 / 7 / 10 / 15
- **Time per round**: 5s / 7s / 10s / 15s / 20s
- **Puzzle categories** (multi-select checkboxes):
  - ☑ Math & Logic (Quick Math, Rune Cipher, Number Sequence)
  - ☑ Visual Pattern (Pattern Match, Odd One Out, Mirror Match, Color Count)
  - ☑ Reaction & Speed (Tap Target, Sequence Repeat, Sort Order)
  - ☑ Word & Spatial (Missing Letter, Spot Difference, Direction Match)
- **Skill override**: Default INT / Investigation

All categories checked by default. DM can uncheck to focus the game on specific types.