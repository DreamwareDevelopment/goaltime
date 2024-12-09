-- AlterTable
ALTER TABLE "public"."user_profiles" ADD COLUMN     "has_onboarded" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "preferred_sleep_time" SET DEFAULT '23:00'::time,
ALTER COLUMN "preferred_wake_up_time" SET DEFAULT '07:00'::time;
