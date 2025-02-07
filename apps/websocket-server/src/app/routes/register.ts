import { FastifyInstance } from 'fastify';
import { ConnectionManager } from '../lib/manager';

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/register',
    { websocket: true },
    function (socket, request) {
      console.log(`Registering websocket connection for ${request.supabaseUser.id}`);
      socket.on('close', (event) => {
        console.log(`WebSocket closed for ${request.supabaseUser.id}: ${event.reason}`);
        ConnectionManager.getInstance().removeConnection(request.supabaseUser.id);
      });
      socket.on('error', (error) => {
        console.error(`Error on websocket for ${request.supabaseUser.id}: ${error}`);
        ConnectionManager.getInstance().removeConnection(request.supabaseUser.id);
      });
      ConnectionManager.getInstance().addConnection(request.supabaseUser.id, socket);
    },
  );
}
