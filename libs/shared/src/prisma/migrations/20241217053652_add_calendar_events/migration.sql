/*
  Warnings:

  - You are about to drop the `NotificationSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."event_types" AS ENUM ('birthday', 'default', 'focusTime', 'fromGmail', 'outOfOffice', 'workingLocation');

-- CreateEnum
CREATE TYPE "public"."calendar_providers" AS ENUM ('google');

-- DropForeignKey
ALTER TABLE "public"."NotificationSettings" DROP CONSTRAINT "NotificationSettings_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."NotificationSettings" DROP CONSTRAINT "NotificationSettings_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."user_profiles" ALTER COLUMN "preferred_sleep_time" SET DEFAULT '23:00'::time,
ALTER COLUMN "preferred_wake_up_time" SET DEFAULT '07:00'::time;

-- DropTable
DROP TABLE "public"."NotificationSettings";

-- CreateTable
CREATE TABLE "public"."notification_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "push_before" INTEGER,
    "push_after" INTEGER,
    "text_before" INTEGER,
    "text_after" INTEGER,
    "text_check_in" BOOLEAN NOT NULL DEFAULT false,
    "phone_before" INTEGER,
    "phone_after" INTEGER,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calendar_events" (
    "id" VARCHAR(1024) NOT NULL,
    "provider" "public"."calendar_providers" NOT NULL DEFAULT 'google',
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "location" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "start_time" TEXT,
    "end_time" TEXT,
    "time_zone" TEXT,
    "eventType" "public"."event_types" NOT NULL DEFAULT 'default',
    "all_day" TEXT,
    "color" TEXT NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_goal_id_key" ON "public"."notification_settings"("goal_id");

-- AddForeignKey
ALTER TABLE "public"."notification_settings" ADD CONSTRAINT "notification_settings_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
