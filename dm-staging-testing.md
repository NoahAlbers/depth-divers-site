# Feature Request: DM Impersonate Mode & Staging Environment

**Repo**: https://github.com/NoahAlbers/depth-divers-site

---

## 1. DM Impersonate Mode

### Overview
Allow the DM (Noah) to view and interact with the entire site as if they were any specific player. Full impersonation — the DM can see their messages, submit their initiative, join games as them, send messages as them. This is essential for testing features from the player's perspective without logging out or using multiple devices.

### How It Works

#### DM Area UI
- In the DM Area (`/dm`), add an **"Impersonate Player"** section
- Dropdown listing all 6 players (Mykolov, Brent, Johnathan, Justin, Eric, Matthew), each shown with their player color
- "View as [Player]" button to activate impersonation
- "Stop Impersonating" button to return to normal DM mode

#### Persistent Impersonation Banner
- When impersonation is active, a **fixed banner** sticks to the top of every page on the site (above the nav bar)
- Banner displays: `"👁 Viewing as [Player Name] — [Exit]"`
- The player name is shown in their assigned color
- "Exit" is a clickable link that immediately drops back to normal DM mode
- Banner should be visually distinct (e.g., a colored strip with a semi-transparent background) so the DM never forgets they're impersonating
- Banner must be visible on all screen sizes (mobile, tablet, desktop)

#### Behavior While Impersonating
- **Identity override**: All API calls that normally use the DM's identity instead use the impersonated player's name. The site renders everything as if the DM IS that player.
- **Messaging**: Shows only the impersonated player's conversations (sent + received). Can send messages as that player. Does NOT show DM god-mode inbox.
- **Initiative**: If in entry phase, shows the impersonated player's input field. Can submit a roll as that player.
- **Games**: Can join a game lobby as that player. Can play and submit scores as that player.
- **Seating**: Sees the player view (locked arrangement, no DM lock controls).
- **Nav bar**: Shows "Logged in as [Player Name]" instead of DM badge.
- **Notifications/unread badges**: Reflects the impersonated player's unread counts, not the DM's.

#### Implementation Approach
- Store impersonation state in a React context (client-side): `{ isImpersonating: boolean, impersonatedPlayer: string | null }`
- When impersonation is active, all hooks and API calls that reference the current user should read from the impersonation context instead of the real auth session
- The DM's actual auth session remains intact in localStorage — impersonation is a layer on top, not a session swap
- Only the DM can impersonate (requires DM auth to activate)
- Impersonation state is stored in `sessionStorage` (not `localStorage`) so it clears when the tab is closed — prevents accidentally staying in impersonate mode

#### API Considerations
- API routes that check player identity should accept an optional `X-Impersonate` header containing the player name
- The server validates that the request also has valid DM auth before honoring the impersonation header
- If DM auth is not present, the `X-Impersonate` header is ignored (prevents non-DM spoofing)
- Example: `POST /api/messages/send` with `X-Impersonate: Mykolov` and valid DM auth → message is sent as Mykolov

---

## 2. Staging Environment

### Overview
A completely separate instance of the site with its own database, used for testing new features without affecting production data. Safe to break, reset, or fill with test data.

### Setup

#### Vercel Preview/Branch Deployments
- Create a `staging` branch in the GitHub repo
- Vercel automatically creates a preview deployment for non-main branches
- The staging deployment gets its own URL (e.g., `staging-depth-divers.vercel.app` or a custom subdomain like `staging.yourdomain.com`)

#### Separate Database
- Provision a **second Neon Postgres database** (or a second branch in the same Neon project — Neon supports database branching on the free tier)
- The staging deployment uses its own set of environment variables pointing to the staging database
- In the Vercel dashboard, set environment variables scoped to the **Preview** environment (not Production):
  ```
  POSTGRES_PRISMA_URL=     [staging DB connection string]
  POSTGRES_URL_NON_POOLING=[staging DB connection string]
  DM_PASSWORD=noah
  VAPID_PUBLIC_KEY=        [can reuse or generate new]
  VAPID_PRIVATE_KEY=       [can reuse or generate new]
  ```

#### Seeding Staging Data
- The staging database should be seeded with the same player accounts and default passwords as production
- Run the same SQL setup script (or Prisma seed) against the staging database
- Optionally add extra test data: sample messages, game sessions, initiative entries — so the DM can test features against realistic data without manually creating it every time

#### Workflow
1. New features are developed on feature branches
2. Feature branches are merged into `staging` for testing
3. DM tests on the staging URL (with impersonate mode to test as different players)
4. Once verified, `staging` is merged into `main` → auto-deploys to production

#### Reset Script
- Create a utility script (or SQL file) that wipes and reseeds the staging database
- The DM can run this from the Neon SQL Editor whenever the staging data gets messy
- The script should:
  1. Truncate all tables except `Player` (keep accounts intact)
  2. Optionally reseed with sample test data (a few messages, a locked seating arrangement, an initiative encounter)

### DM Area Integration
- In the DM Area, add a small indicator showing which environment the DM is currently on: **"Production"** or **"Staging"**
- This prevents the DM from accidentally testing features on the live site
- Implementation: check an environment variable like `NEXT_PUBLIC_ENVIRONMENT=production` or `NEXT_PUBLIC_ENVIRONMENT=staging` and display it in the DM Area header

---

## Priority Order

1. **DM Impersonate Mode** — most immediately useful, no infrastructure changes needed
2. **Staging branch + separate database** — set up once, use forever
3. **Environment indicator in DM Area** — small but prevents mistakes
4. **Staging reset script** — convenience tool for keeping test data clean