import Fastify from 'fastify';
import { app } from './app/app';

const port = process.env.WEBSOCKET_SERVER_PORT ? Number(process.env.WEBSOCKET_SERVER_PORT) : 8888;

// Instantiate Fastify with some config
const server = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
server.register(app);

// Start listening.
server.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    console.log(`[ ready ]`);
  }
});
