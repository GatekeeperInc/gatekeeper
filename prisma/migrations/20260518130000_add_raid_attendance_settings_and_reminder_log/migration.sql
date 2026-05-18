-- Add guild-level raid schedule and attendance reminder threshold settings.
ALTER TABLE "Settings"
ADD COLUMN "raidScheduleCron" TEXT,
ADD COLUMN "raidAttendanceReminderThreshold" INTEGER;

-- Add a persisted local-date key for feedback attendance dedupe.
ALTER TABLE "Feedback"
ADD COLUMN "raidAttendanceDate" TEXT;

-- Add supporting indexes for attendance queries.
CREATE INDEX "Feedback_guildId_trialId_idx" ON "Feedback"("guildId", "trialId");
CREATE INDEX "Feedback_guildId_raidAttendanceDate_idx" ON "Feedback"("guildId", "raidAttendanceDate");

-- Create reminder log table for daily dedupe and auditability.
CREATE TABLE "AttendanceReminderLog" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "trialId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderDate" TEXT NOT NULL,
    "attendanceCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceReminderLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttendanceReminderLog_guildId_trialId_userId_reminderDate_key"
ON "AttendanceReminderLog"("guildId", "trialId", "userId", "reminderDate");

CREATE INDEX "AttendanceReminderLog_guildId_reminderDate_idx"
ON "AttendanceReminderLog"("guildId", "reminderDate");

CREATE INDEX "AttendanceReminderLog_guildId_userId_idx"
ON "AttendanceReminderLog"("guildId", "userId");

ALTER TABLE "AttendanceReminderLog"
ADD CONSTRAINT "AttendanceReminderLog_trialId_fkey"
FOREIGN KEY ("trialId") REFERENCES "Trial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
