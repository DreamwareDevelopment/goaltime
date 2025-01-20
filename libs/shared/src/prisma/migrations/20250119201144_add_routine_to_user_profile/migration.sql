/*
  Warnings:

  - You are about to drop the column `preferred_sleep_time` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_wake_up_time` on the `user_profiles` table. All the data in the column will be lost.
  - Added the required column `routine` to the `user_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."user_profiles" DROP COLUMN "preferred_sleep_time",
DROP COLUMN "preferred_wake_up_time",
ADD COLUMN     "routine" JSONB NOT NULL;
