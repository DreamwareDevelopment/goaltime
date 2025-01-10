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
    // Sort by the goal that has fewer exclusive preferred times
    // This is so that we are able to schedule more restrictive goals first
    const aPreferredTimes = Array.isArray(a.preferredTimes) ? a.preferredTimes : [];
    const bPreferredTimes = Array.isArray(b.preferredTimes) ? b.preferredTimes : [];
    const intersection = aPreferredTimes.filter(time => bPreferredTimes.includes(time));
    const aDiff = aPreferredTimes.length - intersection.length;
    const bDiff = bPreferredTimes.length - intersection.length;
    if (intersection.length > 0) {
      return aDiff - bDiff;
    }
    // Sort by the goal that allows multiple per day
    const aCanDoMultiple = a.allowMultiplePerDay;
    const bCanDoMultiple = b.allowMultiplePerDay;
    const canDoMultipleDiff = aCanDoMultiple && !bCanDoMultiple ? -1 : bCanDoMultiple && !aCanDoMultiple ? 1 : 0;
    if (canDoMultipleDiff !== 0) {
      return canDoMultipleDiff;
    }
    // Sort by the most surgical goal
    const minimumDurationDiff = a.minimumDuration - b.minimumDuration;
    return minimumDurationDiff;
  }
  // Sort by priority
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
