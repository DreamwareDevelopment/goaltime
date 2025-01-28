import { CalendarEvent, CalendarProvider, Goal, User, UserProfile } from "@prisma/client";

import { dayjs } from "@/shared/utils";

import { sortGoals } from './goal';
import { getPrismaClient } from '../lib/prisma/client';
import { getNextFullSync } from "../lib/inngest";
import { ExternalEvent, GoalEvent, Interval } from "@/shared/utils";
import { getProfileRoutine, getSleepRoutineForDay } from "@/shared/zod";

export async function getSchedule(profile: UserProfile, date: dayjs.Dayjs): Promise<CalendarEvent[]> {
  const routine = getProfileRoutine(profile);
  const sleepRoutine = getSleepRoutineForDay(routine, date);
  // console.log(`${profile.userId} Sleep Routine: ${dayjs(sleepRoutine.start).format(DATE_TIME_FORMAT)} - ${dayjs(sleepRoutine.end).format(DATE_TIME_FORMAT)}`);
  const prisma = await getPrismaClient(profile.userId);
  const schedule = await prisma.calendarEvent.findMany({
    where: {
      userId: profile.userId,
      OR: [
        {
          startTime: {
            gte: sleepRoutine.end.toDate(),
            lte: sleepRoutine.start.toDate(),
            not: null,
          },
        },
        {
          allDay: {
            gte: sleepRoutine.end.toDate(),
            lte: sleepRoutine.start.toDate(),
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
  schedule: ExternalEvent<dayjs.Dayjs>[];
  profile: UserProfile;
  goals: Goal[];
  interval: Interval;
  fullSyncTimeframe: Interval<dayjs.Dayjs>;
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
  const sensibleMinutes = Math.floor(now.minute() / 5) * 5;
  const start = now.hour(now.hour() + 1).minute(sensibleMinutes).second(0).toDate(); // Give an hour buffer before the next possible scheduling event
  const nextFullSync = getNextFullSync(lastFullSync, profile.timezone);
  const fullSyncTimeframe = {
    start: lastFullSync,
    end: nextFullSync,
  };
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
  return { schedule: events, profile, goals, interval: { start, end }, fullSyncTimeframe };
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
    startTime: start.toDate(),
    endTime: end.toDate(),
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
