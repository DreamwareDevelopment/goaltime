import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

export default fp(async function (fastify: FastifyInstance) {
  fastify.addHook('onRequest', async function (request) {
    if (request.url.endsWith('/health') || request.url.includes('webhooks') || request.url.split('?')[0].endsWith('/inngest')) {
      return
    }
    await request.jwtVerify();
  });
});
