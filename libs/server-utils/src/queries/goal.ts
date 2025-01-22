import { Goal, NotificationSettings, Priority, UserProfile } from '@prisma/client'

import { getPrismaClient } from '../lib/prisma/client'
import { daysOfTheWeek, PreferredTimesDays } from '@/shared/zod'

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
    const aPreferredTimes = a.preferredTimes as PreferredTimesDays
    const bPreferredTimes = b.preferredTimes as PreferredTimesDays
    let intersectionCount = 0;
    let aDiff = 0;
    let bDiff = 0;
    for (const day of Object.values(daysOfTheWeek.Values)) {
      const aTimes = aPreferredTimes[day]
      const bTimes = bPreferredTimes[day]
      const intersection = aTimes.filter(time => bTimes.includes(time));
      intersectionCount += intersection.length;
      aDiff += (aTimes.length - intersection.length);
      bDiff += (bTimes.length - intersection.length);
    }
    if (intersectionCount > 0) {
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
