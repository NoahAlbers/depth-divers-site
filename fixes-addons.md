# URGENT FIX: Mobile Chat Layout Broken

**Repo**: https://github.com/NoahAlbers/depth-divers-site

## Problem

The previous mobile keyboard viewport fix has broken the chat layout:

1. **Empty space**: Without touching the textbox, there is a large amount of empty/dead space to the right and below the messaging area. The chat container is not filling the full viewport width or height.
2. **Scroll on focus**: When tapping the text input, the viewport scrolls all the way down to empty space — the user sees nothing but blank dark background with the keyboard open.
3. **Jump on typing**: When the user starts typing, the view jumps back up but the chat area is now smaller/squished.

## Root Cause (Likely)

The `position: fixed` approach from the previous fix was applied incorrectly — possibly:
- The fixed container doesn't have `width: 100%` or `left: 0; right: 0`
- The height is being calculated wrong (using a JS variable that's not set correctly, or `100vh` which lies on mobile)
- The fixed layout is being applied globally instead of only when a conversation is open on mobile
- Multiple competing height/position strategies are conflicting with each other

## Fix: Start Clean

**Step 1: Remove all the previous keyboard fix attempts.** Strip out any:
- `position: fixed` on the chat page container
- Custom `--viewport-height` CSS variables and the JS that sets them
- The `visualViewport` resize listener
- The opacity animation keyframe hack
- Any `overscroll-behavior` changes
- Any `navigator.virtualKeyboard` API calls

Get the chat page back to a working state first, even if the keyboard scroll issue returns temporarily.

**Step 2: Rebuild the chat layout properly.**

The messages page when a conversation is open should use this structure:

```
┌──────────────────────────┐ ← top of screen
│ Chat Header (back + name)│ ← fixed height, flex-shrink: 0
├──────────────────────────┤
│                          │
│   Message Thread         │ ← flex: 1, overflow-y: auto
│   (scrollable)           │
│                          │
├──────────────────────────┤
│ Input bar + IC/OOC       │ ← fixed height, flex-shrink: 0
└──────────────────────────┘ ← bottom of screen (or keyboard)
```

The key CSS for the chat page container (when a conversation is open on mobile):

```css
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;       /* dynamic viewport height — accounts for browser chrome */
  height: 100vh;        /* fallback for browsers that don't support dvh */
  width: 100%;
  overflow: hidden;     /* the PAGE doesn't scroll — only the message list does */
}

.chat-header {
  flex-shrink: 0;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain; /* prevents pull-to-refresh interference */
  min-height: 0;        /* CRITICAL: allows flex child to shrink below content height */
}

.chat-input-area {
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom, 0px); /* iPhone notch/home bar */
}
```

**Important**: Use `height: 100dvh` (dynamic viewport height) as the primary value. This is the modern solution that correctly accounts for mobile browser chrome (address bar, bottom bar). Put `height: 100vh` as a fallback BEFORE the `100dvh` line for browsers that don't support `dvh` yet.

**Do NOT use `position: fixed`** on the chat container. Instead, make the chat page the ONLY content on the screen when a conversation is open (no page-level scrollable content outside it). The flex layout with `overflow: hidden` on the container and `overflow-y: auto` on the message list achieves the same result without the complexity and bugs of fixed positioning.

**Step 3: Handle the keyboard — minimal approach.**

Instead of the complex multi-strategy approach from before, use a single lightweight solution:

```javascript
// Only on mobile
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  const chatInput = document.querySelector('.chat-input');
  const messageList = document.querySelector('.chat-messages');
  
  chatInput?.addEventListener('focus', () => {
    // Small delay to let the keyboard finish opening
    setTimeout(() => {
      // Scroll message list to bottom so newest messages are visible
      messageList.scrollTop = messageList.scrollHeight;
      // Prevent any page-level scroll that the browser might have done
      window.scrollTo(0, 0);
    }, 300);
  });
}
```

That's it. The flex layout handles the resizing (the browser shrinks the viewport when the keyboard opens, the flex container adjusts, the message list shrinks, the input stays at the bottom). The focus handler just ensures the messages stay scrolled to the bottom and the page doesn't jump.

**Step 4: Test the following scenarios on a real mobile device (or emulator):**
1. Open a conversation — chat should fill the full screen width and height. No dead space.
2. Tap the text input — keyboard opens, chat area shrinks, input stays visible above keyboard, messages remain visible. No viewport jump.
3. Type a message and send — everything stays in place.
4. Dismiss the keyboard — chat area expands back to full height smoothly.
5. Scroll through messages — only the message list scrolls, header and input stay fixed in place.
6. Rotate device — layout adjusts correctly.
7. Open/close the pinboard — doesn't break the layout.

## Summary

The previous fix was over-engineered and introduced layout bugs. The correct approach is:
1. **Flex layout** with `height: 100dvh` on the container and `overflow: hidden`
2. **Only the message list scrolls** (`overflow-y: auto` with `min-height: 0`)
3. **Minimal JS** — just scroll messages to bottom on input focus and reset page scroll
4. **No `position: fixed`** on the chat container
5. **No custom viewport height calculations** — let `100dvh` and the browser handle it
6. **`env(safe-area-inset-bottom)`** on the input area for iPhone home bar

Keep it simple. The flex layout does the heavy lifting.