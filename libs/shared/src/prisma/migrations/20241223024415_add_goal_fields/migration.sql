-- AlterTable
ALTER TABLE "public"."goals" ADD COLUMN     "deadline" TIMESTAMP(3) NULL DEFAULT NULL,
ADD COLUMN     "estimate" DOUBLE PRECISION NULL DEFAULT NULL,
ADD COLUMN     "minimum_time" INTEGER NOT NULL,
ADD COLUMN     "maximum_time" INTEGER NOT NULL,
ADD COLUMN     "break_reminders" BOOLEAN NOT NULL,
ADD COLUMN     "allow_multiple_per_day" BOOLEAN NOT NULL,
ALTER COLUMN "can_do_during_work" DROP DEFAULT,
ALTER COLUMN "commitment" DROP NOT NULL;

