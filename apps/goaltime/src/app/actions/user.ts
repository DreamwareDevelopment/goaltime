'use server'

import { UserProfileInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'
import twilio from 'twilio'

export async function createUserProfileAction(profile: UserProfileInput) {
  delete profile.otp
  const prisma = await getPrismaClient(profile.userId)
  const userProfile = await prisma.userProfile.create({
    data: profile,
  })
  return userProfile
}

export async function updateUserProfileAction(profile: Partial<UserProfileInput>) {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.userProfile.update({
    where: { userId: profile.userId },
    data: profile,
  })
}

export async function subscribeToMailingListAction(email: string) {
  const prisma = await getPrismaClient()
  return prisma.emailSubscription.create({ data: { email } })
}

function getTwilioVerificationService() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    throw new Error('Twilio credentials are not set');
  }

  const client = twilio(accountSid, authToken);
  const service = client.verify.v2.services(serviceSid);
  if (!service) {
    throw new Error('Twilio verification service is not set')
  }
  return service
}

export async function verifyPhoneNumberAction(phone: string, otp: string) {
  try {
    const service = getTwilioVerificationService()
    const verificationCheck = await service
      .verificationChecks
      .create({ to: phone, code: otp });

    if (verificationCheck.status === 'approved') {
      return { success: true, message: 'Phone number verified successfully' };
    } else {
      console.error(`Invalid verification code: ${verificationCheck.status}`)
      return { success: false, message: 'Invalid Verification Code' };
    }
  } catch (error) {
    console.error('Error verifying phone number:', error);
    return { success: false, message: 'Error verifying phone number' };
  }
}

export async function sendOTPAction(phone: string) {
  const service = getTwilioVerificationService()
  await service.verifications.create({ to: phone, channel: 'sms' })
}
