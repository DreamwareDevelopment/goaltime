import { FastifyInstance } from 'fastify';
import { twiml } from 'twilio';
import { z } from 'zod';

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
      const response = new twiml.MessagingResponse();
      response.message(`You said: ${Body}`);
      reply.type('text/xml').send(response.toString());
    } else {
      // Handle other types of requests if needed
      reply.status(200).send({ status: 'ok' });
    }
  });
}

