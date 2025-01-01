-- CreateIndex
CREATE INDEX "calendar_events_user_id_start_time_end_time_all_day_idx" ON "public"."calendar_events"("user_id", "start_time", "end_time", "all_day");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_idx" ON "public"."calendar_events"("user_id");
