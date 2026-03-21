# Bug Fixes & Addons: Messaging Refinements

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. Message Detail — Desktop Hover

On desktop, **long-hovering** (~0.5s) on any message should display a **tooltip/popover** with full message details:

- **Exact date and time sent**: e.g., "March 21, 2026 at 3:45:12 PM" (user's local timezone)
- **Read receipts**: List of who has read it and when, e.g.:
  - "Read by Mykolov — 3:46 PM"
  - "Read by Eric — 3:52 PM"
  - "Not yet read by: Brent, Justin"
  - Each name in their player color
- **Reactions detail**: Who added which reaction and when, e.g.:
  - "😂 Mykolov (3:47 PM), Eric (3:48 PM)"
  - "🔥 Brent (3:50 PM)"

The popover should appear near the message (above or below depending on screen position), have a subtle dark background with a border, and disappear when the mouse moves away.

---

## 2. Message Detail — Mobile Bottom Sheet

On mobile, **tap-and-hold** on any message brings up a **bottom sheet** that slides up from the bottom of the screen.

**Bottom sheet contents (top to bottom):**
- **Message preview**: The message text (truncated if long) with sender name in their color
- **Sent**: Exact date and time
- **Read by**: List of readers with timestamps and player colors
- **Reactions**: Who reacted with what, with timestamps
- **Add Reaction**: The quick-access emoji row (personalized top 6) with a "+" for the full emoji picker
- **Cancel / Close**: A visible "×" button at the top-right

**Dismiss behavior:**
- Swipe down on the bottom sheet to dismiss
- Tap outside the bottom sheet (on the dimmed overlay) to dismiss
- The sheet should have a small drag handle bar at the top to indicate swipe-ability
- Smooth slide animation in and out (300ms ease transition)

---

## 3. FIX: Reaction Bar Overflow on Small Screens

On small screens, the quick-access reaction bar (the row of suggested emojis) can overflow off the edge of the screen.

**Fix:**
- Make the reaction bar responsive to screen width
- On very small screens (< 360px), show only 4 emojis in the quick-access row instead of 6, plus the "+" button
- On medium-small screens (360-480px), show 5 emojis + "+"
- On larger screens, show the full 6 + "+"
- The bar should never horizontally overflow — use `max-width: 100%` and `overflow: hidden` as a safety net
- The "+" button to open the full picker should ALWAYS be visible regardless of screen size

---

## 4. Full Emoji Picker

When a player taps the "+" button on the reaction quick-access row, open a **full emoji picker**.

**Requirements:**
- Displays all standard emojis organized by category (Smileys, People, Animals, Food, Travel, Objects, Symbols, Flags)
- **Search bar** at the top — type to filter emojis by name/keyword (e.g., typing "fire" shows 🔥, typing "skull" shows 💀☠️)
- Scrollable grid layout
- Tapping an emoji immediately adds it as a reaction and closes the picker
- On desktop: appears as a popover/dropdown near the message
- On mobile: appears as part of the bottom sheet (replaces the quick-access row, with a back button to return)
- Consider using `emoji-mart` or `@emoji-mart/react` rather than building from scratch — handles search, categories, and rendering efficiently

---

## 5. DM Area — Live Message Feed Improvements

### Collapsible
- The live message feed section should be **collapsible** — a header bar ("Live Message Feed") with a chevron toggle
- Default state: expanded
- Remember collapse state in `localStorage`

### Resizable Height
- The feed container should have a **resizable height**
- Default: ~400px
- DM can drag the bottom edge to resize (CSS `resize: vertical` or a custom drag handle)
- Min height: 200px, max height: 80vh
- Remember preferred height in `localStorage`

### Clickable Messages — Navigate to Conversation
- Each message entry in the live feed should be **clickable**
- Clicking navigates the DM to `/messages` with that specific conversation open and scrolled to the relevant message
- URL params: `/messages?conversation=[id]&message=[messageId]`
- On the messages page, if these params are present:
  1. Open the specified conversation in the center panel
  2. Scroll to the specific message
  3. Briefly highlight/pulse the message so the DM can spot it

---

## 6. CRITICAL: DM Area Access Control

The DM Area (`/dm`) must be completely invisible and inaccessible to regular players.

- The `/dm` route should NOT appear in the nav bar for non-DM users
- If a non-DM user manually navigates to `/dm`, redirect to homepage (or show "Not authorized")
- The DM Area link only appears in nav when DM mode is authenticated
- Server-side: the `/dm` page checks for DM auth on load — redirect if not authenticated
- API routes that serve DM Area data (live feed, etc.) require DM auth
- Enforce at BOTH UI and API level — do not rely solely on hiding the nav link

---

## 7. Group Chat — Show Members in Header

When viewing a group chat, the **header bar** should show who is in the group.

- Display group name, then a row of **player name chips** (small colored pills with abbreviated names) showing all members
- If chips overflow, show first few followed by "+2 more"
- Tapping the chips row (or a small "ℹ" info button) expands a dropdown listing all members with full names in their player colors
- Group creator is indicated with a small crown/star icon or "(creator)" label
- DM shown as a member with their white color if they're in the group

---

## 8. Read Receipts

Show message senders when their messages have been read.

**Direct Messages:**
- Below each sent message (sender's side only), show:
  - `✓ Sent` — recipient hasn't opened the conversation since this message
  - `✓✓ Read` — recipient's `lastReadAt` is after this message's `createdAt`
- Small muted text below the message bubble

**Group Messages:**
- Below each sent message, show who has read it
- Format: `"Read by Mykolov, Eric"` or `"Read by 4/5"`
- Tapping expands full list of who has/hasn't read it
- Player names in their assigned colors

**Implementation:**
- Uses the existing `ConversationRead` model — no new tables needed
- Compare message `createdAt` against each participant's `lastReadAt`
- `lastReadAt` is already updated when a player opens a conversation (reuse unread badge logic)

---

## 9. Message Reactions

Players can react to any message with emojis.

**Adding a Reaction:**
- Long-press (mobile) or hover (desktop) shows a reaction picker
- **Quick-access row**: 6 default emojis — 👍 👎 😂 😢 ❤️ 🔥
- Below that, a "+" button opens the full emoji picker (item #4 above)
- **Most-used sorting**: The quick-access row personalizes per player over time — track emoji usage frequency and replace defaults with their top 6. Fall back to defaults until enough data exists.

**Displaying Reactions:**
- Reactions appear in a small row below the message bubble
- Each unique emoji shown once with a count badge if multiple people used it (e.g., `😂 3`)
- Tapping an existing reaction toggles your own (add/remove) without opening the picker
- Hover (desktop) or tap-hold (mobile) on a reaction shows who reacted, in their player colors
- A player can add multiple different emojis to one message but only one of each
- Reactions should be subtle/small — don't overwhelm the thread

**Data Model:**

```prisma
model MessageReaction {
  id         String   @id @default(cuid())
  messageId  String   // FK to MessageV2
  playerName String
  emoji      String   // the emoji character(s)
  createdAt  DateTime @default(now())
  @@unique([messageId, playerName, emoji])
}
```

**API:**
- `POST /api/messages/react` — add a reaction `{ messageId, playerName, emoji }`
- `DELETE /api/messages/react` — remove a reaction `{ messageId, playerName, emoji }`
- Reactions included in message list responses (nested under each message)
- `GET /api/messages/emoji-stats?player=[name]` — returns player's top 6 most-used emojis