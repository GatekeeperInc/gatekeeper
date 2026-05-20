-- Allow trial history by keeping only one ACTIVE trial per user per guild.
-- We replace the old (guildId, userId, active) uniqueness constraint with
-- a partial unique index on active=true.
ALTER TABLE "Trial"
DROP CONSTRAINT IF EXISTS "Trial_guildId_userId_active_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Trial_guildId_userId_active_true_key"
ON "Trial" ("guildId", "userId")
WHERE "active" = true;
