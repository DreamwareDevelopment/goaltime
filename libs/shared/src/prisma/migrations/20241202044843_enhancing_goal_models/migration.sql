/*
  Warnings:

  - You are about to drop the column `weekly_work_hours` on the `user_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."goals" ADD COLUMN     "can_do_during_work" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."user_profiles" DROP COLUMN "weekly_work_hours",
ADD COLUMN     "days_in_office" JSONB,
ADD COLUMN     "leaves_home_at" TIMESTAMP(3),
ADD COLUMN     "returns_home_at" TIMESTAMP(3),
ADD COLUMN     "works_remotely" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "preferred_sleep_time" SET DEFAULT '23:00'::time,
ALTER COLUMN "preferred_wake_up_time" SET DEFAULT '07:00'::time;
