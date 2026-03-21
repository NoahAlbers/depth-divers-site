# Feature Request: Message & Group Management

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. DM: Delete Any Message

The DM should be able to delete any message across the entire site — in any conversation, group, or DM thread.

**Implementation:**
- In DM mode, every message (in any conversation) shows a small trash/delete icon on hover (desktop) or in the message detail bottom sheet (mobile)
- Tapping delete shows a confirmation: "Delete this message? This cannot be undone."
- On confirm, the message is hard-deleted from the database
- The message disappears from all participants' views on the next poll cycle
- Reactions associated with the deleted message should also be deleted (cascade)
- In the DM Area live message feed, the DM should also be able to click a message and have a delete option

**API:**
- `DELETE /api/messages/[messageId]` — deletes a message (DM auth required)
- Server-side: verify DM auth before allowing deletion. Regular players cannot delete messages (not even their own — keeps the record intact for the DM)

---

## 2. DM: Delete Any Group

The DM should be able to delete any group chat at any time.

**Implementation:**
- In DM mode, each group chat shows a "Delete Group" option accessible via:
  - A menu/gear icon in the group chat header (when viewing the group)
  - A long-press or right-click on the group in the Groups list
  - The DM Area (if group management is surfaced there)
- Tapping delete shows a confirmation: "Delete group '[Group Name]'? All messages in this group will be permanently deleted."
- On confirm:
  - The group's `Conversation` record is deleted
  - All `MessageV2` records associated with that conversation are deleted
  - All `MessageReaction` records for those messages are deleted
  - The `Pinboard` for that conversation is deleted
  - All `ConversationRead` records for that conversation are deleted
- All group members see the group disappear from their Groups tab on the next poll cycle
- If a player currently has the deleted group open, they should be gracefully returned to the conversation list with a brief notice: "This group has been deleted."

**API:**
- `DELETE /api/messages/conversations/[conversationId]` — deletes a group and all associated data (DM auth required)
- Server-side: verify DM auth. Verify the conversation type is "group" (DMs between players should not be deletable — only groups).

---

## 3. Players: Rename Groups

Any member of a group chat can rename it.

**Implementation:**
- In the group chat header, the group name should be **tappable/clickable** by any group member
- Tapping opens an inline edit field (or a small modal) where they can type a new name
- On submit, the name updates for all members
- Max length: 50 characters
- Empty names are not allowed — show validation if they try to submit blank
- The conversation list updates to reflect the new name on the next poll cycle

**API:**
- `PUT /api/messages/conversations/[conversationId]` — update group details `{ name }` (requires player to be a member of the group)
- Server-side: verify the requesting player is a member of the group. DM can also rename any group.

---

## 4. Players: Set Group Emoji/Icon

Each group chat can have a custom emoji that serves as its icon in the conversation list and header.

**Implementation:**
- In the group chat header, next to the group name, show the group emoji (or a default placeholder like 💬 if none is set)
- Tapping the emoji opens the emoji picker (same full picker used for reactions — searchable, categorized)
- Selecting an emoji sets it as the group's icon
- The emoji displays:
  - In the Groups tab conversation list (before the group name, replacing the generic group dot/icon)
  - In the group chat header
  - In the DM's Player Chats view for groups
- Any group member can change the emoji at any time
- DM can also change any group's emoji

**Data Model:**
- Add an `emoji` field to the `Conversation` model:
  ```prisma
  model Conversation {
    // ... existing fields
    emoji String? // custom emoji icon for the group, null = use default
  }
  ```

**API:**
- Same `PUT /api/messages/conversations/[conversationId]` endpoint — extend it to accept `{ name?, emoji? }`
- Either field can be updated independently

---

## 5. Group Settings Panel

To house the rename and emoji options (plus future settings), add a **Group Settings** view accessible from the group chat header.

**Access:**
- In the group chat header, add a small gear/settings icon (⚙️) or make the group name + emoji area tappable
- Opens a panel or modal with:

**Contents:**
- **Group Name**: Editable text field (current name pre-filled). Save button.
- **Group Emoji**: Current emoji displayed. Tap to open emoji picker and change.
- **Members**: List of all members with player colors. Shows who created the group.
- **Request Deletion**: Button for players to request the DM delete the group (from the previous doc).
- **Delete Group** (DM only): Visible only to DM. Immediately deletes the group with confirmation.

**Mobile:**
- Opens as a full-screen slide-in panel (similar to how the chat slides in from the conversation list)
- Back button returns to the group chat

**Desktop/Tablet:**
- Opens as a modal or a slide-out panel on the right (where the pinboard lives — could be a tab next to pinboard)

---

## 6. FIX: Group Deletion Request — Add Confirmation

When a player taps "Request Deletion" for a group chat, they should see a confirmation dialog before the request is sent.

**Flow:**
- Player taps "Request Deletion"
- A confirmation modal appears: "Are you sure you want to request deletion of '[Group Name]'? The DM will be notified."
- Two buttons: "Cancel" and "Request Deletion"
- Only on confirm does the request get sent to the DM
- After confirming, the player sees: "Deletion request sent to the DM"

---

## 7. TWEAK: Reaction Button — Greyscale Animated Emoji

The "+" or smiley reaction button on each message should be replaced with a more dynamic, inviting design.

**Implementation:**
- The reaction trigger button displays a **greyscale emoji** that slowly **fades/cycles** between 4-6 different emojis
- The emojis it cycles through should be the current user's **most-used reactions** (pulled from the same emoji stats used for the quick-access row). If the player doesn't have enough usage data yet, fall back to the defaults: 👍 😂 ❤️ 🔥
- The cycle should be slow and subtle — fade transition every 3-4 seconds, not distracting
- The emoji is rendered in **greyscale/desaturated** (CSS `filter: grayscale(100%) opacity(0.5)`) so it doesn't compete with actual reactions on the message
- On hover (desktop), the emoji becomes full color and slightly larger as a hint that it's interactive
- On tap, it opens the reaction picker as usual
- This replaces the bare "+" character and the static smiley — the cycling animation makes it clear this button is for reactions without needing a tooltip

---

## 8. FIX: Mobile Bottom Sheet — X Button Overlap

On mobile, when the message detail bottom sheet slides up, the "×" close button in the top-right corner overlaps slightly with the message preview box.

**Fix:**
- Add more spacing/margin between the "×" button and the message preview container
- The "×" should sit clearly outside the message preview box, in the top-right corner of the bottom sheet itself (not inside the message area)
- Ensure the "×" has adequate tap target size (minimum 44x44px) and doesn't overlap with any content
- The "×" should have a small amount of padding from the right edge of the sheet (e.g., 12-16px from both top and right edges)

---

## 9. FEATURE: Player Color Customization

Allow players to change their assigned color from the settings/profile area. This color is used across the ENTIRE site — messages, reactions, player chips, initiative tracker, seating chart, conversation list, etc.

**Implementation:**

### Settings UI
- In the player settings area (gear icon in nav, or `/settings` page), add a **"Your Color"** section
- Shows the player's current color as a colored circle/swatch
- Tapping it opens a **color picker**:
  - A grid of preset color options (12-16 curated colors that look good on the dark theme) — these should all be vibrant and distinguishable from each other
  - Optionally: a custom hex input field for players who want a specific color
  - A live preview showing what their name/messages will look like with the new color
- "Save" button applies the change

### Data Model
- Add a `color` field to the `Player` model:
  ```prisma
  model Player {
    // ... existing fields
    color String? // custom hex color, null = use default from config
  }
  ```
- The default colors from `lib/players.ts` serve as fallbacks when `color` is null

### Site-Wide Integration (CRITICAL)
- **Everywhere** the player's color is currently referenced from the static `PLAYERS` config in `lib/players.ts`, it must now check the database `Player.color` field first, falling back to the static default if null
- Create a utility function or hook, e.g., `getPlayerColor(playerName)`, that:
  1. Checks if the player has a custom color in the database
  2. Falls back to the default from the static config
  3. Is used consistently across the entire codebase
- This affects: message bubbles, sender name labels, conversation list entries, player chips, initiative tracker entries, seating chart cards, reaction tooltips (who reacted), read receipt names, group member lists, nav bar "Logged in as" indicator, and any other place a player's color appears
- **Cache the player colors** on the client (e.g., in React context or a lightweight global store) to avoid fetching from the API on every render. Refresh the cache on page load or when the player changes their color.

### API
- `PUT /api/auth/update-color` — `{ playerName, color }` (player can only update their own; DM can update anyone's)
- `GET /api/players` — returns all players with their current colors (for the client-side cache)

### Constraints
- Colors must be valid hex codes (validate on both client and server)
- Warn the player if they pick a color that's too close to the background (#0d1117) or to another player's current color — "This color may be hard to see" or "This color is very similar to [Player]'s color"
- DM can reset any player's color back to the default from the DM Area or settings

---

## 10. TWEAK: Homepage Navigation Card Order

Reorder the tool cards on the homepage to match priority of use:

1. **Messages** (most used)
2. **Initiative Tracker**
3. **Games**
4. **Seating Chart**
5. **DM Area** (only visible when DM is authenticated — hidden for regular players)

Update the `tools` array in the homepage component to reflect this order. The DM Area card should only render if the user is authenticated as DM.