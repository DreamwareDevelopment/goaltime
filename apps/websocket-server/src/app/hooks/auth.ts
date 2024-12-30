import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

export default fp(async function (fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request) => {
    if (request.url.endsWith('/health')) {
      return
    }
    await request.jwtVerify();
  });
});
