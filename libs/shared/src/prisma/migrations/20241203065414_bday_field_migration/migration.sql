/*
  Warnings:

  - You are about to drop the column `birth_date` on the `user_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."user_profiles" DROP COLUMN "birth_date",
ADD COLUMN     "birthday" TIMESTAMP(3),
ALTER COLUMN "preferred_sleep_time" SET DEFAULT '23:00'::time,
ALTER COLUMN "preferred_wake_up_time" SET DEFAULT '07:00'::time;
