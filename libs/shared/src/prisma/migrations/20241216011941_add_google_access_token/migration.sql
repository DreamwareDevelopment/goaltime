/*
  Warnings:

  - Added the required column `access_token` to the `google_auth` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."google_auth" ADD COLUMN     "access_token" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_profiles" ALTER COLUMN "preferred_sleep_time" SET DEFAULT '23:00'::time,
ALTER COLUMN "preferred_wake_up_time" SET DEFAULT '07:00'::time;
