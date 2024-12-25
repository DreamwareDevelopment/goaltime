import { createTool } from '@inngest/agent-kit';
import { z } from 'zod';
import twilio from 'twilio';

export function getTwilioMessageService() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const serviceSid = process.env.TWILIO_MESSAGE_SERVICE_SID
  if (!accountSid || !authToken || !serviceSid) {
    throw new Error('TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_MESSAGE_SERVICE_SID must be set');
  }
  const service = twilio(accountSid, authToken).messages
  if (!service) {
    throw new Error('Twilio message service is not set')
  }
  return { service, serviceSid }
}

export async function sendSMS(phone: string, message: string) {
  const { service, serviceSid } = getTwilioMessageService();
  await service.create({
    to: phone,
    body: message,
    messagingServiceSid: serviceSid,
  });
}

export const sendSMSTool = createTool({
  name: 'send_sms',
  description:
    "Sends an SMS message to a user. Use this when you need to send a text message to a user.",
  parameters: z.object({
    phone: z.string(),
    message: z.string(),
  }),
  handler: async ({ phone, message }, { network, agent, step }) => {
    step.run(`send-message`, async () => {
      await sendSMS(phone, message);
    })
  },
});
