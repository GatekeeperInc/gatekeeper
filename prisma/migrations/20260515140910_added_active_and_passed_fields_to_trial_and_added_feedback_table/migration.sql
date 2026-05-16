-- AlterTable
ALTER TABLE "Trial" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passed" BOOLEAN DEFAULT false;

-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "trialId" INTEGER NOT NULL,
    "officerId" INTEGER NOT NULL,
    "performance" INTEGER NOT NULL,
    "attitude" INTEGER NOT NULL,
    "focus" INTEGER NOT NULL,
    "late" BOOLEAN NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_trialId_fkey" FOREIGN KEY ("trialId") REFERENCES "Trial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
