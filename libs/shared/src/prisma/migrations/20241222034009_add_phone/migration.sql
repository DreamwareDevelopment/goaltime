/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `user_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `notification_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `user_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."notification_settings" DROP CONSTRAINT "notification_settings_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."notification_settings" ADD COLUMN     "phone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_profiles" ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "preferred_sleep_time" SET DEFAULT '23:00'::time,
ALTER COLUMN "preferred_wake_up_time" SET DEFAULT '07:00'::time;

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_phone_key" ON "public"."user_profiles"("phone");

-- AddForeignKey
ALTER TABLE "public"."notification_settings" ADD CONSTRAINT "notification_settings_phone_fkey" FOREIGN KEY ("phone") REFERENCES "public"."user_profiles"("phone") ON DELETE CASCADE ON UPDATE CASCADE;
