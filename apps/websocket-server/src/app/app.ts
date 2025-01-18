import AutoLoad from '@fastify/autoload';
import formBody from '@fastify/formbody';
import qs from 'qs';
import { FastifyInstance } from 'fastify';
import inngestFastify from 'inngest/fastify';
import * as path from 'path';

import { inngest, InngestEvent } from '@/server-utils/inngest';

import { syncToClient } from './lib/sync';
import { checkIn } from './accountability/check-in';
import { chat } from './accountability/chat';
import { startAccountabilityLoop } from './accountability/loop';
import { incomingSMS } from './routes/webhooks/messaging';

/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  fastify.register(formBody, {
    parser: (body) => qs.parse(body),
  });

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: { ...opts },
  });

  fastify.register(inngestFastify, {
    client: inngest,
    functions: [startAccountabilityLoop, syncToClient, checkIn, chat, incomingSMS],
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
    dirNameRoutePrefix: true,
    options: { ...opts },
  });

  fastify.addHook('onReady', async function () {
    console.log('Restarting accountability loop...');
    setTimeout(async () => {
      await inngest.send({
        name: InngestEvent.StopAccountabilityLoop,
        data: {} as never,
      });
      console.log('Sent stop accountability loop event.');
      setTimeout(async () => {
        await inngest.send({
          name: InngestEvent.StartAccountabilityLoop,
          data: {} as never,
        });
        console.log('Sent start accountability loop event.');
      }, 10000);
    }, 10000);
  });
  fastify.addHook('preClose', async function () {
    console.log('Sending stop accountability loop event');
    await inngest.send({
      name: InngestEvent.StopAccountabilityLoop,
      data: {} as never,
    });
  });
}
