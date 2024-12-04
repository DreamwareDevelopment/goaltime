'use server'

import { UserProfileInput } from '@/shared/zod'
import { getPrismaClient } from '@/server-utils/prisma'

export async function createUserProfileAction(profile: UserProfileInput) {
  const prisma = await getPrismaClient()
  const userProfile = await prisma.userProfile.create({
    data: profile,
  })
  return userProfile
}
