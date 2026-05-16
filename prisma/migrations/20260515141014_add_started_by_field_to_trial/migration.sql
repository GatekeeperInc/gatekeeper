/*
  Warnings:

  - Added the required column `startedById` to the `Trial` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trial" ADD COLUMN     "startedById" TEXT NOT NULL;
