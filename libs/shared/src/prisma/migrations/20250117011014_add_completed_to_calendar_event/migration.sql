-- DropForeignKey
ALTER TABLE "public"."calendar_events" DROP CONSTRAINT "calendar_events_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."calendar_events" ADD COLUMN     "completed" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
