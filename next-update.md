# Feature Request: PWA Setup & DM Quick Tools

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. Progressive Web App (PWA) Setup

Turn the Depth Divers site into a fully installable Progressive Web App so players can add it to their home screen and use it like a native app.

### Web App Manifest

Create `/public/manifest.json`:

```json
{
  "name": "Depth Divers",
  "short_name": "Depth Divers",
  "description": "Campaign tools for the party",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0d1117",
  "theme_color": "#e5c07b",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Icons

Generate app icons and place them in `/public/icons/`:

- `icon-192.png` — 192x192px
- `icon-512.png` — 512x512px
- `apple-touch-icon.png` — 180x180px (for iOS)
- `favicon.ico` — 32x32 and 16x16

The icon design should be simple and recognizable at small sizes: a gold emblem on the dark background (#0d1117). Something like a downward-pointing sword, a stalactite, or the letter "DD" in Cinzel font on a dark circle. Keep it clean — it needs to read on a 44px home screen icon.

### Head Meta Tags

In the root layout (`app/layout.tsx`), add these to the `<head>`:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#e5c07b" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Depth Divers" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

### Service Worker

A service worker already exists for push notifications (`/public/sw.js`). Extend it (or verify it already handles) the following:

- **Caching strategy**: Cache the app shell (HTML, CSS, JS bundles, fonts, icons) on first load so the app opens instantly on subsequent launches, even with a slow connection. Use a "network first, cache fallback" strategy for API calls and a "cache first, network update" strategy for static assets.
- **Offline fallback**: If the user opens the app with no connection, show a simple offline page ("You're in the deep Underdark — no signal. Connect to continue.") rather than a browser error.
- **Registration**: Ensure the service worker is registered in the root layout or a client component that runs on every page.

### Install Prompt (Add to Home Screen)

Create a component that prompts players to install the app on their first few visits.

**Behavior:**
- On supported browsers, listen for the `beforeinstallprompt` event
- When triggered, show a **themed install banner** at the bottom of the screen:
  - Text: "Install Depth Divers for the best experience"
  - Two buttons: "Install" and "Not now"
  - Styled to match the site theme (dark bg, gold accents, subtle border)
- "Install" triggers the native browser install prompt
- "Not now" dismisses the banner and stores a flag in localStorage so it doesn't show again for 7 days
- After 3 dismissals, stop showing it entirely (store a counter in localStorage)

**iOS handling:**
- iOS Safari doesn't support `beforeinstallprompt`
- Instead, detect iOS Safari and show a manual instruction banner: "Tap the share button ↑ then 'Add to Home Screen' to install Depth Divers"
- Include a small visual showing the iOS share icon
- Same dismissal logic as above

### Standalone Detection

When the app is running in standalone mode (installed on home screen), you can detect it and adjust the UI:

```javascript
const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
  || (window.navigator as any).standalone === true;
```

When running standalone:
- Hide the install prompt permanently
- The app already runs full-screen without browser chrome — no changes needed
- Optionally: hide any "bookmark this site" or "share" prompts since they're already installed

---

## 2. DM Quick Tools: Polls & Countdown Timers

Add two new DM tools to the bottom of the DM Area (`/dm`) page. These create persistent popups/overlays on all players' screens until dismissed or completed.

### 2a. Quick Poll

The DM creates a poll that appears on all players' screens as a persistent popup.

#### DM Side (DM Area)

**Poll Creator:**
- A "Launch Poll" section at the bottom of the DM Area
- **Question field**: Text input for the poll question (e.g., "Do we trust the merchant?", "Which tunnel: left or right?")
- **Options**: 2-6 answer options. Start with 2 input fields, a "+" button to add more (up to 6). Each option is a text field.
- **Settings toggles:**
  - **Anonymous voting**: On/Off. When on, the DM sees total counts but not who voted what. When off, the DM sees each player's vote.
  - **Show results to players**: On/Off. When on, players see live results after voting. When off, only the DM sees results.
- **"Launch Poll" button** — creates the poll and pushes it to all players

**DM Results View:**
- After launching, the DM sees a live results panel:
  - Each option with a count and percentage bar
  - If not anonymous: player names (in their colors) next to their chosen option
  - List of who hasn't voted yet
  - **"End Poll" button** — closes the poll on all player screens and shows final results

#### Player Side

**Persistent Popup:**
- When a poll is launched, a **modal popup** appears on the player's screen, overlaying whatever page they're on
- The popup shows:
  - The question in gold text
  - The options as large tappable buttons (easy to hit on mobile)
  - A subtle "Poll from the DM" header
- The popup **cannot be dismissed until the player votes** — there's no X button or close option. It's persistent. They must participate.
- After voting:
  - Their selection is highlighted
  - If "show results to players" is on, they see the live vote counts
  - A "Waiting for results..." message if results are hidden
  - The popup can now be dismissed with an X button or it auto-closes when the DM ends the poll
- If the DM ends the poll before a player votes, the popup closes and that player is recorded as "did not vote"

**Push notification:** When a poll launches, send a push notification: "The DM is asking: [question]" to bring players back to the app if they're not looking.

#### Data Model

```prisma
model Poll {
  id          String   @id @default(cuid())
  question    String
  options     String   // JSON array of option strings
  anonymous   Boolean  @default(false)
  showResults Boolean  @default(true)
  status      String   @default("active") // "active" or "closed"
  votes       String   @default("{}") // JSON: { playerName: optionIndex }
  createdAt   DateTime @default(now())
  closedAt    DateTime?
}
```

#### API

- `POST /api/polls` — DM creates a poll (DM auth required)
- `GET /api/polls/active` — get the currently active poll (for players to detect it)
- `POST /api/polls/[id]/vote` — player submits their vote `{ playerName, optionIndex }`
- `POST /api/polls/[id]/close` — DM closes the poll (DM auth required)
- `GET /api/polls/history` — list past polls (for DM reference)

#### Polling (Real-time)

- Players poll `GET /api/polls/active` every 2-3 seconds to detect new polls
- While a poll is active and the player is viewing results, poll for updated vote counts every 2 seconds

---

### 2b. Countdown Timer

The DM launches a dramatic countdown timer that appears on all players' screens.

#### DM Side (DM Area)

**Timer Creator:**
- A "Launch Timer" section in the DM Area
- **Duration**: Input field for minutes and seconds (e.g., "5:00" or "0:30")
- **Label** (optional): Text that displays with the timer (e.g., "The cave is collapsing!", "Time until the guards return", "Auction closing in...")
- **Settings:**
  - **Dramatic mode**: On/Off. When on, the timer gets more intense in the last 25% — text turns red, pulsing animation, optional screen shake
  - **Sound alert**: On/Off. When on, a subtle tick sound plays in the final 10 seconds and an alarm on zero (requires user interaction first to enable audio on mobile)
  - **Visible to players**: On/Off. In rare cases the DM might want a private timer only they can see.
- **"Launch Timer" button** — starts the countdown on all screens

**DM Timer Controls:**
- Once launched, the DM sees:
  - The running timer
  - **Pause/Resume** button
  - **Add Time** button (+30s, +1m, +5m)
  - **End Timer** button (stops it immediately)

#### Player Side

**Persistent Popup (on launch):**
- When the timer launches, a **modal popup** appears showing:
  - The label text (if set) in gold
  - A large countdown display (MM:SS or SS depending on duration)
  - The timer counting down in real time
- The player **can dismiss this popup** (unlike polls, timers are informational — you don't want to block their screen for 5 minutes)
- When dismissed, the timer **moves to the navbar** as a compact countdown:
  - Displayed next to the site title or in the nav bar area
  - Small but readable: "⏱ 3:42" with the label truncated if needed
  - Tapping it reopens the full timer popup
  - Still counts down in real time

**Timer States:**
- **Normal** (>25% remaining): Gold/white text, calm display
- **Warning** (10-25% remaining): Text turns amber/orange, subtle pulse animation
- **Critical** (<10% or last 30 seconds): Text turns red, faster pulse, the nav bar timer also pulses red
- **Expired**: "TIME'S UP" display with a dramatic flash. Stays visible until the DM ends it.

**Push notification:** When a timer launches, send: "⏱ [Label or 'A countdown has started!']"

#### Timer Sync

The timer does NOT rely on real-time syncing of each second. Instead:

- When launched, the server stores `startedAt` timestamp and `duration` in seconds
- Each client calculates the remaining time locally: `remaining = duration - (now - startedAt)`
- This means all clients show the same time regardless of polling intervals
- If the DM pauses, the server stores `pausedAt` and the remaining duration at pause time
- On resume, a new `startedAt` is calculated so clients can continue the local countdown
- Clients poll every 5 seconds just to check for pause/resume/end/time-added events — not for the time itself

#### Data Model

```prisma
model Timer {
  id          String    @id @default(cuid())
  label       String?
  duration    Int       // total duration in seconds
  startedAt   DateTime  // when the timer started (or resumed)
  pausedAt    DateTime? // null if running, set if paused
  remaining   Int?      // remaining seconds at time of pause
  dramatic    Boolean   @default(true)
  soundAlert  Boolean   @default(false)
  visible     Boolean   @default(true) // visible to players
  status      String    @default("running") // "running", "paused", "expired", "cancelled"
  createdAt   DateTime  @default(now())
}
```

#### API

- `POST /api/timers` — DM creates and starts a timer (DM auth required)
- `GET /api/timers/active` — get the currently active timer
- `POST /api/timers/[id]/pause` — DM pauses (DM auth required)
- `POST /api/timers/[id]/resume` — DM resumes (DM auth required)
- `POST /api/timers/[id]/add-time` — DM adds seconds `{ seconds }` (DM auth required)
- `POST /api/timers/[id]/end` — DM cancels/ends the timer (DM auth required)

---

### Layout in DM Area

At the bottom of the DM Area page, add two new sections:

```
┌─────────────────────────────────┐
│  ... existing DM Area content   │
│  (recap randomizer, game        │
│   launcher, etc.)               │
├─────────────────────────────────┤
│  ⏱ Countdown Timer              │
│  [Duration] [Label]             │
│  [Dramatic ✓] [Sound ✗]        │
│  [Launch Timer]                 │
│                                 │
│  Active: "Cave collapsing" 3:42 │
│  [Pause] [+30s] [+1m] [End]    │
├─────────────────────────────────┤
│  📊 Quick Poll                   │
│  [Question field]               │
│  [Option 1] [Option 2] [+]     │
│  [Anonymous ✗] [Show Results ✓] │
│  [Launch Poll]                  │
│                                 │
│  Active: "Trust the merchant?"  │
│  Yes: 3 | No: 2 | Unsure: 1    │
│  Not voted: Matthew             │
│  [End Poll]                     │
└─────────────────────────────────┘
```

---

## Implementation Priority

1. **PWA manifest + icons + meta tags** — quick setup, immediate benefit
2. **Service worker caching + offline page** — extends the existing SW
3. **Install prompt component** — themed banner with iOS fallback
4. **Countdown Timer** — simpler of the two DM tools (no voting logic)
5. **Quick Poll** — more complex (voting, results, anonymous mode)