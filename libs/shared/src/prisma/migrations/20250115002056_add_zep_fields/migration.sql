-- AlterTable
ALTER TABLE "public"."user_profiles" ADD COLUMN     "last_chat_session_id" UUID,
ADD COLUMN     "user_facts_session_id" UUID;
