-- AlterTable
ALTER TABLE "public"."user_profiles" DROP COLUMN "days_in_office",
DROP COLUMN "leaves_home_at",
DROP COLUMN "returns_home_at",
DROP COLUMN "works_remotely",
ADD COLUMN     "ends_work_at" TIMESTAMP(3) NULL DEFAULT NULL,
ADD COLUMN     "starts_work_at" TIMESTAMP(3) NULL DEFAULT NULL,
ADD COLUMN     "unemployed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "work_days" JSONB NULL DEFAULT NULL;

-- AddForeignKey
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
