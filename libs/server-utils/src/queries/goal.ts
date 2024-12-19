import { Goal, NotificationSettings, UserProfile } from '@prisma/client'

import { getPrismaClient } from '../lib/prisma/client'

export async function getGoals(profile: UserProfile): Promise<Goal[]> {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.goal.findMany({ where: { userId: profile.userId } })
}

export async function getNotifications(profile: UserProfile): Promise<NotificationSettings[]> {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.notificationSettings.findMany({ where: { userId: profile.userId } })
}
