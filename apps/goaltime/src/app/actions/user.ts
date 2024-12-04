'use server'

import { UserProfileInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'

export async function createUserProfileAction(profile: UserProfileInput) {
  const prisma = await getPrismaClient(profile.userId)
  const userProfile = await prisma.userProfile.create({
    data: profile,
  })
  return userProfile
}

export async function updateUserProfileAction(profile: UserProfileInput) {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.userProfile.update({
    where: { userId: profile.userId },
    data: profile,
  })
}
