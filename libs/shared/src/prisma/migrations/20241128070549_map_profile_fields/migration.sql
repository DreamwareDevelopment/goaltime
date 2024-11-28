/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredCurrency` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredLanguage` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredSleepTime` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferredWakeUpTime` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `timeZone` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyWorkHours` on the `user_profiles` table. All the data in the column will be lost.
  - Added the required column `avatar_url` to the `user_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."user_profiles" DROP COLUMN "avatarUrl",
DROP COLUMN "birthDate",
DROP COLUMN "preferredCurrency",
DROP COLUMN "preferredLanguage",
DROP COLUMN "preferredSleepTime",
DROP COLUMN "preferredWakeUpTime",
DROP COLUMN "timeZone",
DROP COLUMN "weeklyWorkHours",
ADD COLUMN     "avatar_url" VARCHAR(255) NOT NULL,
ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "preferred_currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
ADD COLUMN     "preferred_language" VARCHAR(10) NOT NULL DEFAULT 'en',
ADD COLUMN     "preferred_sleep_time" TIME NOT NULL DEFAULT '23:00'::time,
ADD COLUMN     "preferred_wake_up_time" TIME NOT NULL DEFAULT '07:00'::time,
ADD COLUMN     "timezone" VARCHAR(255) NOT NULL DEFAULT 'America/Los_Angeles',
ADD COLUMN     "weekly_work_hours" INTEGER NOT NULL DEFAULT 40;
