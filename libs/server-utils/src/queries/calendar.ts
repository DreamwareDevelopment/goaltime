import { CalendarEvent, Goal, User, UserProfile } from "@prisma/client";

import { dayjs } from "@/shared/utils";

import { sortGoals } from './goal';
import { getPrismaClient } from '../lib/prisma/client';

export async function getSchedule(userId: User['id'], date: dayjs.Dayjs, timezone: string): Promise<CalendarEvent[]> {
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
          },
          endTime: {
            lte: endOfDay,
          },
        },
        {
          allDay: {
            gte: startOfDay,
            lte: endOfDay,
          },
        }
      ],
    },
  });
  return schedule;
}

export async function getSchedulingData(userId: User['id']): Promise<{
  schedule: CalendarEvent[];
  profile: UserProfile;
  goals: Goal[];
  start: Date;
  end: Date;
}> {
  const prisma = await getPrismaClient(userId);
  const profile = await prisma.userProfile.findUnique({
    where: {
      userId,
    },
  })
  if (!profile) {
    throw new Error('Profile not found for scheduling');
  }
  const now = dayjs();
  const start = now.toDate();
  const weekLater = now.add(7, 'day');
  const end = weekLater.toDate();
  const schedule = await prisma.calendarEvent.findMany({
    where: {
      userId,
      goalId: null,
      OR: [
        {
          startTime: {
            gte: start,
          },
          endTime: {
            lte: end,
          },
        },
      ],
    },
  });
  const goals = await prisma.goal.findMany({
    where: {
      userId,
    },
  });
  goals.sort(sortGoals);
  return { schedule, profile, goals, start, end };
}
