import AutoLoad from '@fastify/autoload';
import { FastifyInstance } from 'fastify';
import inngestFastify from 'inngest/fastify';
import * as path from 'path';

import { inngest, InngestEvent } from '@/server-utils/inngest';
import { checkIn } from '@/server-utils/ai';

import { syncToClient } from './lib/sync';
import { startAccountabilityLoop } from './accountability/loop';

/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: { ...opts },
  });

  fastify.register(inngestFastify, {
    client: inngest,
    functions: [startAccountabilityLoop, syncToClient, checkIn],
    options: {}
  });

  // This loads all plugins defined in hooks
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'hooks'),
    options: { ...opts },
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: { ...opts },
  });

  fastify.addHook('onReady', async () => {
    console.log('Sending start accountability loop event');
    await inngest.send({
      name: InngestEvent.StartAccountabilityLoop,
      data: {} as never,
    });
  });
  fastify.addHook('onClose', async () => {
    console.log('Sending stop accountability loop event');
    await inngest.send({
      name: InngestEvent.StopAccountabilityLoop,
      data: {} as never,
    });
  });
}
