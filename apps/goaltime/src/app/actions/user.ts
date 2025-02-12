'use server'

import { OptionalRoutine, RoutineActivities, RoutineActivity, RoutineDay, UserProfileInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'
import twilio from 'twilio'
import deepEqual from 'fast-deep-equal'
import { UserProfile } from '@prisma/client'
import { inngestProducer, InngestEvent } from '@/server-utils/inngest'
import { formatUser, zep } from '@/server-utils/ai'

import { fullSyncCalendarAction, syncCalendarAction } from './calendar'
import { SanitizedUser } from '@/shared/utils'

function getRoutineForUpsert(routine: RoutineActivities) {
  for (const activity in routine) {
    if (activity === 'custom') {
      for (const customActivity in routine[activity]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (routine[activity][customActivity] as any).Everyday
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (routine[activity][customActivity] as any).Weekdays
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (routine[activity][customActivity] as any).Weekends
        for (const day in routine[activity][customActivity]) {
          const dayKey = day as RoutineDay
          if (routine[activity][customActivity][dayKey].skip) {
            routine[activity][customActivity][dayKey].start = null
            routine[activity][customActivity][dayKey].end = null
          }
        }
      }
      continue
    }
    const key = activity as RoutineActivity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (routine[key] as any).Everyday
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (routine[key] as any).Weekdays
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (routine[key] as any).Weekends
    for (const day in routine[key]) {
      const dayKey = day as RoutineDay
      const dayRoutine = routine[key][dayKey] as OptionalRoutine
      if (dayRoutine.skip) {
        dayRoutine.start = null
        dayRoutine.end = null
      }
    }
  }
  return routine
}

export async function createUserProfileAction(user: SanitizedUser, profile: UserProfileInput) {
  console.log('createUserProfileAction called')
  if (!user.email) {
    throw new Error('User email is required')
  }
  delete profile.otp
  const prisma = await getPrismaClient()
  const routine = getRoutineForUpsert(profile.routine)
  const userProfile = await prisma.userProfile.create({
    data: {
      ...profile,
      phone: profile.phone.replace(/[^+\d]/g, ''),
      routine,
    },
  })
  const [firstName, ...lastName] = profile.name.split(' ')
  try {
    await zep.user.add({
      userId: userProfile.userId,
      firstName,
      lastName: lastName.join(' '),
      email: user.email,
      metadata: formatUser(userProfile),
    })
  } catch (error) {
    console.error('Error adding user to Zep', error)
  }
  await syncCalendarAction(userProfile.userId)
  await inngestProducer.send({
    name: InngestEvent.NewUser,
    data: {
      user: user,
      profile: userProfile,
    },
  });
  return userProfile
}

function shouldScheduleGoals(original: UserProfile, updated: Partial<UserProfileInput>): boolean {
  if (updated.routine && !deepEqual(original.routine, updated.routine)) {
    return true;
  }
  if (updated.workDays && !deepEqual(original.workDays, updated.workDays)) {
    return true;
  }
  if (updated.timezone && updated.timezone !== original.timezone) {
    return true;
  }
  return false;
}

export async function updateUserProfileAction(original: UserProfile, profile: Partial<UserProfileInput>) {
  const prisma = await getPrismaClient(profile.userId)
  const routine = profile.routine ? getRoutineForUpsert(profile.routine) : undefined
  const updated = await prisma.userProfile.update({
    where: { userId: profile.userId },
    data: {
      ...profile,
      routine,
    },
  })
  if (updated.timezone !== original.timezone) {
    console.log('Timezone changed, syncing calendar')
    const googleAuth = await prisma.googleAuth.findUnique({ where: { userId: profile.userId } })
    if (googleAuth) {
      await fullSyncCalendarAction(updated, googleAuth)
    }
  }
  if (shouldScheduleGoals(original, profile)) {
    await inngestProducer.send({
      name: InngestEvent.ScheduleGoalEvents,
      data: {
        userId: updated.userId,
      },
    })
  }
  await zep.user.update(updated.userId, {
    metadata: formatUser(updated),
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
