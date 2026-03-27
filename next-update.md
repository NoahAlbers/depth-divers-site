Feature Batch: Achievements, Messaging Improvements, User Profiles
Repo: https://github.com/NoahAlbers/depth-divers-site
Branch: dev (set up the dev environment first — see Section 1)

0. PREREQUISITE: Dev Environment Setup
Before implementing anything in this document, set up the dev environment:

Create a dev branch from main on GitHub (if not already done)
Create a Neon database branch called dev from main (Neon dashboard → Branches → Create Branch)
Add Vercel environment variables scoped to the dev branch (Preview environment, branch filter = dev):

POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, POSTGRES_URL → dev branch connection strings
DM_PASSWORD=noah
NEXT_PUBLIC_ENVIRONMENT=dev


Add the subdomain dev.depthdivers.com in Vercel (Settings → Domains → assign to dev branch)
Add DNS CNAME record: dev → cname.vercel-dns.com
Add an environment banner to the site: when NEXT_PUBLIC_ENVIRONMENT=dev, show a fixed red banner at the very top of every page: "🔧 DEV ENVIRONMENT" — above the nav, full width, 24px tall, bg-red-600 text-white text-xs text-center. When production or undefined, show nothing.
Seed the dev database — run the same SQL setup script from V1 in the dev Neon SQL Editor (create tables + seed players with hashed passwords)
Verify the dev deployment works at dev.depthdivers.com

All subsequent features in this document should be implemented on the dev branch.

1. Achievement System
Achievement Definitions
All 60 achievements pre-loaded. Hidden achievements show their name but NOT their description — players know the achievement exists and can speculate about what it means, but don't know the exact criteria until someone unlocks it.
Hidden achievements (name visible, description hidden until earned) are marked below. I've selected achievements that are either rare/epic, embarrassing, unexpected, or that would be fun for players to speculate about:
Escape & Survival
SlugNameDescriptionHiddenon-the-runOn the RunBreak out of drow captureNoescape-artistEscape ArtistBreak out of drow capture... twice.NospelunkerSpelunkerSurvive 1+ month in Underdark tunnelsNoweb-runnerWeb RunnerSurvive the Silken PathsNonot-todayNot TodayDie, then come back.Nogame-overGame OverExperience a TPK.Yessole-survivorSole SurvivorBe the last party member standing in an encounterNofree-fallFree FallFall 500+ feetYesdinner-guestDinner GuestBe swallowed by a creatureYesfrequent-flyerFrequent FlyerGet launched, thrown, or blasted 30+ feet involuntarilyNo
Combat & Violence
SlugNameDescriptionHiddenregicideRegicideKill a leader or rulerNoheads-will-rollHeads Will RollKill a king or queen who rules over 5000+ peopleYesgod-slayerGod SlayerKill a deityYesdraconicidaDraconicidaKill an adult or older dragonNodomino-effectDomino EffectKill 3+ enemies with a single actionNoresourcefulResourcefulKill an enemy with an improvised weaponNocoup-de-graceCoup de GrâceLand the killing blow on a boss the DM spent hours preppingNoscorched-earthScorched EarthDestroy a building or structure during combatNorocks-fallRocks FallKill someone using the environmentNowrestling-proWrestling ProGrapple enemies 3 times in 1 encounterNoblind-sightBlind SightHit an enemy you cannot seeNokool-aid-manKool-Aid ManBurst through a wall to gain surprise.Yes
Dice Luck
SlugNameDescriptionHiddenone-in-80001/8000Roll three Natural 20s in a rowYeswhat-are-the-oddsWhat are the odds?Roll three Natural 1s in a rowYes
Roleplay & Social
SlugNameDescriptionHiddenthe-diplomatThe DiplomatTalk your way out of a fight that seemed inevitableNosilver-tongueSilver TongueSuccessfully deceive an NPC on a DC 20+Nomethod-actorMethod ActorTrick 3+ NPCs you are someone you are not, in one session.Noheart-of-goldHeart of GoldHelp someone with no benefit to yourselfNooath-breakerOath BreakerBreak a true promise you made to an NPCNofine-printFine PrintMake a deal without fully understanding the consequencesNoidentity-crisisIdentity CrisisQuestion your own faith, origin, or purpose to a level where your 'old' self would never imagine.Nowoo-wooWoo WooSeduce an NPCYeshomewreckerHomewreckerBreak up an NPC marriage or relationship.YesmissionaryMissionaryConvert an NPC's religionNoattorney-at-lawAttorney at LawWin a legal case.NobouncedBouncedGet kicked out of a public establishmentNocannibalCannibalEat an intelligent humanoid.Yes
Wealth & Property
SlugNameDescriptionHiddendragons-hoardDragon's HoardAmass 1000 gold pieces that are yours.NophilanthropistPhilanthropistGive away 100+ gold to those in needNolandlordLandlordOwn property for financial gainNopickpocketPickpocketSteal something from an NPC during conversation without them noticingNo
Magic & Supernatural
SlugNameDescriptionHiddencursedCursedBecome afflicted by a curseNopurifiedPurifiedHave a curse removedNoarcane-overloadArcane OverloadGain levels of exhaustion from over-casting a spellNoarcane-exertionArcane ExertionReach level 5+ of exhaustion by over-casting a spellYeshauntedHauntedBe targeted by a creature that attacks your dreamsNo
Body & Condition
SlugNameDescriptionHiddenhelen-kellerHelen KellerBe blind and deaf simultaneously.YeschangedChangedGet a permanent deformityNotattooedTattooedGet a permanent tattooNoiron-liverIron LiverSurvive past round 20 in a drinking contestNodesignated-driverDesignated DriverBe the only sober party member during a tavern sceneYes
Companions & Loss
SlugNameDescriptionHiddenpet-collectorPet CollectorHave 2+ animal companions simultaneouslyNocannon-fodderCannon FodderAn NPC you control diesNogone-but-not-forgottenGone But Not ForgottenLose a fellow party member permanentlyNoreincarnateReincarnateA past character of yours has diedNo
World Impact
SlugNameDescriptionHiddenviva-la-revolutionViva la RevolutionCause a revolutionNocivic-unrestCivic UnrestCause a civil warNolegendLegendHave a song, story, or rumor spread about you in-game.NowantedWantedHave a bounty placed on your headNo
Villains & Enemies
SlugNameDescriptionHiddenthe-bbeg-questionThe BBEG?Meet with a recurring villainNothe-bbegThe BBEGListen to a villain's monologueNogetting-evenGetting EvenExperience revenge from an old enemyNo
Exploration
SlugNameDescriptionHiddendeja-vuDeja VuReturn to a location you previously fled fromNo
Summary: 17 hidden, 43 visible.
Hidden achievements chosen because they are: extremely rare (God Slayer, 1/8000), embarrassing/funny (Cannibal, Homewrecker, Woo Woo, Helen Keller), epic surprises (Heads Will Roll, Kool-Aid Man, Free Fall, Dinner Guest), or "you'll know it when it happens" moments (Game Over, Designated Driver, Arcane Exertion, What are the odds?).
Data Model
prismamodel AchievementDefinition {
  id          String  @id @default(cuid())
  slug        String  @unique
  name        String
  description String
  category    String
  hidden      Boolean @default(false)
  icon        String  @default("🏆")
  order       Int     @default(0)
}

model PlayerAchievement {
  id              String   @id @default(cuid())
  playerName      String
  achievementSlug String
  awardedAt       DateTime @default(now())
  awardedBy       String   @default("DM")
  note            String?
  sessionNumber   Int?

  @@unique([playerName, achievementSlug])
}
Achievements Page (/achievements)

Grid of achievement cards organized by category
Each card shows: icon, name, and unlock status
Visible + unlocked: Full color, name and description shown, gold border, shows which players earned it
Visible + locked: Dimmed/greyed out, name and description shown but muted
Hidden + unlocked: Full color, name AND description revealed, gold border with a special "🔓 SECRET" badge
Hidden + locked: Shows the name only in muted text, description replaced with "???" — the card has a lock icon overlay
Player filter at the top: "All" or select a specific player
Progress bar per player: "12/43 achievements (28%)" — only counts visible achievements in the denominator so hidden ones don't reveal how many exist
Tapping an unlocked achievement opens detail: icon, name, description, who earned it (player colors), when, DM note, session number

DM Award Flow (DM Area → Achievements Section)

Dropdown to select player(s) — supports multi-select for bulk awards
Searchable/filterable achievement list showing only unearned achievements for the selected player
Tap to award → confirmation modal → optional note + session number → confirm
Revoke button on already-awarded achievements
"Create Custom Achievement" button: name, description, category, hidden toggle, icon (emoji picker)

Achievement Notification
When awarded:

Push notification: "🏆 Achievement Unlocked: [Name]!"
On-site toast: Gold-bordered card slides in from the top, shows icon + name + description. For hidden achievements: extra shimmer, "🔓 SECRET ACHIEVEMENT UNLOCKED" header. Auto-dismisses after 6 seconds.
Nav badge on "Achievements" link when new unviewed awards exist

API

GET /api/achievements — all definitions
GET /api/achievements/players — all player awards
GET /api/achievements/player/[name] — awards for one player
POST /api/achievements/award — DM awards { playerNames: string[], achievementSlug, note?, sessionNumber? } (DM auth)
DELETE /api/achievements/revoke — DM revokes { playerName, achievementSlug } (DM auth)
POST /api/achievements/create — DM creates custom { name, description, category, hidden, icon } (DM auth)

Nav & Homepage

Nav order: Messages, Initiative, Games, Seating, My Character, Achievements, DM Area
Homepage card: 🏆 icon, "Achievements", tagline "Track your legendary deeds"


2. Image Support in Messages
Players can share images in chat — screenshots, maps, character art, memes, etc.
Upload Flow

Next to the chat input text field, add a camera/image icon button (📷 or a paperclip icon)
Tapping it opens the device's file picker (accept: image/*)
On mobile, this also offers the camera option natively
Selected image shows as a preview thumbnail in the input area before sending
Player can add text alongside the image or send image-only
"Send" button submits both text and image

Image Storage

Images are uploaded to /api/messages/upload as multipart form data
Server saves the image to Vercel Blob Storage (or a /public/uploads/ directory if simpler)
The API returns a URL to the stored image
The message is saved with imageUrl field in addition to body

Data Model Update
Add to MessageV2:
prismamodel MessageV2 {
  // ... existing fields
  imageUrl String?  // URL of attached image, null if text-only
}
Display

Messages with images render the image as a responsive thumbnail (max-width: 300px, max-height: 400px)
Tapping the image opens it full-screen in a lightbox overlay (dark background, pinch-to-zoom on mobile, click outside or X to close)
Images load lazily (only when scrolled into view) to keep chat performant
Show a loading skeleton/placeholder while the image loads
If both text and image are present, show the text above the image

Constraints

Max file size: 5MB per image
Accepted formats: JPEG, PNG, GIF, WebP
Images are compressed/resized server-side to max 1200px on the longest edge before storage (keeps storage manageable)
Rate limit: max 10 images per minute per player (prevent spam)


3. Message Tray (Persistent Bottom Tab)
A persistent message tray/tab at the bottom of the screen so players can access messages from anywhere in the app without navigating away from their current page.
Design

A small tab bar fixed to the bottom of the screen on all pages (except the full Messages page itself, since you're already there)
The tab shows: a chat bubble icon 💬, "Messages" label, and an unread badge count
Collapsed state (default): Just the small tab bar at the bottom (~44px tall). Shows unread count.
Expanded state: Tapping the tab slides up a message panel from the bottom, taking up ~60% of the screen height. The panel contains:

A mini version of the conversation list (friends only, no groups — keep it simple)
Tap a contact to open a mini chat view within the tray
Chat input at the bottom of the tray
A "drag handle" at the top to resize or dismiss
An "Open full" button that navigates to the full /messages page


Swiping down or tapping outside collapses the tray back to the tab bar

When to Hide the Tray

Don't show the tray on the /messages page — redundant since the full messaging UI is already open
Don't show during active games — the game UI needs full screen
Hide when chat history fills the screen on mobile — if the conversation list or chat thread is already taking up the full viewport in the expanded tray, the tray should be usable but shouldn't also show in the background on the main messages page

Implementation

The tray is rendered in the root layout (app/layout.tsx) so it persists across page navigations
It uses the same messaging API and polling as the full Messages page
State (collapsed/expanded, active conversation) is stored in React context
The tray shares the useUnreadCount hook with the nav bar — both show the same count


4. Mobile Message Input — Fix Focus/Viewport Issue
When tapping the message input on mobile/tablet, the browser scrolls/shifts the viewport to bring the input into view. This breaks the chat layout.
Fix (Simple Approach — No Complex Hacks)
Since the previous complex fix attempts (VirtualKeyboard API, position: fixed, etc.) caused layout issues, use a minimal approach:

Structure the chat page as a flex column with height: 100dvh (or 100% of the parent)
The message list is flex: 1; overflow-y: auto; min-height: 0
The input bar is flex-shrink: 0
Add overscroll-behavior: contain on the message list to prevent pull-to-refresh interference
On input focus, after a 300ms delay (let the keyboard finish opening):

javascript  messageList.scrollTop = messageList.scrollHeight; // Scroll messages to bottom
  window.scrollTo(0, 0); // Reset any page-level scroll

Do NOT use position: fixed on the chat container
Do NOT use the VirtualKeyboard API
Do NOT use the opacity animation hack
Keep it simple — let the browser handle the keyboard, just ensure messages stay scrolled to the bottom


5. Message Input Field — Auto-Expand
The message text input should grow in height as the player types more text, up to a maximum, then scroll internally.
Implementation

Use a <textarea> instead of <input> (if not already)
Start at 1 line height (~44px)
As the player types and text wraps, the textarea grows to fit: 2 lines, 3 lines, up to a maximum of 5 lines (~120px)
Beyond 5 lines, the textarea stops growing and scrolls internally (overflow-y: auto)
On send, reset the textarea back to 1 line

typescriptconst adjustHeight = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto'; // Reset to recalculate
  const maxHeight = 120; // ~5 lines
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
};

// Call on every input change
<textarea
  onChange={(e) => {
    setMessage(e.target.value);
    adjustHeight(e.target);
  }}
  rows={1}
  style={{ resize: 'none', overflow: 'hidden', minHeight: '44px' }}
/>

The send button should stay vertically centered relative to the textarea as it grows
The message list above should shrink to accommodate the taller input area (flex layout handles this naturally)


6. User Profiles
Each player has a viewable profile that other players can see.
Profile Page (/profile/[playerName])
Content:

Player name (large, in their color)
Character name (below the player name, slightly smaller)
Player color swatch (the circle showing their chosen color)
Online status indicator:

🟢 Green dot + "Online" if the player has been active in the last 2 minutes
🟡 Yellow dot + "Away" if active in the last 15 minutes
⚫ Gray dot + "Last online: [relative time]" if longer than 15 minutes


Character info (pulled from their CharacterSheet):

Race & Class (if stored)
Level
Ability scores displayed as a compact stat block


Achievement showcase: The player's 3-5 most recently earned achievements (small cards, tapping goes to the achievements page)
Achievement count: "🏆 12 achievements"
Game stats (if data is available):

Total games played
Highest score in each game category
Win count (times they placed #1)


Member since: When their account was created

Online Status Tracking
Track when each player was last active:
prismamodel Player {
  // ... existing fields
  lastActiveAt DateTime? // Updated on any API call or page load
}

Update lastActiveAt on:

Any API call made by the player (message sent, poll voted, game played)
Page load / polling heartbeat (every 30 seconds, a lightweight POST /api/heartbeat updates the timestamp)


The heartbeat should only fire when the tab is visible (document.visibilityState === 'visible')

API

GET /api/profile/[playerName] — returns player profile data (name, color, character info, online status, achievement count, game stats)
POST /api/heartbeat — updates lastActiveAt for the authenticated player (lightweight, no response body needed)

Accessing Profiles

In the messaging sidebar (Friends tab), tapping a player's avatar/color dot (not their name — their name opens the chat) opens their profile
Or add a small "ℹ" info icon next to each player name that links to their profile
In any context where a player name is displayed with their color (message sender, achievement earners, game leaderboards), the name could be tappable to view their profile
Profile is read-only for other players — you can only edit your own (settings page)

Mobile Layout

Profile is a single scrollable page
Character info at the top, achievements in the middle, game stats at the bottom
Online status as a small badge in the top-right corner


Implementation Priority

Dev environment setup (Section 0) — must be done first
Message input auto-expand (Section 5) — quick fix, immediate quality of life
Mobile focus fix (Section 4) — simple approach, fixes existing annoyance
Image support in messages (Section 2) — moderate complexity
User profiles (Section 6) — new feature, moderate complexity
Achievement system (Section 1) — largest feature, highest impact
Message tray (Section 3) — most complex UI work, can be done last