CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_secret (secret_name text)
RETURNS TEXT
SECURITY DEFINER
SET search_path = private, vault
AS
$$ 
DECLARE 
   secret text;
BEGIN
   SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = secret_name;
   RETURN secret;
END;
$$ language plpgsql;

CREATE OR REPLACE FUNCTION private.http_request(
    url text,
    method text,
    payload jsonb DEFAULT '{}'::jsonb,
    headers jsonb DEFAULT '{}'::jsonb,
    params jsonb DEFAULT '{}'::jsonb,
    timeout_ms integer DEFAULT 1000,
    hook_table_id bigint DEFAULT NULL,
    hook_name text DEFAULT NULL
) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path = private, net, supabase_functions
    AS $$
      DECLARE
        request_id bigint;
      BEGIN
        IF url IS NULL OR url = 'null' THEN
          RAISE EXCEPTION 'url argument is missing';
        END IF;

        IF method IS NULL OR method = 'null' THEN
          RAISE EXCEPTION 'method argument is missing';
        END IF;

        CASE method
          WHEN 'GET' THEN
            SELECT http_get INTO request_id FROM net.http_get(
              url,
              params,
              headers,
              timeout_ms
            );
          WHEN 'POST' THEN
            SELECT net.http_post(
              url,
              payload,
              params,
              headers,
              timeout_ms
            ) INTO request_id;
          ELSE
            RAISE EXCEPTION 'method argument % is invalid', method;
        END CASE;
        RAISE LOG 'Request ID: %', request_id;
        IF hook_table_id IS NOT NULL AND hook_name IS NOT NULL THEN
            INSERT INTO supabase_functions.hooks
              (hook_table_id, hook_name, request_id)
            VALUES
              (hook_table_id, hook_name, request_id);
        END IF;
      END
    $$;

CREATE OR REPLACE FUNCTION public.call_edge_function_from_trigger()
RETURNS trigger
SET search_path = public, private
AS $$
DECLARE
    function_name TEXT;
    functions_url TEXT;
    full_url TEXT;
    payload JSONB;
BEGIN
    IF TG_ARGV[0] IS NULL THEN
        RAISE EXCEPTION 'function_name argument is missing';
    END IF;
    function_name := TG_ARGV[0];

    SELECT private.get_secret('FUNCTIONS_URL') INTO functions_url;
    IF functions_url IS NULL THEN
        RAISE EXCEPTION 'functions_url is missing';
    END IF;

    full_url := functions_url || '/functions/v1/' || function_name;
    RAISE LOG 'Full URL: %', full_url;

    -- Initialize payload
    payload := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA
    );

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        payload := jsonb_set(payload, '{record}', to_jsonb(NEW));
    END IF;

    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        payload := jsonb_set(payload, '{old_record}', to_jsonb(OLD));
    END IF;

    BEGIN
        RAISE LOG 'Issuing HTTP request';
        PERFORM private.http_request(
            full_url,
            'POST'::text,
            payload::jsonb,
            jsonb_build_object('Content-Type', 'application/json')::jsonb,
            '{}'::jsonb,
            5000::integer,
            TG_RELID::bigint,
            TG_NAME::text
        );
        RAISE LOG 'HTTP request completed';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE LOG 'Error performing HTTP request: %', SQLERRM;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
