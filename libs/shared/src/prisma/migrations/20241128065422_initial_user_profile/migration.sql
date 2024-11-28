/*
  Warnings:

  - You are about to alter the column `name` on the `user_profiles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `avatarUrl` on the `user_profiles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - A unique constraint covering the columns `[user_id]` on the table `user_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Made the column `avatarUrl` on table `user_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."user_profiles_name_key";

-- AlterTable
ALTER TABLE "public"."user_profiles" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "occupation" VARCHAR(100),
ADD COLUMN     "preferredCurrency" VARCHAR(10) NOT NULL DEFAULT 'USD',
ADD COLUMN     "preferredLanguage" VARCHAR(10) NOT NULL DEFAULT 'en',
ADD COLUMN     "preferredSleepTime" TIME NOT NULL DEFAULT '23:00'::time,
ADD COLUMN     "preferredWakeUpTime" TIME NOT NULL DEFAULT '07:00'::time,
ADD COLUMN     "timeZone" VARCHAR(255) NOT NULL DEFAULT 'America/Los_Angeles',
ADD COLUMN     "user_id" UUID NOT NULL,
ADD COLUMN     "weeklyWorkHours" INTEGER NOT NULL DEFAULT 40,
ALTER COLUMN "name" SET DEFAULT 'GT User',
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "avatarUrl" SET NOT NULL,
ALTER COLUMN "avatarUrl" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "public"."user_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
