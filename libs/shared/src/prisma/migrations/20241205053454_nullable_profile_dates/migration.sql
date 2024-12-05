-- AlterTable
ALTER TABLE "public"."user_profiles" ALTER COLUMN "preferred_sleep_time" DROP NOT NULL,
ALTER COLUMN "preferred_sleep_time" SET DEFAULT '23:00'::time,
ALTER COLUMN "preferred_wake_up_time" DROP NOT NULL,
ALTER COLUMN "preferred_wake_up_time" SET DEFAULT '07:00'::time;
