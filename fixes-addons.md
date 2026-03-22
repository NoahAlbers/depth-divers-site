# Housekeeping Bug Fixes & Messaging Improvements

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. FIX: Rename "Johnathan" to "Jonathan"

The player name "Johnathan" needs to be changed to "Jonathan" **everywhere** across the entire codebase and database:

- `lib/players.ts` — update the PLAYERS config: name `"Jonathan"`, short `"JON"` (stays the same)
- **Database**: Update the `Player` table row where `name = 'Johnathan'` to `name = 'Jonathan'`
- **Database**: Update all `MessageV2` records where `from = 'Johnathan'` to `from = 'Jonathan'`
- **Database**: Update all `Conversation` records — parse the `members` JSON field and replace `'Johnathan'` with `'Jonathan'` in each
- **Database**: Update all `ConversationRead` records where `playerName = 'Johnathan'`
- **Database**: Update all `MessageReaction` records where `playerName = 'Johnathan'`
- **Database**: Update all `Initiative` records where `name = 'Johnathan'`
- **Database**: Update `CharacterSheet` if one exists for `playerName = 'Johnathan'`
- **Database**: Update `PushSubscription` records where `playerName = 'Johnathan'`
- **Seating logic** (`lib/seating.ts` or wherever constraints are defined) — update the constraint references
- Search the entire codebase for any hardcoded `"Johnathan"` string and replace with `"Jonathan"`

Provide a SQL migration script that can be run in the Neon SQL Editor to update all database records.

---

## 2. FIX: Homepage Card Text Updates

Update the tool cards on the homepage (`app/page.tsx`):

- **Messages card**: Change title from "Secret Messages" to **"Messages"**. Keep the subtitle as is or update to "Send messages to your party."
- **Games card**: Change subtitle to **"Compete in challenges"**
- **DM Area card**: Change subtitle to **"The command center"**

---

## 3. FEATURE: Game History & Retry System

### Game History

- After a game session ends (status = "finished"), it should be preserved in the database and viewable
- Add a **"History"** tab or section on the `/games` page that lists past game sessions
- Each history entry shows: game name, date played, difficulty, and the leaderboard/results
- Sorted by most recent first
- DM can **delete** any past game session from the history (with confirmation)

### One Attempt Per Session

- Once a player submits a score/result for a game session, they **cannot play that session again**
- The game component should check if the current player already has a result in the session's results array — if so, show their score and the leaderboard instead of the game
- Server-side: the `POST /api/games/[sessionId]/result` endpoint should reject duplicate submissions from the same player

### Retry Request System

- If a player wants to retry, they can tap a **"Request Retry"** button on their results screen
- This sends a notification to the DM: "[Player Name] is requesting a retry for [Game Name]"
- The DM sees retry requests in the game session view (and/or the DM Area)
- The DM can **approve** or **deny** the request:
  - **Approve**: The player's existing result is cleared from the session, and they can play again
  - **Deny**: The player is notified "Retry request denied" and their original score stands
- Only the specific player's result is cleared on approval — other players' results are untouched

### API

- `GET /api/games/history` — list finished game sessions (most recent first)
- `DELETE /api/games/[sessionId]` — DM deletes a game session from history (DM auth required)
- `POST /api/games/[sessionId]/request-retry` — player requests a retry `{ playerName }`
- `POST /api/games/[sessionId]/approve-retry` — DM approves retry `{ playerName }` (DM auth required, clears that player's result)
- `POST /api/games/[sessionId]/deny-retry` — DM denies retry `{ playerName }` (DM auth required)

---

## 4. FIX: "Party Chat" Group Should Appear in Friends Tab

If there is a group chat that contains ALL players (a "Party Chat" or "Everyone" group), it should appear in the **Friends** tab rather than the Groups tab, since it functions as a shared channel for the whole party.

**Implementation:**
- In the conversation list, check if a group's members include all players
- If a group contains every player (all 6 + optionally DM), display it in the Friends tab at the top (above the individual player DMs), with a visual indicator that it's a group (the group emoji or a 👥 icon)
- It should still also appear in the Groups tab for consistency
- Alternatively: a simpler approach is to just pin "Party Chat" (or any group with all members) at the top of the Friends tab with a distinct look

---

## 5. FIX: Unread Badge on Friends/Groups Tabs

The Friends and Groups tabs at the top of the messaging sidebar should show **unread message counts** to help players know which tab has new messages.

**Implementation:**
- Next to the "Friends" tab label, show a small red badge with the total unread count across all DM conversations (and the party chat if it's displayed there)
- Next to the "Groups" tab label, show a small red badge with the total unread count across all group conversations
- If a tab has zero unreads, don't show a badge
- The badges should be the same style as the unread badges on individual conversations — small red circles with white text
- Layout: `Friends (3)` / `Groups (1)` where the number is in a badge, not parentheses

---

## 6. TWEAK: Messaging Sidebar — Show "Player Name — Character Name"

In the Friends tab of the messaging sidebar, each player entry should display both their **player name** and their **character name** (from the CharacterSheet model).

**Format:**
```
● Mykolov — Korvash
● Brent — Tordal
● Jonathan — Jaedo
```

- Player name in their player color (as it is now)
- An em-dash separator
- Character name in a muted/lighter shade of the same color or in gray
- If a player hasn't set a character name yet, just show the player name alone (no dash, no empty space)
- The character name should be fetched from the `CharacterSheet` table — cache this data client-side to avoid repeated API calls

---

## 7. TWEAK: In-Character Messages — Display Character Name

When a player sends a message with the **"IC" (In Character)** tag active, the message should display their **character name** instead of their player name.

**Implementation:**
- Currently messages show the sender's player name (e.g., "Mykolov") in their color above the message body
- When the message has `tag: "IC"`, display the **character name** instead (e.g., "Korvash")
- Use the same player color for the character name
- Add a small subtle "IC" badge or indicator next to the name so readers know it's an in-character message — but keep it subtle (a small muted tag, not a loud label)
- The message body text styling should be **the same as normal messages** — no different font, no italic, no special formatting. Just the name changes and the small IC indicator.
- When `tag: "OOC"`, display the player name as normal with a small "OOC" badge
- When `tag: null` (no tag), display the player name as normal with no badge

**Fallback:** If a player has the IC tag active but hasn't set a character name in their character sheet, fall back to displaying their player name.

---

## 8. FEATURE: Markdown Support in Messages

Add basic markdown text formatting support in chat messages so players can use bold, italic, etc.

**Supported Formatting:**
- `**bold text**` → **bold text**
- `*italic text*` → *italic text*
- `~~strikethrough~~` → ~~strikethrough~~
- `` `code` `` → `code` (inline code, monospace)
- `> quote` → blockquote styling (indented, left border)
- Links are already handled by the link preview system — just ensure they remain clickable

**Do NOT support:**
- Headings (#, ##, etc.) — not useful in chat
- Images (![]) — not needed
- Lists (-, *, 1.) — overkill for chat
- Code blocks (```) — too complex for chat context
- Tables — not needed

**Implementation:**
- Use a lightweight markdown parser — `marked` (with sanitization) or a simple regex-based parser for just the 5 supported formats
- Parse the message body before rendering, replacing markdown syntax with styled HTML/React elements
- **Sanitize all output** to prevent XSS — never render raw HTML from user input. Use a library like `DOMPurify` or `marked` with `sanitize: true`
- The raw markdown source is stored in the database (not the rendered HTML) — rendering happens client-side
- The chat input does NOT need a formatting toolbar — players just type the markdown syntax naturally. Keep the input simple.
- The message preview in the conversation list sidebar should show the raw text (with markdown symbols stripped), not the rendered version