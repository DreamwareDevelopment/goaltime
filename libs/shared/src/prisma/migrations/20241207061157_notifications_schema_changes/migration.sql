/*
  Warnings:

  - You are about to drop the column `push_check_in` on the `NotificationSettings` table. All the data in the column will be lost.
  - The `push_before` column on the `NotificationSettings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `push_after` column on the `NotificationSettings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `text_before` column on the `NotificationSettings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `text_after` column on the `NotificationSettings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `phone_before` column on the `NotificationSettings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `phone_after` column on the `NotificationSettings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."NotificationSettings" DROP COLUMN "push_check_in",
DROP COLUMN "push_before",
ADD COLUMN     "push_before" INTEGER,
DROP COLUMN "push_after",
ADD COLUMN     "push_after" INTEGER,
DROP COLUMN "text_before",
ADD COLUMN     "text_before" INTEGER,
DROP COLUMN "text_after",
ADD COLUMN     "text_after" INTEGER,
DROP COLUMN "phone_before",
ADD COLUMN     "phone_before" INTEGER,
DROP COLUMN "phone_after",
ADD COLUMN     "phone_after" INTEGER;

-- AlterTable
ALTER TABLE "public"."user_profiles" ALTER COLUMN "preferred_sleep_time" SET DEFAULT '23:00'::time,
ALTER COLUMN "preferred_wake_up_time" SET DEFAULT '07:00'::time;
