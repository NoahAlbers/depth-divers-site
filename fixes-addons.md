# Bug Fixes & Addons: Messaging Polish Pass

**Repo**: https://github.com/NoahAlbers/depth-divers-site

Reference screenshots from the current mobile and desktop builds are the basis for these fixes. This document should be treated as a follow-up to the previous messaging refinements — everything from the last round has been implemented.

---

## 1. FIX: Message Text Overflow

Messages with long unbroken strings (like URLs) overflow outside the message bubble container. Visible in the screenshots where a wikidot URL extends beyond the bubble boundary.

**Fix:**
- Add `word-break: break-word` and `overflow-wrap: break-word` to all message bubble containers
- URLs and other long unbroken text must wrap within the bubble, never overflow
- Apply to both sender and receiver message bubbles
- Also apply to the message preview text in the conversation list (left panel) — long messages in the preview should truncate with ellipsis, not overflow

---

## 2. FIX: Conversation List — Sort by Last Message

The conversation list (Friends tab, Groups tab, and DM's Player Chats tab) should be sorted by **most recent message first**. Conversations with the newest activity appear at the top.

- If a conversation has no messages, it sorts to the bottom
- When a new message arrives in any conversation, that conversation jumps to the top of the list
- This should apply to all tabs: My Chats, Player Chats (DM), and Groups

---

## 3. FEATURE: Group Chat Deletion — Player Request Flow

Players should be able to **request** that a group chat be deleted, but only the DM can actually delete it.

**Player side:**
- In a group chat, add a "Request Deletion" option (accessible via a menu/gear icon in the chat header, or a long-press on the group in the Groups list)
- Tapping it sends a notification/message to the DM: "[Player Name] has requested deletion of group '[Group Name]'"
- The player sees a confirmation: "Deletion request sent to the DM"
- The player CANNOT delete the group themselves

**DM side:**
- DM receives the deletion request as a system notification or in the DM Area live feed
- DM can then delete the group from their Groups tab or DM Area
- Alternatively, the DM can ignore the request
- DM retains the ability to delete any group at any time without a request

---

## 4. TWEAK: Inline Date/Time and Reaction Button

Currently the timestamp ("2d ago") and the "+" reaction button are on separate lines below the message, taking up extra vertical space.

**Fix:**
- Place the timestamp and the reaction trigger on the **same line**, right-aligned below the message body
- Layout: `[timestamp]  [reaction button]` on one line, right-aligned within the bubble
- The reaction button should be a small emoji icon (e.g., a subtle smiley face 😊 or a "+" inside a circle) rather than just a bare "+" character — make it clearer that tapping it adds a reaction
- On hover (desktop), the reaction button can become more visible/prominent
- On mobile, the reaction button should always be visible (no hover state needed)
- Keep it subtle so it doesn't distract from the message content, but recognizable enough that players understand what it does

---

## 5. FIX: Remove "Messages" Header on Mobile Chat View

When on mobile and viewing a specific conversation (after tapping a contact), the large "MESSAGES" page header still shows above the chat window. This wastes valuable screen real estate on mobile.

**Fix:**
- When a conversation is open on mobile (the chat view is active), **hide the "MESSAGES" page title**
- The conversation header (back arrow + contact name + pinboard icon) is sufficient for context
- The "MESSAGES" title should only show on the conversation list view (when no chat is open)
- This gives more vertical space for the actual message thread on small screens

---

## 6. FIX: Mobile Bottom Sheet — Add Custom Reaction Button

The mobile bottom sheet (shown when tap-holding a message) currently shows the 6 quick-access emojis but is **missing the "+" button** to open the full emoji picker.

**Fix:**
- Always show the "+" button at the end of the quick-access emoji row in the bottom sheet
- The "+" should open the full searchable emoji picker (as specified in the previous doc)
- If screen width is too tight to show all 6 emojis + the "+", reduce the quick-access emojis (show 4 or 5) but ALWAYS keep the "+" visible
- The "+" button should be the same size as the emoji buttons and clearly styled (e.g., a circle with a "+" inside, matching the overall theme)

---

## 7. FIX: Inline Reaction Picker — Responsive Emoji Count

When pressing the "+" reaction button on a message and the inline reaction picker appears, on small screens the picker overflows and the "+" custom emoji button gets cut off.

**Fix:**
- Dynamically adjust how many quick-access emojis show based on available screen width:
  - Screen < 360px: show 3 emojis + "+" button
  - Screen 360-420px: show 4 emojis + "+"
  - Screen 420-500px: show 5 emojis + "+"
  - Screen > 500px: show all 6 emojis + "+"
- The "+" button to open the full emoji picker must ALWAYS be visible — it is never the element that gets cut off
- Use CSS media queries or a JavaScript-based width check on the container
- The picker should never cause horizontal scroll or overflow

---

## 8. TWEAK: Message Bubble Alignment

Currently all message bubbles appear to be left-aligned regardless of who sent them. Standard chat convention is:

- **Messages from the current user**: right-aligned, with a slightly different background color or border
- **Messages from others**: left-aligned

**Fix:**
- Messages sent by the currently logged-in player should be right-aligned (`justify-end` / `ml-auto`)
- Messages from others should be left-aligned (`justify-start` / `mr-auto`)
- Both should have a max-width (e.g., 75-80% of the container) so they don't span the full width
- Optionally, use a slightly different bubble background or border color for sent vs received to reinforce the distinction
- The sender name label can be hidden on the current user's own messages (they know they sent it) or shown in a more subtle way

---

## 9. TWEAK: IC/OOC Buttons — Prevent Browser Chrome Overlap

On mobile, the IC and OOC toggle buttons below the text input are partially cut off by the browser's bottom navigation chrome (visible in the screenshots).

**Fix:**
- Add `padding-bottom` or `margin-bottom` to the chat input area to account for mobile browser chrome
- Use `env(safe-area-inset-bottom)` in CSS to dynamically handle the safe area on iOS and Android:
  ```css
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  ```
- Alternatively, move the IC/OOC toggles to be inline with the text input and send button (to the left of the text input, or as small toggle chips inside the input bar) rather than on a separate row below — this saves vertical space AND avoids the chrome overlap issue
- Test on iOS Safari and Android Chrome to confirm nothing is cut off

---

## 10. TWEAK: Send Button Alignment (Revisited)

The send button is still slightly misaligned vertically with the text input field (visible in screenshots).

**Fix:**
- Ensure the chat input container uses `display: flex; align-items: center;` (Tailwind: `flex items-center`)
- The text input and send button should share the same height, or the send button should be vertically centered relative to the input
- If the IC/OOC toggles remain below the input, they should not affect the vertical alignment of the input + send button row
- Test on both mobile and desktop to confirm alignment

---

## 11. TWEAK: Conversation List — Visual Separation of DMs vs Groups

In the DM's "My Chats" tab (screenshot 3), direct message conversations and group chats appear in the same list without clear visual distinction.

**Fix:**
- Direct messages show the player's colored dot + name (as they do now)
- Group chats should have a visually distinct indicator — a small group icon (e.g., 👥) before the group name, or a different shaped indicator (square instead of circle dot)
- This makes it easy to scan the list and distinguish DMs from groups at a glance

---

## 12. TWEAK: Reaction Picker — Better Trigger Button

The current "+" button for adding reactions is not self-explanatory. New users might not understand it's for reactions.

**Fix:**
- Replace the bare "+" with a small, recognizable reaction icon. Options:
  - A small smiley face outline (😊) that's slightly faded/muted — universally recognized as "add reaction"
  - A smiley face with a small "+" overlay in the corner
- On hover (desktop), show a tooltip: "Add reaction"
- On first use (or first visit), optionally show a brief tooltip/hint that this is for reactions — then dismiss permanently after the player uses it once