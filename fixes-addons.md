# Bug Fixes & Tweaks: Messaging System

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. BUG: Group Creation Submenu Stays Open When Switching Tabs

When a player is in the Groups tab and has the group creation submenu/form open, switching to the Friends tab does NOT close the creation form. It persists behind the scenes and reappears when switching back, or worse, overlaps the Friends view.

**Fix**: When the user switches from the Groups tab to the Friends tab, close/reset the group creation submenu. Clear any in-progress form state (selected members, group name input). The creation form should only be visible when the user is actively on the Groups tab AND has clicked the create button.

---

## 2. FIX: Show Full Player List in Friends Tab

The Friends tab in the messaging left panel needs to display ALL players and the DM as conversation options. Every player should see:

- All 6 players (Mykolov, Brent, Johnathan, Justin, Eric, Matthew)
- The DM (Noah)

Each entry shows the player name in their assigned color, plus an unread badge if applicable. The current user's own name can be excluded or shown at the bottom grayed out. Tapping any name opens the DM (direct message) conversation with that person.

Make sure DM conversations are auto-created between every player pair if they don't already exist — a player should never see an empty friends list.

---

## 3. FIX: DM Messaging View — Separate Submenu for Player-to-Player Chats

The DM's messaging view needs to be restructured. Currently the DM sees the same view as players. Instead:

**DM should have three sections in the left panel:**
1. **"My Conversations"** — DM's own direct messages with each player (conversations where the DM is a participant). This is what the DM uses to chat directly with players.
2. **"Player Chats" (God Mode)** — A separate collapsible section or tab showing ALL player-to-player conversations and groups that the DM is NOT a member of. This is the surveillance/god-mode view. Each entry shows the conversation pair (e.g., "Mykolov ↔ Eric") or group name. Tapping opens a read-only view of that conversation (or the DM can optionally send messages into it — up to existing god-mode behavior).
3. **"Groups"** — Groups the DM is a member of, plus visibility into all other groups.

This separation makes it clear to the DM which conversations are theirs vs which ones they're eavesdropping on.

---

## 4. FEATURE: Rolling Message Log in DM Area

In the DM Area (`/dm`), add a **"Live Message Feed"** section that shows ALL messages across the entire site in real-time (chronological, newest at the bottom or top — whichever feels more natural for a live feed).

**Each entry shows:**
- Timestamp (relative, e.g., "2m ago")
- Sender name (in their player color)
- Recipient / conversation name (e.g., "→ Eric", "→ Group: Sneaky Squad", "→ Everyone")
- Message body (truncated to ~100 chars with "..." if longer)
- IC/OOC tag if present

**Behavior:**
- Polls every 2-3 seconds for new messages
- Auto-scrolls to show newest messages (with an option to pause auto-scroll if the DM is reading older messages)
- Shows the last 50-100 messages by default with a "Load more" option
- This is a monitoring tool — the DM can glance at it to see all chatter at a glance without opening individual conversations

---

## 5. TWEAK: Pinboard "Last Edited" — Add Date/Time

The pinboard currently shows who last edited it but not when. Update the "last edited" display to include a date and time.

**Format**: `"Last edited by [Name] — Mar 21, 2026 at 3:45 PM"`

Use the `updatedAt` field from the Pinboard model. Display the editor's name in their player color. Use the user's local timezone for the timestamp.

---

## 6. TWEAK: Pinboard Polling Speed

Pinboards should update faster when a player edits them so other participants in the conversation see changes sooner.

**Change**: Reduce the pinboard polling interval from the default 2-3 seconds to **1 second**. This makes collaborative editing feel much more responsive without adding meaningful server load (it's a single lightweight GET per conversation).

---

## 7. TWEAK: Send Button Alignment

The send button in the chat input bar is not vertically centered with the text input field. Fix the alignment so the send button is perfectly vertically centered relative to the text input box.

**Implementation**: The chat input container should use `display: flex; align-items: center;` (or the Tailwind equivalent `flex items-center`) to ensure the text input and send button are vertically aligned on the same baseline. If the text input has padding or a different height than the button, adjust so they appear visually centered together.

---

## 8. FEATURE: Read Receipts

Show message senders when their messages have been read by the recipient(s).

**Direct Messages:**
- Below each sent message (on the sender's side), show a small read indicator:
  - "Sent" — message has been sent but the recipient hasn't opened the conversation since
  - "Read" — the recipient has opened the conversation and their `lastReadAt` timestamp is after this message's `createdAt`
- Display as small muted text below the message bubble (e.g., `✓ Sent` or `✓✓ Read`)
- Only the sender sees read receipts on their own messages — recipients don't see anything extra

**Group Messages:**
- Below each sent message in a group, show who has read it
- Format: `"Read by Mykolov, Eric"` or `"Read by 4/5"` if the group is large
- Tapping the read receipt text could expand to show the full list of who has/hasn't read it
- Use each player's assigned color for their name in the read list

**Implementation:**
- The existing `ConversationRead` model already tracks `lastReadAt` per player per conversation
- When rendering a message, compare its `createdAt` against each participant's `lastReadAt` for that conversation
- A message is "read" by a player if that player's `lastReadAt` > message's `createdAt`
- Update `lastReadAt` when a player opens a conversation (this already happens for unread badges — reuse the same mechanism)
- No new database tables needed — just query `ConversationRead` when rendering messages

---

## 9. FEATURE: Message Reactions

Players can react to any message with emojis. Reactions appear below the message bubble.

**UI — Adding a Reaction:**
- Long-press (mobile) or hover (desktop) on any message to show a reaction picker
- The picker shows a **quick-access row** of 6 default emojis: 👍 👎 😂 😢 ❤️ 🔥
- Below the quick-access row, a "+" button opens a full emoji picker (standard emoji grid, searchable)
- **Most-used sorting**: The quick-access row is personalized per player. Track which emojis each player uses most frequently and replace the defaults with their top 6 over time. Fall back to the defaults (👍 👎 😂 😢 ❤️ 🔥) until enough usage data exists.

**UI — Displaying Reactions:**
- Reactions appear in a row below the message bubble
- Each unique emoji is shown once with a count badge if multiple people reacted with the same emoji (e.g., `😂 3`)
- Tapping an existing reaction emoji toggles your own reaction (add if you haven't reacted with it, remove if you have) — no need to open the picker again
- Tapping and holding a reaction (or hovering on desktop) shows a tooltip with the names of who reacted with that emoji, each in their player color
- A player can add multiple different reactions to the same message but only one of each emoji
- Reactions are subtle and small — they shouldn't overwhelm the message thread

**Data Model:**

Add a new Prisma model:

```prisma
model MessageReaction {
  id        String   @id @default(cuid())
  messageId String   // FK to MessageV2
  playerName String
  emoji     String   // the emoji character(s)
  createdAt DateTime @default(now())
  @@unique([messageId, playerName, emoji]) // one of each emoji per player per message
}
```

For tracking most-used emojis per player (for the personalized quick-access row), either:
- Query `MessageReaction` grouped by `playerName` and `emoji` ordered by count (simple, no extra table)
- Or cache it in a `PlayerEmojiStats` table if performance becomes an issue (unlikely with this group size)

**API:**
- `POST /api/messages/react` — add a reaction `{ messageId, playerName, emoji }`
- `DELETE /api/messages/react` — remove a reaction `{ messageId, playerName, emoji }`
- Reactions should be included in the message list response (nested under each message) to avoid extra API calls
- `GET /api/messages/emoji-stats?player=[name]` — returns the player's top 6 most-used emojis (for quick-access row personalization)