import createError from "@fastify/error";
import type { JWT } from "@fastify/jwt";
import {
  SupabaseClient,
  SupabaseClientOptions,
  createClient,
} from "@supabase/supabase-js";
import type { FastifyPluginCallback, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

const AuthorizationTokenInvalidError = createError(
  "FST_SB_AUTHORIZATION_TOKEN_INVALID",
  "Authorization token is invalid",
  401,
);

const NoUserDataFoundError = createError(
  "FST_SB_NO_USER_DATA_FOUND",
  "No user data found in the request. Make sure to run request.jwtVerify() before trying to access the user.",
  401,
);

interface SupabaseUser {
  id: string;
}

declare module "fastify" {
  export interface FastifyInstance {
    supabaseClient: SupabaseClient;
    jwt: JWT;
  }
  export interface FastifyRequest {
    _supabaseClient: SupabaseClient;
    supabaseUser: SupabaseUser;
  }
}

export type FastifySupabasePluginOpts = {
  url: string;
  serviceKey: string;
  anonKey: string;
  options?: SupabaseClientOptions<"public">;
};

const fastifySupabase: FastifyPluginCallback<FastifySupabasePluginOpts> = (
  fastify,
  opts,
  next,
) => {
  const { options } = opts;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(url, serviceKey, options);

  if (fastify.supabaseClient) {
    return next(new Error("fastify-supabase has already been registered"));
  }

  fastify.decorate("supabaseClient", supabase);

  fastify.decorateRequest<SupabaseClient | null>(
    "_supabaseClient",
    null,
  );
  fastify.decorateRequest<SupabaseClient>(
    "supabaseClient",
    {
      getter() {
        const req = this as unknown as FastifyRequest;

        if (req._supabaseClient) return req._supabaseClient;

        if ((req.user as { role?: string }).role === "service_role") {
          req._supabaseClient = fastify.supabaseClient;
        } else if (
          (req.user as { role?: string }).role &&
          (req.user as { role?: string }).role !== "anon"
        ) {
          const client = createClient(url, anonKey, {
            ...options,
            auth: {
              ...options?.auth,
              persistSession: false,
            },
            global: {
              ...options?.global,
              headers: {
                ...options?.global?.headers,
                Authorization: `Bearer ${fastify.jwt.lookupToken(req)}`,
              },
            },
          });
          req._supabaseClient = client as SupabaseClient;
        }

        if (!req._supabaseClient) {
          throw new AuthorizationTokenInvalidError();
        }

        return req._supabaseClient;
      },
    },
    ["user"],
  );

  fastify.decorateRequest<SupabaseUser>(
    "supabaseUser",
    {
      getter() {
        const req = this as unknown as FastifyRequest;

        if (!req.user) {
          throw new NoUserDataFoundError();
        }

        return {
          id: (req.user as { sub: string }).sub,
        } as SupabaseUser;
      },
    },
    ["user"],
  );

  next();
};

export default fp(fastifySupabase, {
  name: "fastify-supabase",
  dependencies: ["@fastify/jwt"],
});
