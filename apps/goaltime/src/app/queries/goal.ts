import { Goal, Milestone, NotificationSettings, UserProfile } from '@/shared/models'
import { getPrismaClient } from '@/server-utils/prisma'

export async function getGoals(profile: UserProfile): Promise<Goal[]> {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.goal.findMany({ where: { userId: profile.userId } })
}

export async function getMilestones(profile: UserProfile): Promise<Milestone[]> {
  const prisma = await getPrismaClient(profile.userId)
  const result = await prisma.milestone.findMany({ where: { userId: profile.userId } })
  return result ?? []
}

export async function getNotifications(profile: UserProfile): Promise<NotificationSettings[]> {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.notificationSettings.findMany({ where: { userId: profile.userId } })
}
