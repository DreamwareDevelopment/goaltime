'use server'

import { UserProfileInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'

export async function createUserProfileAction(userId: string, profile: UserProfileInput) {
  const p = {
    ...profile,
    userId,
  }

  const prisma = await getPrismaClient()
  const userProfile = await prisma.userProfile.create({
    data: {
      ...p,
      leavesHomeAt: p.leavesHomeAt?.toDate(),
      returnsHomeAt: p.returnsHomeAt?.toDate(),
      preferredWakeUpTime: p.preferredWakeUpTime?.toDate(),
      preferredSleepTime: p.preferredSleepTime?.toDate(),
    },
  })
  return userProfile
}
