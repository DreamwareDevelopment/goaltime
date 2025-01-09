import { CalendarEvent, CalendarProvider, Goal, User, UserProfile } from "@prisma/client";

import { dayjs } from "@/shared/utils";

import { sortGoals } from './goal';
import { getPrismaClient } from '../lib/prisma/client';
import { Interval } from "../lib/inngest/calendar/scheduling";
import { ExternalEvent, GoalEvent } from "../lib/inngest/agents/scheduling/scheduling";
import { getNextFullSync } from "../lib/inngest";

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

function getNextQuarterHour(date: dayjs.Dayjs): dayjs.Dayjs {
  const now = dayjs(date);
  const minutes = now.minute();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  if (roundedMinutes === 60) {
    return now.hour(now.hour() + 1).minute(0).second(0);
  }
  return now.minute(roundedMinutes).second(0);
}

export async function getSchedulingData(userId: User['id']): Promise<{
  schedule: ExternalEvent<dayjs.Dayjs>[];
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
  const start = getNextQuarterHour(now).toDate();
  const nextFullSync = getNextFullSync(lastFullSync, profile.timezone);
  const end = nextFullSync.add(1, 'hour').toDate();
  const schedule = await prisma.calendarEvent.findMany({
    where: {
      userId,
      goalId: null,
      OR: [
        {
          startTime: {
            gte: start,
            lte: end,
          },
        },
        {
          allDay: {
            gte: start,
            lte: end,
          },
        }
      ]
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
  const events: ExternalEvent<dayjs.Dayjs>[] = schedule.map(({ startTime, endTime, ...rest }) => ({
    id: rest.id,
    title: rest.title,
    subtitle: rest.subtitle ?? undefined,
    description: rest.description ?? undefined,
    location: rest.location ?? undefined,
    allDay: rest.allDay ? dayjs.tz(rest.allDay, profile.timezone) : undefined,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    start: startTime ? dayjs.tz(startTime, profile.timezone) : dayjs.tz(rest.allDay!, profile.timezone).startOf('day'),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    end: endTime ? dayjs.tz(endTime, profile.timezone) : dayjs.tz(rest.allDay!, profile.timezone).endOf('day'),
  }));
  return { schedule: events, profile, goals, interval: { start, end } };
}

export async function deleteGoalEvents(userId: User['id'], interval: Interval<string>): Promise<string[]> {
  const prisma = await getPrismaClient(userId);
  const idsToDelete = await prisma.calendarEvent.findMany({
    where: {
      userId,
      goalId: {
        not: null,
      },
      startTime: {
        gte: dayjs(interval.start).subtract(1, 'hour').utc().toDate(), // This is a hack to ensure that goal events scheduled during the current user session are removed.
        lte: dayjs(interval.end).utc().toDate(),
      },
    },
    select: {
      id: true,
    },
  });

  const ids = idsToDelete.map(({ id }) => id);
  await prisma.calendarEvent.deleteMany({
    where: {
      userId,
      id: { in: ids },
    },
  });

  return ids;
}

export async function getAggregateTimeByGoal(userId: User['id'], startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): Promise<Record<string, number>> {
  const prisma = await getPrismaClient(userId);
  const aggregatedData = await prisma.calendarEvent.groupBy({
    by: ['goalId'],
    _sum: {
      duration: true,
    },
    where: {
      userId,
      goalId: {
        not: null,
      },
      startTime: {
        gte: startDate.toDate(),
        lte: endDate.toDate(),
      },
    },
  });
  const goalAggregates = aggregatedData.reduce((prev, curr) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    prev[curr.goalId!] = curr._sum.duration ?? 0;
    return prev;
  }, {} as Record<string, number>);
  return goalAggregates;
}

export interface GoalSchedulingData {
  title: string;
  description: string | null;
  color: string;
}

export async function saveSchedule(
  userId: User['id'],
  goalMap: Record<string, GoalSchedulingData>,
  timezone: string,
  schedule: Array<GoalEvent<dayjs.Dayjs>>
): Promise<CalendarEvent[]> {
  const prisma = await getPrismaClient(userId);
  const scheduleData = schedule.map(({ goalId, start, end }) => ({
    id: crypto.randomUUID(),
    userId,
    goalId,
    provider: CalendarProvider.goaltime,
    duration: end.diff(start, 'minutes'),
    startTime: start.utc().toDate(),
    endTime: end.utc().toDate(),
    title: goalMap[goalId].title,
    description: goalMap[goalId].description,
    color: goalMap[goalId].color,
    timeZone: timezone,
  }));
  await prisma.calendarEvent.createMany({
    data: scheduleData,
  });
  return scheduleData as CalendarEvent[];
}
