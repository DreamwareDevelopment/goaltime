-- AlterTable
ALTER TABLE "public"."calendar_events" ADD COLUMN     "duration" INTEGER;

-- DropIndex
DROP INDEX "public"."calendar_events_user_id_start_time_end_time_all_day_idx";

-- CreateIndex
CREATE INDEX "calendar_events_user_id_start_time_all_day_idx" ON "public"."calendar_events"("user_id", "start_time", "all_day");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_goal_id_start_time_duration_idx" ON "public"."calendar_events"("user_id", "goal_id", "start_time", "duration");
