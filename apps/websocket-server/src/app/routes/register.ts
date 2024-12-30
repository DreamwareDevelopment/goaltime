import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/register',
    { websocket: true },
    function (socket, request) {
      console.log(`Registering websocket connection for ${request.supabaseUser?.id}`);
      socket.on('message', (message) => {
        console.log(message);
      });
    },
  );
}
