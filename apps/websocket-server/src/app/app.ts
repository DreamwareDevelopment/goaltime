import AutoLoad from '@fastify/autoload';
import formBody from '@fastify/formbody';
import cors from '@fastify/cors';
import qs from 'qs';
import { FastifyInstance } from 'fastify';
import inngestFastify from 'inngest/fastify';
import * as path from 'path';

import { inngestConsumer, InngestEvent, syncGoogleCalendar, syncCalendars, scheduleGoalEvents } from '@/server-utils/inngest';

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
    client: inngestConsumer,
    functions: [
      checkIn,
      chat,
      incomingSMS,
      scheduleGoalEvents,
      startAccountabilityLoop,
      syncCalendars,
      syncGoogleCalendar,
      syncToClient,
    ],
    options: {},
  });

  // This loads all plugins defined in hooks
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'hooks'),
    options: { ...opts },
  });

  fastify.register(cors, {
    origin: process.env.NEXT_PUBLIC_HOST,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Accept-Encoding',
      'Accept-Language',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'Access-Control-Request-Private-Network',
      'Authorization',
      'Connection',
      'Content-Type',
      'Host',
      'Origin',
      'Referer',
      'Sec-Ch-Ua',
      'Sec-Ch-Ua-Mobile',
      'Sec-Ch-Ua-Platform',
      'Sec-Fetch-Dest',
      'Sec-Fetch-Mode',
      'Sec-Fetch-Site',
      'User-Agent',
    ],
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
      await inngestConsumer.send({
        name: InngestEvent.StopAccountabilityLoop,
        data: {} as never,
      });
      console.log('Sent stop accountability loop event.');
      setTimeout(async () => {
        await inngestConsumer.send({
          name: InngestEvent.StartAccountabilityLoop,
          data: {} as never,
        });
        console.log('Sent start accountability loop event.');
      }, 10000);
    }, 10000);
  });
  fastify.addHook('preClose', async function () {
    console.log('Sending stop accountability loop event');
    await inngestConsumer.send({
      name: InngestEvent.StopAccountabilityLoop,
      data: {} as never,
    });
  });
}
