-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "trialRoleId" TEXT NOT NULL,
    "raiderRoleId" TEXT NOT NULL,
    "officerChannelId" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
