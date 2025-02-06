-- CreateTable
CREATE TABLE "public"."linked_calendar_events" (
    "id" VARCHAR(1024) NOT NULL DEFAULT gen_random_uuid(),
    "event_id" VARCHAR(1024) NOT NULL,
    "event_title" VARCHAR(1024) NOT NULL,
    "goal_id" UUID,
    "user_id" UUID NOT NULL,

    CONSTRAINT "linked_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linked_calendar_events_event_id_key" ON "public"."linked_calendar_events"("event_id");

-- CreateIndex
CREATE INDEX "linked_calendar_events_user_id_event_id_goal_id_event_title_idx" ON "public"."linked_calendar_events"("user_id", "event_id", "goal_id", "event_title");

-- AddForeignKey
ALTER TABLE "public"."linked_calendar_events" ADD CONSTRAINT "linked_calendar_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."linked_calendar_events" ADD CONSTRAINT "linked_calendar_events_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."linked_calendar_events" ADD CONSTRAINT "linked_calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
