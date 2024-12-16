GRANT ALL PRIVILEGES ON DATABASE "postgres" TO "service";
GRANT ALL PRIVILEGES ON SCHEMA "public" TO "service";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" TO "service";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public" TO "service";
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA "public" TO "service";
GRANT ALL PRIVILEGES ON SCHEMA "private" TO "service";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA "private" TO "service";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "private" TO "service";
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA "private" TO "service";

-- CREATE POLICY "tenant_isolation_policy" ON "user_profiles" USING ("user_id" = current_setting('app.user_id', TRUE)::uuid);
