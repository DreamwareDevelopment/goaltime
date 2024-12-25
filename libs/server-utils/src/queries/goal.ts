import { Goal, NotificationSettings, Priority, UserProfile } from '@prisma/client'

import { getPrismaClient } from '../lib/prisma/client'

export async function getGoals(profile: UserProfile): Promise<Goal[]> {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.goal.findMany({ where: { userId: profile.userId } })
}

export async function getNotifications(profile: UserProfile): Promise<NotificationSettings[]> {
  const prisma = await getPrismaClient(profile.userId)
  return prisma.notificationSettings.findMany({ where: { userId: profile.userId } })
}

export function sortGoals(a: Goal, b: Goal) {
  if (a.priority === b.priority) {
    // Sort by the number of preferred times, ascending
    // This is so that we are able to schedule more restrictive goals first
    const aPreferredTimes = Array.isArray(a.preferredTimes) ? a.preferredTimes : [];
    const bPreferredTimes = Array.isArray(b.preferredTimes) ? b.preferredTimes : [];
    return aPreferredTimes.length - bPreferredTimes.length;
  }
  if (a.priority === Priority.High) {
    return -1;
  }
  if (b.priority === Priority.High) {
    return 1;
  }
  if (a.priority === Priority.Medium) {
    return -1;
  }
  if (b.priority === Priority.Medium) {
    return 1;
  }
  return 0;
}
