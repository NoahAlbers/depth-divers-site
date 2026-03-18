# Feature Request: Player Login & Password System

## Overview

Replace the current honor-system player selector with a proper login system. Each player logs in with their name and a password. The DM can manage all passwords.

---

## Requirements

### Default Passwords

Every player starts with a default password equal to their name in **all lowercase**:

| Player    | Default Password |
|-----------|-----------------|
| Mykolov   | `mykolov`       |
| Brent     | `brent`         |
| Johnathan | `johnathan`     |
| Justin    | `justin`        |
| Eric      | `eric`          |
| Matthew   | `matthew`       |

The DM (Noah) keeps the existing password: `noah`

### Login Flow

- Replace the current player name dropdown with a **login form**: player selects their name from a dropdown, then enters their password
- On successful login, store a session token or identifier in localStorage (same pattern as before, just now it's authenticated)
- If the password is wrong, show an error message — keep it themed (e.g., "The passphrase is incorrect, adventurer.")
- Password verification must happen **server-side** via an API route — don't check passwords on the client

### Modal / Popup Centering (CRITICAL — applies to ALL modals)

The login popup, password change dialog, DM password prompt, and ANY other modal or overlay in the app must be properly centered in the viewport and never overflow off-screen. **This is a known existing bug — fix it everywhere while implementing this feature.**

Every modal/dialog must use:
- `position: fixed` with `inset: 0` and `display: flex; align-items: center; justify-content: center` to center in the **viewport**
- `max-height: 90vh` with `overflow-y: auto` on the modal content so it scrolls internally on small screens
- A semi-transparent backdrop (`bg-black/60` or similar) behind the modal
- `max-width: 90vw` (or a fixed max like `400px`) on the modal content
- **Never** use `position: absolute` for modals — always `fixed`

Search the entire codebase for every modal, dialog, and overlay component and apply these rules consistently. Test that the login form, password change form, and DM password prompt are all fully visible and usable on a small mobile screen (375x667).

### Password Change

- After logging in, players can change their own password from a settings/profile area (could be a small gear icon in the nav, or a `/settings` page)
- Password change form: current password, new password, confirm new password
- Validate that current password is correct before allowing the change
- Server-side validation on the API route

### DM Password Management

- In DM mode, Noah can see a list of all players and **reset any player's password** to whatever he wants
- This should be in a DM-only settings/admin area (behind the existing DM auth gate)
- DM does NOT need to know the player's current password to reset it — DM override
- After a DM reset, the player will need to use the new password on their next login

### Database Changes

Add a new model (or add a `password` field to an existing player-related model):

```prisma
model Player {
  id       String @id @default(cuid())
  name     String @unique
  password String // stored as a hashed value
}
```

- **Hash all passwords** using bcrypt (install `bcryptjs` — works in Vercel serverless). Never store plaintext passwords.
- Seed the database with all 6 players and their default passwords (hashed) on first migration or via a seed script.
- The DM account can either be in this same table with `name: "Noah"` or kept separate — whatever's cleanest with the existing code.

### API Routes

- `POST /api/auth/login` — `{ name, password }` → verifies credentials, returns success + player info
- `POST /api/auth/change-password` — `{ name, currentPassword, newPassword }` → player changes their own password
- `POST /api/auth/reset-password` — `{ targetPlayer, newPassword }` → DM resets a player's password (requires DM auth header)

### Migration Notes

- This replaces the honor-system dropdown, so remove the old unprotected player selector
- The "Logged in as [Name]" indicator in the nav should stay — it now reflects the authenticated player
- Existing features (messaging `from` field, etc.) should pull the player identity from the authenticated session, not from an unverified localStorage value
- The DM login flow stays the same (password: `noah`) but should go through the same auth system now — Noah is just another player entry with DM privileges

### Seed Script

Create a Prisma seed script (`prisma/seed.ts`) that:
1. Creates all 6 player entries with bcrypt-hashed default passwords
2. Creates the DM entry (Noah) with hashed password `noah`
3. Is idempotent — safe to run multiple times (upsert, not create)

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```