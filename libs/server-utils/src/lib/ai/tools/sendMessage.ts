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
