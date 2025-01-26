-- CreateEnum
CREATE TYPE "public"."Plan" AS ENUM ('Committed', 'Ambitious', 'Superhuman', 'None');

-- AlterTable
ALTER TABLE "public"."user_profiles" ADD COLUMN     "plan" "public"."Plan" NOT NULL DEFAULT 'None',
ADD COLUMN     "stripe_customer_id" VARCHAR(255),
ADD COLUMN     "stripe_price_id" VARCHAR(255),
ADD COLUMN     "stripe_product_id" VARCHAR(255),
ADD COLUMN     "email" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "public"."user_profiles"("email");
CREATE UNIQUE INDEX "user_profiles_stripe_customer_id_key" ON "public"."user_profiles"("stripe_customer_id");