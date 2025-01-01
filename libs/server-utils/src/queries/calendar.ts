import { CalendarEvent, CalendarProvider, Goal, User, UserProfile } from "@prisma/client";

import { dayjs } from "@/shared/utils";

import { sortGoals } from './goal';
import { getPrismaClient } from '../lib/prisma/client';
import { Interval } from "../lib/inngest/calendar/scheduling";
import { SchedulingResultsType } from "../lib/inngest/agents/scheduling/scheduling";

export async function getSchedule(userId: User['id'], date: dayjs.Dayjs): Promise<CalendarEvent[]> {
  const startOfDay = date.startOf('day').toDate()
  const endOfDay = date.endOf('day').toDate()
  const prisma = await getPrismaClient(userId);
  const schedule = await prisma.calendarEvent.findMany({
    where: {
      userId,
      OR: [
        {
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
            not: null,
          },
        },
        {
          allDay: {
            gte: startOfDay,
            lte: endOfDay,
            not: null,
          },
        }
      ],
    },
    orderBy: {
      startTime: {
        sort: 'asc',
        nulls: 'first'
      }
    }
  });
  return schedule;
}

export async function getSchedulingData(userId: User['id']): Promise<{
  schedule: CalendarEvent[];
  profile: UserProfile;
  goals: Goal[];
  interval: Interval;
}> {
  const prisma = await getPrismaClient(userId);
  const googleAuthPromise = prisma.googleAuth.findUnique({
    where: {
      userId,
    },
  });
  const profilePromise = prisma.userProfile.findUnique({
    where: {
      userId,
    },
  })
  const [profile, googleAuth] = await Promise.all([profilePromise, googleAuthPromise]);
  if (!profile) {
    throw new Error('Profile not found for scheduling');
  }
  if (!googleAuth?.lastFullSyncAt) {
    throw new Error('Google auth not found for scheduling');
  }
  const lastFullSync = dayjs.tz(googleAuth.lastFullSyncAt, profile.timezone);
  const now = dayjs.tz(new Date(), profile.timezone);
  const start = now.toDate();
  const nextFullSync = lastFullSync.day(7).hour(profile.preferredSleepTime.getHours()).minute(profile.preferredSleepTime.getMinutes());
  const end = nextFullSync.toDate();
  const schedule = await prisma.calendarEvent.findMany({
    where: {
      userId,
      goalId: null,
      startTime: {
        gte: start,
        lte: end,
        not: null,
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });
  const goals = await prisma.goal.findMany({
    where: {
      userId,
    },
  });
  goals.sort(sortGoals);
  return { schedule, profile, goals, interval: { start, end } };
}

export async function deleteGoalEvents(userId: User['id'], interval: Interval<string>) {
  const prisma = await getPrismaClient(userId);
  await prisma.calendarEvent.deleteMany({
    where: {
      userId,
      goalId: {
        not: null,
      },
      startTime: {
        gte: dayjs(interval.start).utc().toDate(),
        lte: dayjs(interval.end).utc().toDate(),
      },
    },
  });
}

export interface GoalSchedulingData {
  title: string;
  description: string | null;
  color: string;
}

export async function saveSchedule(userId: User['id'], goalMap: Record<string, GoalSchedulingData>, timezone: string, schedule: SchedulingResultsType) {
  const prisma = await getPrismaClient(userId);
  await prisma.calendarEvent.createMany({
    data: schedule.map(({ goalId, start, end }) => ({
      id: crypto.randomUUID(),
      userId,
      goalId,
      provider: CalendarProvider.goaltime,
      startTime: dayjs(start).utc().toDate(),
      endTime: dayjs(end).utc().toDate(),
      title: goalMap[goalId].title,
      description: goalMap[goalId].description,
      color: goalMap[goalId].color,
      timeZone: timezone,
    })),
  });
}
