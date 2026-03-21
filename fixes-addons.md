# Quick Fix: Hamburger Menu & Revert Keyboard Changes

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. REVERT: Undo All Mobile Keyboard Viewport Fixes

Completely revert ALL changes made for the mobile keyboard viewport scroll fix. This includes removing any:

- `position: fixed` added to the chat page container
- Custom `--viewport-height` CSS variables and the JavaScript that sets them
- `visualViewport` resize event listeners
- `navigator.virtualKeyboard` API calls
- Opacity animation keyframe hacks for preventing scroll on focus
- `overscroll-behavior` changes related to the keyboard fix
- Any `focusin`/`focusout` event listeners added for keyboard handling
- Any changes to the chat layout structure that were part of the keyboard fix (restore the layout to how it was BEFORE the keyboard fix was attempted)

Return the messages page to the exact state it was in before the keyboard fix was attempted. It was working fine layout-wise — the only issue was the viewport scroll on focus, which we'll live with for now.

---

## 2. FIX: Hamburger Menu — Needs Solid Background & Correct Z-Index

The mobile slideout hamburger menu is rendering without a background, so the page content behind it is visible and overlapping with the menu text. This makes the menu unreadable.

**Fix:**
- The menu tray/overlay must have a **solid opaque background** — use the site's dark background color (`#0d1117` or the equivalent Tailwind `bg-surface` / `bg-background` class)
- Set `z-index` high enough that the menu sits **above ALL other page content** — use `z-50` in Tailwind (z-index: 50) or higher if needed
- The semi-transparent backdrop overlay behind the menu (that covers the rest of the page) should also have a high z-index, just below the menu tray itself
- The menu tray should have `position: fixed` so it overlays the page regardless of scroll position
- Make sure the menu background covers the ENTIRE tray area — from the top of the tray to the bottom, full width

**Expected result:**
- When the hamburger menu opens, a dark backdrop dims the page content
- The menu tray slides in with a fully opaque dark background
- No page content is visible through or overlapping with the menu
- Menu text is clearly readable against the solid dark background
- The X close button, nav links, player name, and notification toggle are all cleanly rendered on the solid background