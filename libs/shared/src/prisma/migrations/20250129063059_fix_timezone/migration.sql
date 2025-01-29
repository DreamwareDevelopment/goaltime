/*
  Warnings:

  - You are about to drop the column `time_zone` on the `calendar_events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."calendar_events" DROP COLUMN "time_zone",
ADD COLUMN     "timezone" TEXT;
