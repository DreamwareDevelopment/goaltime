import { inngest, InngestEvent } from '@/server-utils/inngest';
import { getPrismaClient } from '@/server-utils/prisma';
import { FastifyInstance } from 'fastify';
import { twiml } from 'twilio';
import { z } from 'zod';
import { chat, WELCOME_MESSAGE } from '../../accountability/chat';
import { sendSMS } from '@/server-utils/ai';

// Define the schema for the request body
const twilioRequestBodySchema = z.object({
  Body: z.string(),
  From: z.string(),
  To: z.string(),
  SmsMessageSid: z.string().optional(),
});

export default async function (fastify: FastifyInstance) {
  fastify.post('/messaging', async function (request, reply) {
    // Parse and validate the request body
    const requestBody = twilioRequestBodySchema.safeParse(request.body);
    if (!requestBody.success) {
      // Handle validation errors
      reply.status(400).send({ error: 'Invalid request body' });
      return;
    }

    const { Body, From } = requestBody.data;
    // Check if the request is a valid incoming message
    if (requestBody.data.SmsMessageSid) {
      // Process the incoming message
      console.log(`Received message from ${From}: ${Body}`);
      const userId = await getUserIdByPhoneNumber(From);
      if (!userId) {
        const response = new twiml.MessagingResponse();
        response.message(`User not found, sign up at https://goaltime.ai/login?type=signup`);
        return reply.type('text/xml').send(response.toString());
      } else {
        await inngest.send({
          name: InngestEvent.IncomingSMS,
          data: {
            from: From,
            message: Body,
            userId,
          },
        });
      }
    }
    reply.status(200).send({ status: 'ok' });
  });
}

async function getUserIdByPhoneNumber(phoneNumber: string) {
  const prisma = await getPrismaClient();
  const profile = await prisma.userProfile.findFirst({
    where: {
      phone: phoneNumber,
    },
  });
  return profile?.userId ?? null;
}

export const incomingSMS = inngest.createFunction(
  {
    id: 'incoming-sms',
    concurrency: {
      limit: 1,
      scope: "env",
      key: "event.data.from"
    }
  },
  {
    event: InngestEvent.IncomingSMS,
  },
  async ({ event, logger, step }) => {
    const { from, message, userId } = event.data;
    let responseText = '';
    if (!userId) {
      logger.info(`User with phone number ${from} not found, sending signup link`);
      responseText = WELCOME_MESSAGE;
    } else {
      logger.info(`User with phone number ${from} found, executing chat`);
      responseText = await step.invoke(`chat-for-user-${userId}`, {
        function: chat,
        data: {
          userId,
          message,
        },
      });
    }
    logger.info(`Sending response to ${from}:\n"${responseText}"`);
    await step.run('send-response', async () => {
      await sendSMS(from, responseText);
    });
  });
