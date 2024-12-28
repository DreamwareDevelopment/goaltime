-- AlterTable
ALTER TABLE "public"."calendar_events" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterType
ALTER TYPE "public"."calendar_providers" ADD VALUE 'goaltime';
