-- Rename "Johnathan" to "Jonathan" across all tables
-- Run this in the Neon SQL Editor

UPDATE "Player" SET name = 'Jonathan' WHERE name = 'Johnathan';
UPDATE "Player" SET password = '$2a$10$placeholder' WHERE name = 'Jonathan';
-- NOTE: The password hash above is a placeholder. After running this migration,
-- the DM should reset Jonathan's password from the DM Area settings.

UPDATE "MessageV2" SET "from" = 'Jonathan' WHERE "from" = 'Johnathan';
UPDATE "ConversationRead" SET "playerName" = 'Jonathan' WHERE "playerName" = 'Johnathan';
UPDATE "MessageReaction" SET "playerName" = 'Jonathan' WHERE "playerName" = 'Johnathan';
UPDATE "Initiative" SET name = 'Jonathan' WHERE name = 'Johnathan';
UPDATE "CharacterSheet" SET "playerName" = 'Jonathan' WHERE "playerName" = 'Johnathan';
UPDATE "PushSubscription" SET "playerName" = 'Jonathan' WHERE "playerName" = 'Johnathan';

-- Conversation members is a JSON string — use REPLACE
UPDATE "Conversation" SET members = REPLACE(members, 'Johnathan', 'Jonathan') WHERE members LIKE '%Johnathan%';

-- SeatingLock seats is a JSON string — update if exists
UPDATE "SeatingLock" SET seats = REPLACE(seats, 'Johnathan', 'Jonathan') WHERE seats LIKE '%Johnathan%';

-- GameSession players and results are JSON strings
UPDATE "GameSession" SET players = REPLACE(players, 'Johnathan', 'Jonathan') WHERE players LIKE '%Johnathan%';
UPDATE "GameSession" SET results = REPLACE(results, 'Johnathan', 'Jonathan') WHERE results LIKE '%Johnathan%';
