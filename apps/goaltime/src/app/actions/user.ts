'use server'

import { UserProfileInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'
import twilio from 'twilio'
import { UserProfile } from '@prisma/client'
import { inngest, InngestEvent } from '@/server-utils/inngest'
import { zep } from '@/server-utils/ai'

import { fullSyncCalendarAction, syncCalendarAction } from './calendar'
import { SanitizedUser } from '@/shared/utils'

const zepIgnoredUserFields = [
  'userId',
  'name',
  'otp',
  'avatarUrl',
  'phone',
  'hasOnboarded',
]

function getZepUserMetadata(userProfile: UserProfile) {
  return Object.fromEntries(Object.entries(userProfile).filter(([key]) => !zepIgnoredUserFields.includes(key)))
}

export async function createUserProfileAction(user: SanitizedUser, profile: UserProfileInput) {
  delete profile.otp
  const prisma = await getPrismaClient(profile.userId)
  const userProfile = await prisma.userProfile.create({
    data: {
      ...profile,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      preferredWakeUpTime: profile.preferredWakeUpTime!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      preferredSleepTime: profile.preferredSleepTime!,
    },
  })
  const [firstName, ...lastName] = profile.name.split(' ')
  await zep.user.add({
    userId: userProfile.userId,
    firstName,
    lastName: lastName.join(' '),
    email: user.email,
    metadata: getZepUserMetadata(userProfile),
  })
  await syncCalendarAction(userProfile.userId)
  await inngest.send({
    name: InngestEvent.NewUser,
    data: {
      user: user,
      profile: userProfile,
    },
  });
  return userProfile
}

export async function updateUserProfileAction(original: UserProfile, profile: Partial<UserProfileInput>) {
  const prisma = await getPrismaClient(profile.userId)
  const updated = await prisma.userProfile.update({
    where: { userId: profile.userId },
    data: {
      ...profile,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      preferredWakeUpTime: profile.preferredWakeUpTime!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      preferredSleepTime: profile.preferredSleepTime!,
    },
  })
  if (updated.timezone !== original.timezone) {
    console.log('Timezone changed, syncing calendar')
    const googleAuth = await prisma.googleAuth.findUnique({ where: { userId: profile.userId } })
    if (googleAuth) {
      await fullSyncCalendarAction(updated, googleAuth)
    }
  }
  // TODO: Improve by using a diff of the original and updated profile to check if the metadata has changed,
  // Should imply changes to the rest of this function.
  await zep.user.update(updated.userId, {
    metadata: getZepUserMetadata(updated),
  })
  return updated
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
