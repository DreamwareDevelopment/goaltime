-- AlterTable
ALTER TABLE "public"."user_profiles" ALTER COLUMN "preferred_sleep_time" SET DEFAULT '23:00'::time,
ALTER COLUMN "preferred_wake_up_time" SET DEFAULT '07:00'::time;

-- CreateTable
CREATE TABLE "public"."google_auth" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token" VARCHAR(255) NOT NULL,
    "calendar_sync_token" VARCHAR(255),

    CONSTRAINT "google_auth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_auth_user_id_key" ON "public"."google_auth"("user_id");

-- AddForeignKey
ALTER TABLE "public"."google_auth" ADD CONSTRAINT "google_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
