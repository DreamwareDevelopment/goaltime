import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';

export default fp(async function (fastify: FastifyInstance) {
  fastify.register(websocket);
});
