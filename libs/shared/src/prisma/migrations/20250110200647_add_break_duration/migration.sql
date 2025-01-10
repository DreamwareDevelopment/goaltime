/*
  Warnings:

  - You are about to drop the column `break_reminders` on the `goals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."goals" DROP COLUMN "break_reminders",
ADD COLUMN     "break_duration" INTEGER;
