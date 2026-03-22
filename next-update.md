# Visual Polish: Arcane Conduit — Blocked Cells & Flow Animation

**Repo**: https://github.com/NoahAlbers/depth-divers-site

The Arcane Conduit game needs a significant visual polish pass. The two biggest issues are that blocked cells are hard to distinguish from empty cells, and the "flow" of arcane energy through pipes doesn't look or feel like flowing energy. This document addresses both.

Reference the current component code in `components/games/arcane-conduit.tsx` and the game logic in `lib/games/arcane-conduit.ts`.

---

## 1. Blocked Cells — Much More Obvious

### Current Problem
Blocked cells use a slightly different shade of dark (`#1a1a2a` vs `#12121e`) with faint crack lines. On most screens, they're nearly indistinguishable from empty cells, especially on mobile. Players place pipes on what they think are empty cells only to realize they're blocked.

### Fix: Make Blocked Cells Visually Unmistakable

Replace the current subtle dark fill + crack lines with a much more distinct treatment:

**Visual Design:**
- Fill the cell with a **clearly different texture** — a crosshatch/hash pattern in a muted reddish-brown (`#2a1a1a`) that reads as "rubble" or "collapsed stone"
- Draw an **X pattern** across the cell using thick strokes — two diagonal lines corner to corner in `#3a2020`
- Add small **debris dots** scattered in the cell (4-6 small circles of varying sizes in `#2a1515` to `#3a2525`)
- The overall look should be: dark reddish rubble that clearly says "you can't build here"
- Add a subtle dark **inner border/inset** (2px) to make the cell appear recessed/sunken compared to empty cells

**Rendering code replacement:**

```typescript
// Replace the current blocked cell rendering with:
if (cell.state === "blocked") {
  // Dark reddish rubble fill
  ctx.fillStyle = "#1e1215";
  ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
  
  // Crosshatch pattern
  ctx.strokeStyle = "#2d1a1a";
  ctx.lineWidth = 2;
  
  // X pattern
  ctx.beginPath();
  ctx.moveTo(x + 4, y + 4);
  ctx.lineTo(x + cs - 4, y + cs - 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + cs - 4, y + 4);
  ctx.lineTo(x + 4, y + cs - 4);
  ctx.stroke();
  
  // Additional hash lines for texture
  const step = cs / 4;
  ctx.strokeStyle = "#251515";
  ctx.lineWidth = 1;
  for (let i = step; i < cs; i += step) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + 1);
    ctx.lineTo(x + i, y + cs - 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 1, y + i);
    ctx.lineTo(x + cs - 1, y + i);
    ctx.stroke();
  }
  
  // Debris dots
  ctx.fillStyle = "#3a2222";
  const debrisPositions = [
    [0.3, 0.25], [0.7, 0.35], [0.45, 0.6], [0.2, 0.75], [0.65, 0.8], [0.5, 0.4]
  ];
  for (const [dx, dy] of debrisPositions) {
    const radius = 1 + Math.random() * 1.5; // Use seeded random if needed for consistency
    ctx.beginPath();
    ctx.arc(x + cs * dx, y + cs * dy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Inner border (recessed look)
  ctx.strokeStyle = "#0a0608";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);
}
```

**Additionally:**
- When a player hovers over a blocked cell, do NOT show the ghost pipe preview (this is already handled but verify it)
- If a player taps a blocked cell, show a brief red flash on that cell and optionally a tiny text "Blocked" that fades out in 0.5s — this provides feedback that the tap was registered but the cell is unusable

---

## 2. Flow Animation — Visible Arcane Energy Moving Through Pipes

### Current Problem
The "flow" is represented only by a color change on the pipe (from gray `#4a4a6a` to purple `#c678dd` to gold `#e5c07b`) and a faint fill rectangle. It doesn't look like energy flowing — it looks like a static color swap. There's no sense of movement, direction, or liquid-like behavior.

### Fix: Animated Energy Flow Through Pipe Channels

The flow should look like **glowing arcane energy traveling through the pipe channels** — a visible leading edge that moves through the pipe from entry to exit, leaving a glowing trail behind it.

**Concept:**
- Each pipe segment that the flow is currently filling should show the energy **moving directionally** from the entry side to the exit side
- The energy is a bright glowing line that traces the pipe's path (following the same lines the pipe draws, but thinner and brighter)
- Behind the leading edge, a filled glow remains (the pipe stays "lit up" after the energy has passed through)
- The leading edge has a bright white/gold core with a purple/gold outer glow

**Implementation — Per-Cell Flow Rendering:**

Each cell in the grid that has `flowFilled: true` tracks `flowProgress` (0 to 1) and `flowEntryDir` / `flowExitDir`. Use these to draw the animated flow:

```typescript
function drawFlowInPipe(
  ctx: CanvasRenderingContext2D,
  pipe: PipeType,
  cx: number, cy: number, cs: number,
  progress: number, // 0 to 1
  entryDir: number, // 0=up, 1=right, 2=down, 3=left
) {
  const dirs = PIPE_DRAW_DIRS[pipe];
  const lineWidth = cs / 6; // Slightly thinner than pipe walls
  
  // Determine the path the energy takes through this pipe
  // For straight/corner pipes: entry side → center → exit side
  // For cross pipes: entry side → center → exit side (straight through)
  
  const entryOffset = DIR_OFFSETS[entryDir];
  // Find exit direction (the other connection that isn't the entry)
  const exitDir = dirs.find(d => d !== ((entryDir + 2) % 4)) ?? dirs[0];
  const exitOffset = DIR_OFFSETS[exitDir];
  
  // Path: edge of entry → center → edge of exit
  const startX = cx + entryOffset[0] * cs * 0.9 * -1; // Invert because entry comes FROM that direction
  const startY = cy + entryOffset[1] * cs * 0.9 * -1;
  const endX = cx + exitOffset[0] * cs * 0.9;
  const endY = cy + exitOffset[1] * cs * 0.9;
  
  // Draw the filled portion (0 to progress)
  // For corners, the path goes: start → center → end
  // We'll draw two segments and clip based on progress
  
  const halfProg = Math.min(progress * 2, 1); // First half: entry → center
  const fullProg = Math.max((progress - 0.5) * 2, 0); // Second half: center → exit
  
  // Glow trail (already passed through)
  ctx.save();
  ctx.shadowColor = "#e5c07b";
  ctx.shadowBlur = 8;
  ctx.strokeStyle = "rgba(229, 192, 123, 0.6)";
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  
  // Entry to center
  if (halfProg > 0) {
    const mx = startX + (cx - startX) * halfProg;
    const my = startY + (cy - startY) * halfProg;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(mx, my);
    ctx.stroke();
  }
  
  // Center to exit  
  if (fullProg > 0) {
    const mx = cx + (endX - cx) * fullProg;
    const my = cy + (endY - cy) * fullProg;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(mx, my);
    ctx.stroke();
  }
  
  // Leading edge (bright white/gold point)
  if (progress < 1) {
    let leadX: number, leadY: number;
    if (progress <= 0.5) {
      const t = progress * 2;
      leadX = startX + (cx - startX) * t;
      leadY = startY + (cy - startY) * t;
    } else {
      const t = (progress - 0.5) * 2;
      leadX = cx + (endX - cx) * t;
      leadY = cy + (endY - cy) * t;
    }
    
    // Bright leading point
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(leadX, leadY, lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer glow ring
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(229, 192, 123, 0.4)";
    ctx.beginPath();
    ctx.arc(leadX, leadY, lineWidth, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}
```

**Integration with existing render:**

In the main `render` function, after drawing the pipe structure, add the flow overlay:

```typescript
// After drawing the pipe itself
if (cell.pipe && cell.flowFilled) {
  drawFlowInPipe(
    ctx, cell.pipe, 
    x + cs / 2, y + cs / 2, cs,
    cell.flowProgress,
    cell.flowEntryDir // Need to track this in game state
  );
}

// For fully filled pipes (progress = 1), draw a steady golden glow
if (cell.pipe && cell.flowFilled && cell.flowProgress >= 1) {
  // The pipe is already colored gold — add a subtle ambient glow
  ctx.save();
  ctx.shadowColor = "#e5c07b";
  ctx.shadowBlur = 6;
  // Redraw the pipe lines with glow
  drawPipe(ctx, cell.pipe, x + cs / 2, y + cs / 2, cs, "rgba(229, 192, 123, 0.8)");
  ctx.restore();
}
```

**Game state change needed:**

The `ArcaneConduitState` grid cells need to track which direction the flow entered from. Add `flowEntryDir: number` to the cell type in `lib/games/arcane-conduit.ts`. When the flow enters a cell, record the direction it came from. This is needed to correctly animate the flow path through corners and crosses.

If modifying the game state type is complex, an alternative is to infer the entry direction from the previous cell in the flow path — look at where the previous filled cell is relative to this one.

---

## 3. Pipe Visual Improvements

### Thicker, More Distinct Pipe Walls

The current pipes are drawn as simple lines from center to edge. Make them look more like actual conduits:

```typescript
function drawPipe(ctx: CanvasRenderingContext2D, pipe: PipeType, cx: number, cy: number, cs: number, color: string) {
  const dirs = PIPE_DRAW_DIRS[pipe];
  const outerWidth = cs / 3.5;  // Outer pipe wall
  const innerWidth = cs / 6;    // Inner channel (where energy flows)
  
  // Draw outer pipe (darker border)
  ctx.strokeStyle = color;
  ctx.lineWidth = outerWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  for (const dir of dirs) {
    const [dx, dy] = DIR_OFFSETS[dir];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * cs * 0.9, cy + dy * cs * 0.9);
    ctx.stroke();
  }
  
  // Draw inner channel (slightly lighter, gives a "hollow pipe" look)
  const innerColor = adjustBrightness(color, 0.6); // Darker inner channel
  ctx.strokeStyle = innerColor;
  ctx.lineWidth = innerWidth;
  
  for (const dir of dirs) {
    const [dx, dy] = DIR_OFFSETS[dir];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * cs * 0.9, cy + dy * cs * 0.9);
    ctx.stroke();
  }
  
  // Center junction (where pipes meet)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, outerWidth / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.arc(cx, cy, innerWidth / 2, 0, Math.PI * 2);
  ctx.fill();
}

// Helper to darken a hex color
function adjustBrightness(hex: string, factor: number): string {
  if (hex.startsWith("rgba")) return hex; // Skip rgba colors
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
}
```

This gives each pipe a two-tone look: darker outer walls with a lighter inner channel. When the flow fills the pipe, the inner channel lights up gold while the outer walls remain the pipe color — creating a clear visual of energy flowing through a conduit.

---

## 4. Empty Cell vs Buildable Cell Distinction

Empty cells where the player CAN place pipes should be subtly different from the general grid background, making it clearer where building is possible.

**Fix:**
- Empty buildable cells: fill with `#14142a` (slightly lighter than the grid background `#12121e`)
- Add a very faint dotted border or corner marks to buildable cells to suggest they're "slots" waiting for pipes
- This creates three clearly distinct cell states visible at a glance:
  - **Buildable** (empty): Slightly lighter with subtle corner marks — "you can build here"
  - **Blocked** (rubble): Reddish crosshatch — "you can't build here" 
  - **Pipe placed**: Shows the pipe structure — "already built"

```typescript
// For empty buildable cells
if (cell.state === "empty" && !cell.pipe) {
  // Slightly lighter fill
  ctx.fillStyle = "#14142a";
  ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
  
  // Corner marks (subtle "slot" indicator)
  const markLen = cs / 5;
  ctx.strokeStyle = "#1e1e38";
  ctx.lineWidth = 1;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 3 + markLen);
  ctx.lineTo(x + 3, y + 3);
  ctx.lineTo(x + 3 + markLen, y + 3);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + cs - 3 - markLen, y + 3);
  ctx.lineTo(x + cs - 3, y + 3);
  ctx.lineTo(x + cs - 3, y + 3 + markLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x + 3, y + cs - 3 - markLen);
  ctx.lineTo(x + 3, y + cs - 3);
  ctx.lineTo(x + 3 + markLen, y + cs - 3);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + cs - 3 - markLen, y + cs - 3);
  ctx.lineTo(x + cs - 3, y + cs - 3);
  ctx.lineTo(x + cs - 3, y + cs - 3 - markLen);
  ctx.stroke();
}
```

---

## 5. Source Crystal — Particle Effects

Add radiating particles around the source crystal to make it unmissable:

```typescript
// After drawing the source diamond, add particles
if (cell.state === "source") {
  // ... existing diamond and arrow code ...
  
  // Radiating particles
  const particleCount = 6;
  for (let i = 0; i < particleCount; i++) {
    const angle = (now / 1000 + i * (Math.PI * 2 / particleCount)) % (Math.PI * 2);
    const dist = (cs / 3) + (cs / 4) * Math.sin(now / 600 + i);
    const px = (x + cs / 2) + Math.cos(angle) * dist;
    const py = (y + cs / 2) + Math.sin(angle) * dist;
    const alpha = 0.3 + 0.2 * Math.sin(now / 400 + i);
    
    ctx.fillStyle = `rgba(198, 120, 221, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Same for end crystal but in blue
if (cell.state === "end-crystal") {
  const particleCount = 6;
  for (let i = 0; i < particleCount; i++) {
    const angle = (now / 1000 + i * (Math.PI * 2 / particleCount)) % (Math.PI * 2);
    const dist = (cs / 3) + (cs / 4) * Math.sin(now / 600 + i);
    const px = (x + cs / 2) + Math.cos(angle) * dist;
    const py = (y + cs / 2) + Math.sin(angle) * dist;
    const alpha = 0.3 + 0.2 * Math.sin(now / 400 + i);
    
    ctx.fillStyle = `rgba(97, 175, 239, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

---

## Summary of Visual Changes

| Element | Before | After |
|---------|--------|-------|
| Blocked cells | Faint dark shade + thin cracks | Reddish crosshatch + X pattern + debris + recessed border |
| Empty cells | Same as grid background | Slightly lighter + corner slot marks |
| Pipe walls | Single-color lines | Two-tone: outer walls + inner channel |
| Flow (in progress) | Color change + faint fill rect | Animated leading edge with white glow traveling through pipe channel |
| Flow (complete) | Gold color swap | Gold glow with ambient shadow on inner channel |
| Source crystal | Pulsing diamond + arrow | Pulsing diamond + thick arrow + radiating particles + "START" label |
| End crystal | Pulsing diamond | Pulsing diamond + radiating particles + "END" label |

The overall effect should make the game feel like you're channeling actual magical energy through crystalline conduits carved into stone — not just connecting abstract lines on a grid.