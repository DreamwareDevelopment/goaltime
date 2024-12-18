import { Goal, Milestone, NotificationSettings, UserProfile } from '@prisma/client'

import { getPrismaClient } from '../lib/prisma/client'

export async function getGoals(profile: UserProfile): Promise<Goal[]> {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.goal.findMany({ where: { userId: profile.userId } })
}

export async function getMilestones(profile: UserProfile): Promise<Milestone[]> {
  const prisma = await getPrismaClient(profile.userId)
  const result = await prisma.milestone.findMany({ 
    where: { userId: profile.userId },
    orderBy: [
      { completed: 'desc' },
      { updatedAt: 'asc' }
    ]
  })
  return result ?? []
}

export async function getNotifications(profile: UserProfile): Promise<NotificationSettings[]> {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.notificationSettings.findMany({ where: { userId: profile.userId } })
}
