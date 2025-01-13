-- AlterTable
ALTER TABLE "public"."google_auth" ADD COLUMN     "has_synced_before" BOOLEAN NOT NULL DEFAULT false;
