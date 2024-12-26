/*
  Warnings:

  - Added the required column `preferred_sleep_time` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preferred_wake_up_time` to the `user_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."user_profiles" DROP COLUMN "preferred_sleep_time",
ADD COLUMN     "preferred_sleep_time" TIMESTAMP(3) NOT NULL,
DROP COLUMN "preferred_wake_up_time",
ADD COLUMN     "preferred_wake_up_time" TIMESTAMP(3) NOT NULL;
