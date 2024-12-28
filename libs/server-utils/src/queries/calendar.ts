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
  interval: Interval;
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
  const now = dayjs.tz(new Date(), profile.timezone);
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

export async function deleteGoalEvents(userId: User['id']) {
  const prisma = await getPrismaClient(userId);
  await prisma.calendarEvent.deleteMany({
    where: {
      userId,
      goalId: {
        not: null,
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
