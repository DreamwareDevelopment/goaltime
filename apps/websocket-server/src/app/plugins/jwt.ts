import fastifyJWT from "@fastify/jwt";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(async function (fastify: FastifyInstance) {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error("SUPABASE_JWT_SECRET is not set");
  }

  fastify.register(fastifyJWT, {
    secret: process.env.SUPABASE_JWT_SECRET,
    verify: {
      extractToken(request) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (request.query as any).access_token as string | undefined;
      },
    },
  });
});
