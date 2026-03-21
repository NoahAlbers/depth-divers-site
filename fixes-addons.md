# Bug Fixes & Tweaks: Pre-Phase 3 Polish

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. TWEAK: Navbar Link Order

Reorder the navigation links in the navbar (both the desktop inline links and the mobile hamburger menu) to match usage priority:

1. Messages
2. Initiative
3. Games
4. Seating
5. DM Area (only visible when DM is authenticated)

---

## 2. TWEAK: Mobile Hamburger Menu — Smooth Slide Animation

The mobile hamburger menu tray should slide in and out smoothly rather than appearing/disappearing instantly.

**Implementation:**
- The menu tray should slide in from the right (or top) with a smooth CSS transition (300ms ease or similar)
- Use `transform: translateX(100%)` → `translateX(0)` for a right-side slide, or `translateY(-100%)` → `translateY(0)` for top-down
- Add a semi-transparent backdrop overlay behind the menu that fades in simultaneously
- Closing the menu (tapping the X, tapping the backdrop, or tapping a link) should reverse the animation smoothly before removing the tray from the DOM
- Avoid any "jump" or instant appearance — the transition should feel native and app-like
- Example Tailwind approach: use `transition-transform duration-300 ease-in-out` on the tray container

---

## 3. FEATURE: Link Previews & Embeds in Messages

When a player sends a message containing a URL, the message should render a **link preview** below the message text.

**Implementation:**

### Detecting Links
- When a message is sent, scan the body for URLs (regex for http/https links)
- URLs in the message text should be rendered as clickable, tappable links (styled with an underline and the player's color or a neutral accent color)
- Links should open in a new tab (`target="_blank" rel="noopener noreferrer"`)

### Link Preview Cards
- Below the message text, render a small **preview card** for the first URL found in the message
- The preview card shows (when available):
  - **Title**: The page's `<title>` or `og:title`
  - **Description**: The page's `meta description` or `og:description` (truncated to ~120 chars)
  - **Image**: The page's `og:image` (rendered as a small thumbnail)
  - **Domain**: The hostname of the URL (e.g., "dnd5e.wikidot.com")
- The preview card is styled as a compact, bordered box below the message — similar to how Discord, Slack, or iMessage render link previews
- Tapping the preview card opens the URL in a new tab

### Fetching Metadata
- **Server-side**: Create an API route `GET /api/link-preview?url=[encoded_url]` that:
  1. Fetches the URL's HTML (server-side, not client-side, to avoid CORS issues)
  2. Parses the `<head>` for `og:title`, `og:description`, `og:image`, and fallback to `<title>` and `meta description`
  3. Returns the metadata as JSON
  4. **Cache results** in the database or in-memory to avoid re-fetching the same URL repeatedly
- **Client-side**: When rendering a message with a URL, call the link preview API and display the card. Show a small loading skeleton while fetching.
- **Rate limiting**: Only fetch previews for the first URL in a message. Don't fetch for messages older than 30 days (to avoid unnecessary API calls on scroll-back).
- **Fallback**: If metadata can't be fetched (site blocks it, times out, etc.), just show the raw clickable URL — no preview card.

### Data Model (Optional Cache)
```prisma
model LinkPreview {
  id          String   @id @default(cuid())
  url         String   @unique
  title       String?
  description String?
  imageUrl    String?
  domain      String
  fetchedAt   DateTime @default(now())
}
```

### Security
- The server-side fetcher should have a timeout (5 seconds max) and a maximum response size (1MB) to prevent abuse
- Only fetch from http/https URLs — reject anything else
- Sanitize all metadata before rendering (prevent XSS from malicious og:title etc.)
- Don't fetch from internal/private IP ranges

---

## 4. FIX: Mobile Keyboard Viewport Scroll (CRITICAL)

On mobile, when the player taps the message input to type, the browser's virtual keyboard opens and shifts/scrolls the entire viewport upward. This breaks the chat app experience — the header scrolls off screen, the layout jumps around, and it doesn't feel like a proper messaging app.

**The goal**: When the keyboard opens, the chat input stays pinned above the keyboard, the message thread shrinks to fit the remaining space, and NOTHING ELSE moves. The header/nav stays put. No page-level scrolling.

### Approach: Multi-Strategy Solution

This is a notoriously tricky cross-browser problem. Use a combination of the following techniques:

#### Strategy 1: VirtualKeyboard API (Chrome Android 94+)
For browsers that support it, opt into the VirtualKeyboard API which gives full control:

```javascript
if ('virtualKeyboard' in navigator) {
  navigator.virtualKeyboard.overlaysContent = true;
}
```

Then use CSS environment variables to reserve space for the keyboard:

```css
.chat-container {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto env(keyboard-inset-height, 0px);
}
```

This tells the browser: "Don't resize the viewport — let the keyboard overlay the content, and I'll handle the layout myself."

#### Strategy 2: CSS Fixed Layout with Safe Area Insets (iOS Safari + Android fallback)
Structure the chat page as a fixed full-screen layout that doesn't rely on viewport height:

```css
.chat-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.chat-input-bar {
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

Using `position: fixed` with `inset: 0` on the chat page container makes it independent of the document scroll. The message list is the only scrollable area.

#### Strategy 3: Prevent Scroll on Focus (iOS Safari specific)
iOS Safari infamously scrolls the page when focusing an input. Use the opacity animation workaround that has been widely confirmed to work:

```css
@keyframes prevent-scroll-on-focus {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.chat-input:focus {
  animation: prevent-scroll-on-focus 0.01s;
}
```

Additionally, on focus, immediately scroll the message thread to the bottom and prevent any document-level scrolling:

```javascript
inputElement.addEventListener('focus', () => {
  // Prevent the page from scrolling
  window.scrollTo(0, 0);
  // Scroll the message list to the bottom
  messageContainer.scrollTop = messageContainer.scrollHeight;
});
```

#### Strategy 4: Dynamic Height Calculation with VisualViewport API
Listen for visual viewport changes (which fire when the keyboard opens/closes) and adjust the chat container height:

```javascript
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const viewportHeight = window.visualViewport.height;
    document.documentElement.style.setProperty(
      '--viewport-height', 
      `${viewportHeight}px`
    );
  });
}
```

```css
.chat-page {
  height: var(--viewport-height, 100vh);
  height: var(--viewport-height, 100dvh);
}
```

#### Combining the Strategies
- Use feature detection to apply the best strategy per browser
- VirtualKeyboard API is the cleanest solution — use it where available (Chrome Android)
- Fixed layout + VisualViewport is the fallback for iOS Safari and older browsers
- The opacity animation hack is a belt-and-suspenders safety net for iOS Safari scroll prevention
- Test on: iOS Safari, Android Chrome, and Android Samsung Browser

#### Important Implementation Notes
- The chat page (`/messages`) should use `position: fixed` for its entire layout — it should NOT be part of the normal document flow when a conversation is open
- The message list should be the ONLY scrollable element (using `overflow-y: auto`)
- Avoid `100vh` — it lies on mobile. Use `100dvh` (dynamic viewport height) with a fallback to the VisualViewport API calculation
- The page-level "MESSAGES" header should already be hidden when in a chat (per previous doc) — this helps because there's less content that could potentially scroll
- Add `overscroll-behavior: none` to the chat container to prevent pull-to-refresh and rubber-banding from interfering

### References for Claude Code
These resources contain working solutions and code samples:
- MDN VirtualKeyboard API: https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API
- iOS Safari opacity workaround (confirmed working): https://gist.github.com/kiding/72721a0553fa93198ae2bb6eefaa3299
- Ionic framework's scroll assist implementation: https://github.com/ionic-team/ionic-framework/blob/main/core/src/utils/input-shims/hacks/scroll-assist.ts
- WHATWG issue with context on the problem: https://github.com/whatwg/html/issues/8375
- Telegram's approach to fixing Safari viewport: https://medium.com/@krutilin.sergey.ks/fixing-the-safari-mobile-resizing-bug-a-developers-guide-6568f933cde0