# Bug Fix & Tweaks Request

## 1. FIX: Modals/Popups Overflowing Off Screen (CRITICAL)

All modals and popups (player identity selector, DM password prompt, confirmation dialogs, etc.) are overflowing off the top of the screen and are unreadable/unusable — especially on mobile.

**Fix all modals/dialogs to follow these rules:**
- Use `position: fixed` with `inset: 0` and flexbox centering (`display: flex; align-items: center; justify-content: center`) so the modal is centered in the **viewport**, not the document
- Modal content container must have `max-height: 90vh` and `overflow-y: auto` so tall content scrolls internally instead of overflowing the screen
- Add a semi-transparent backdrop overlay behind the modal (`bg-black/60` or similar)
- Modal content should have `max-width: 90vw` (or a fixed max like `400px`) with horizontal auto margins
- Never use `position: absolute` for modals — always `fixed` relative to the viewport
- Test that the player identity selector and DM password prompt are fully visible and usable on a small screen (375x667)

Search the entire codebase for any modal, dialog, or overlay component and apply these fixes consistently.

---

## 2. TWEAK: Rename Site to "Depth Divers"

Change the site title everywhere from whatever it currently is to **"Depth Divers"**. This includes:
- The nav bar site title
- The homepage hero section
- The `<title>` tag / metadata
- Any other references to the old site name

---

## 3. TWEAK: Replace Homepage Subtitle with Rotating Taglines

Remove the current static subtitle on the homepage. Replace it with a **rotating tagline** that fades between lines on a ~5–6 second timer using a smooth CSS crossfade transition.

Here are the taglines (cycle through in order, loop back to the start):

```typescript
const TAGLINES = [
  "An adventure that involves the Underdark... a whole lot of dark.",
  "Bring a torch. Then bring another one.",
  "Where the spiders are the least of your problems.",
  "Somewhere below, something with too many legs is waiting.",
  "The Underdark doesn't care about your darkvision.",
  "It's not the fall that kills you. It's what lives at the bottom.",
  "Fungi down here have opinions. Strong ones.",
  "If you can hear the dripping, you're already too deep.",
  "Drow politics make surface kingdoms look reasonable.",
  "The worms here don't fish. They fish for you.",
  "Every tunnel leads somewhere. Not all of them lead back.",
  "Trust nothing that glows.",
];
```

The transition should be a gentle fade-out / fade-in — not a hard swap. Keep the tagline text smaller and more muted than the main title (e.g., italic, lower opacity, smaller font size).