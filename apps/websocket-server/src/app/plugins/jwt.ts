import fastifyJWT from "@fastify/jwt";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(async function (fastify: FastifyInstance) {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error("SUPABASE_JWT_SECRET is not set");
  }

  fastify.register(fastifyJWT, {
    secret: process.env.SUPABASE_JWT_SECRET,
  });
});
