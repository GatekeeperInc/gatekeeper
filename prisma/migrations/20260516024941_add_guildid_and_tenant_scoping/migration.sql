/*
  Warnings:

  - A unique constraint covering the columns `[guildId,userId,active]` on the table `Trial` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guildId` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guildId` to the `Trial` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_trialId_fkey";

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "guildId" TEXT NOT NULL,
ALTER COLUMN "officerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Trial" ADD COLUMN     "guildId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Feedback_guildId_idx" ON "Feedback"("guildId");

-- CreateIndex
CREATE INDEX "Feedback_trialId_idx" ON "Feedback"("trialId");

-- CreateIndex
CREATE INDEX "Trial_guildId_idx" ON "Trial"("guildId");

-- CreateIndex
CREATE INDEX "Trial_guildId_active_idx" ON "Trial"("guildId", "active");

-- CreateIndex
CREATE INDEX "Trial_guildId_userId_idx" ON "Trial"("guildId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Trial_guildId_userId_active_key" ON "Trial"("guildId", "userId", "active");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_trialId_fkey" FOREIGN KEY ("trialId") REFERENCES "Trial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
