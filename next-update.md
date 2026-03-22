# Bug Fixes & Polish: Glyph Race

**Repo**: https://github.com/NoahAlbers/depth-divers-site

Reference: `components/games/glyph-race.tsx` and `lib/games/glyph-race.ts`

---

## 1. FIX: Pattern Match Options Show Hex Codes Instead of Colors

When a pattern match puzzle asks "what color fills the gap?", the multiple choice options display raw hex codes (e.g., "#ef4444") instead of showing colored swatches. Players have to guess what "#ef4444" looks like.

**Fix:** In the multiple choice rendering section (`puzzle.inputMode === "choice"` && `puzzle.options`), detect if the options are color values (hex codes). If they are, render them as **colored circles/swatches** instead of text labels.

Replace the current choice rendering:

```tsx
{/* Multiple choice */}
{puzzle.inputMode === "choice" && puzzle.options && (
  <div className="grid w-full grid-cols-2 gap-2">
    {puzzle.options.map((opt) => {
      const isColor = /^#[0-9a-fA-F]{3,8}$/.test(opt) || /^(red|blue|green|yellow|purple|orange|pink|white|gray|cyan)$/i.test(opt);
      
      return (
        <button
          key={opt}
          onClick={() => handleAnswer(opt)}
          className="flex min-h-[56px] items-center justify-center rounded border border-gray-700 bg-background px-4 py-3 transition-colors hover:border-gold hover:bg-gold/10"
        >
          {isColor ? (
            <div
              className="h-10 w-10 rounded-full border-2 border-gray-600 transition-transform hover:scale-110"
              style={{ backgroundColor: opt }}
            />
          ) : (
            <span className="text-lg font-bold text-white">{opt}</span>
          )}
        </button>
      );
    })}
  </div>
)}
```

This checks if each option looks like a hex color code or a named color. If it is, it renders a colored circle. If it's text (like "A", "42", etc.), it renders as text like before.

---

## 2. TWEAK: Color Count — Show Color Swatch in Question

When the color count puzzle asks "How many RED dots were there?", the target color name should also display a small colored swatch next to the word so there's no ambiguity about which color they mean.

**Fix:** In the prompt rendering for color-count puzzles (during the "answer" phase), parse the color name from the prompt and display a small inline colored dot next to it. Update the `Puzzle` visualData type to include a `targetColor` field (the actual hex value being asked about), and update `generateColorCount` in the game logic to populate it. Then render:

```tsx
{puzzle.type === "color-count" && colorCountPhase === "answer" && (
  <div className="flex items-center justify-center gap-2 font-cinzel text-xl font-bold text-gold">
    <span>{puzzle.prompt}</span>
    {puzzle.visualData?.targetColor && (
      <div
        className="inline-block h-5 w-5 rounded-full border border-gray-600"
        style={{ backgroundColor: puzzle.visualData.targetColor }}
      />
    )}
  </div>
)}
```

---

## 3. TWEAK: Spot the Difference — Clearer Instructions

Players might not realize they need to tap the CHANGED cell on the SECOND grid.

**Fix:**
- Left grid label: **"Original"** (keep as-is)
- Right grid label: Change to **"👆 Tap the difference"** instead of "Changed"
- Add a subtle pulsing gold border around the right grid to indicate it's the interactive one

---

## 4. TWEAK: Direction Match — Consistent Arrow Rendering

Arrow emojis render differently across devices. Use a consistent custom approach.

**Fix:** Replace the emoji arrow with a large gold triangle (▲) rotated via CSS transform based on direction. This renders identically across all devices:

```tsx
<div 
  className="text-6xl font-bold text-gold"
  style={{
    transform: puzzle.visualData.arrow === "↑" ? "rotate(0deg)" :
               puzzle.visualData.arrow === "→" ? "rotate(90deg)" :
               puzzle.visualData.arrow === "↓" ? "rotate(180deg)" :
               "rotate(270deg)",
  }}
>
  ▲
</div>
```

---

## 5. TWEAK: Sequence Repeat — Status Text During Phases

No indicator tells the player to watch vs. when to start tapping.

**Fix:**
- During the showing phase, display: **"Watch the sequence..."** in purple, pulsing
- When it switches to input phase, display: **"Now repeat it!"** in gray
- Show progress dots below the buttons: filled dots for correct taps so far, empty dots for remaining

---

## 6. TWEAK: Sort Order — Show Sort Direction in Hint

Players might not know if they should sort ascending or descending.

**Fix:** The `generateSortOrder` function should set `puzzle.hint` to:
- For numbers: `"Tap in order: smallest → largest"`
- For letters: `"Tap in order: A → Z"`

---

## 7. TWEAK: Slide Transition Between Rounds

Currently the transition between rounds is just a flash and instant swap. Add a brief slide animation for a more polished feel.

**Fix:** Track a `slideState` (`"in" | "out" | null`). When advancing to the next round:
1. Set slideState to `"out"` — current puzzle slides left and fades (200ms)
2. After 200ms, change the round (new puzzle loads)
3. Set slideState to `"in"` — new puzzle starts offset right and slides into place (200ms)
4. After 200ms, set slideState to null

Apply to the puzzle card div:
```tsx
className={`... transition-all duration-200 ${
  slideState === "out" ? "-translate-x-5 opacity-0" :
  slideState === "in" ? "translate-x-5 opacity-0" :
  "translate-x-0 opacity-100"
}`}
```

---

## 8. TWEAK: Larger Touch Targets on Mobile

Some interactive elements are too small for comfortable mobile tapping. Ensure everything meets 44x44px minimum.

**Fixes:**
- **Spot the difference cells**: `h-9 w-9` on small screens (currently `h-7 w-7`)
- **Sequence repeat buttons**: increase to `h-14 w-14` (currently `h-12 w-12`)
- **Direction match arrow buttons**: increase to `h-14 w-14` (currently `h-12 w-12`)
- **Sort order tiles**: add `min-h-[48px] min-w-[48px]`
- **Odd-one-out shapes**: currently `h-14 w-14`, this is fine

---

## 9. FIX: Mirror Match — Verify Implementation

Check if mirror match puzzles are fully implemented in `generatePuzzle` / `lib/games/glyph-race.ts`. If the generator exists but the component doesn't render the visual shapes properly (e.g., it tries to render shape descriptions as text), then implement proper visual rendering for mirror match options — each option should display as a small shape/pattern, not a text label.

If mirror match is not implemented at all in the generator, either:
- Implement it (render simple shapes as inline SVGs or canvas, show 4 mirrored/rotated variants as options), or
- Remove it from the available puzzle types so it never appears as a broken/empty puzzle

---

## 10. TWEAK: Puzzle Type Distribution — Round-Robin

Ensure variety by using a round-robin approach instead of pure random selection.

**Fix:** In the puzzle generator, pre-assign categories to round slots using the seed, then pick a random type within each category:

```typescript
function assignCategories(seed: number, totalRounds: number, allowedCategories: string[]): string[] {
  const rng = createRNG(seed);
  const categories = [...allowedCategories];
  const assignments: string[] = [];
  
  for (let i = 0; i < totalRounds; i++) {
    // Round-robin through categories, shuffled each cycle
    if (i % categories.length === 0) {
      // Shuffle for this cycle
      for (let j = categories.length - 1; j > 0; j--) {
        const k = Math.floor(rng() * (j + 1));
        [categories[j], categories[k]] = [categories[k], categories[j]];
      }
    }
    assignments.push(categories[i % categories.length]);
  }
  
  return assignments;
}
```

This guarantees that over a 7-round game with all 4 categories enabled, each category appears roughly equally (2-2-2-1 distribution) with no two in a row from the same category.