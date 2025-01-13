import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.post('/messaging', async function (request) {
    console.log('messaging webhook', request.body);
    return { status: 'ok' };
  });
}

