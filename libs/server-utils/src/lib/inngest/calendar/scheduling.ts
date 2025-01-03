import { deleteGoalEvents, getSchedulingData, GoalSchedulingData, saveSchedule } from "../../../queries/calendar";
import { inngest, InngestEvent } from "../client";
import { CalendarEvent, Goal, UserProfile } from "@prisma/client";
import { Logger } from "inngest/middleware/logger";
import { dayjs } from "@/shared/utils";
import { JsonValue } from "inngest/helpers/jsonify";
import { PreferredTimesEnumType } from "@/shared/zod";
import { GoalSchedulingInput, scheduleGoal, ScheduleInputData } from "../agents/scheduling/scheduling";

export interface Interval<T = Date> {
  start: T;
  end: T;
}

interface SchedulingData {
  goals: Goal[];
  interval: Interval;
  profile: UserProfile;
  schedule: CalendarEvent[];
}

interface PreparedSchedulingData {
  interval: Interval<string>;
  data: ScheduleInputData;
  goalMap: Record<string, GoalSchedulingData>;
  timezone: string;
}

export const MIN_BLOCK_SIZE = 10;
export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

const timeToInterval: Record<PreferredTimesEnumType, Interval<string>> = {
  'Early Morning': {
    start: '5:00',
    end: '8:00',
  },
  'Morning': {
    start: '8:00',
    end: '11:00',
  },
  'Midday': {
    start: '11:00',
    end: '14:00',
  },
  'Afternoon': {
    start: '14:00',
    end: '17:00',
  },
  'Evening': {
    start: '17:00',
    end: '20:00',
  },
  'Night': {
    start: '20:00',
    end: '23:00',
  },
}

function parsePreferredTimes(profile: UserProfile, preferredTimes: JsonValue): Interval<string>[] {
  if (!Array.isArray(preferredTimes)) {
    throw new Error('Preferred times must be an array');
  }
  return preferredTimes.map(time => {
    const interval = timeToInterval[time as PreferredTimesEnumType];
    if (time === 'Early Morning') {
      return {
        start: dayjs(profile.preferredWakeUpTime).add(15, 'minutes').format('HH:mm'),
        end: interval.end,
      };
    } else if (time === 'Night') {
      return {
        start: interval.start,
        end: dayjs(profile.preferredSleepTime).subtract(30, 'minutes').format('HH:mm'),
      };
    }
    return {
      start: interval.start,
      end: interval.end,
    };
  });
}

function timeOffset(date: dayjs.Dayjs, offset: dayjs.Dayjs): dayjs.Dayjs {
  return date.set('hours', offset.hour()).set('minutes', offset.minute());
}

function getTimeblocks(start: dayjs.Dayjs, end: dayjs.Dayjs, upcomingEvents: CalendarEvent[]): Interval[] {
  const timeblocks: Interval[] = [];
  let currentTime = start;
  while (currentTime.isBefore(end)) {
    // eslint-disable-next-line no-loop-func
    const nextEvent = upcomingEvents.find(event => {
      if (event.allDay) {
        return false;
      }
      if (event.startTime) {
        const startTime = dayjs(event.startTime);
        const endTime = dayjs(event.endTime);
        return (startTime.isAfter(currentTime) || endTime.isAfter(currentTime)) && startTime.isBefore(end);
      }
      console.warn(`No start time for event: ${JSON.stringify(event, null, 2)}`);
      return false;
    });
    if (nextEvent) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (dayjs(nextEvent.startTime!).diff(currentTime, 'minutes') > MIN_BLOCK_SIZE) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        timeblocks.push({ start: currentTime.toDate(), end: nextEvent.startTime! });
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      currentTime = dayjs(nextEvent.endTime!);
      continue;
    }
    timeblocks.push({ start: currentTime.toDate(), end: end.toDate() });
    currentTime = end;
  }
  return timeblocks;
}

/**
 * Get the free and work intervals for a given timeframe.
 * @param profile - The user profile to get the free and work intervals for.
 * @param timeframe - The timeframe to get the free and work intervals for.
 * @param events - The existing events to get the free and work intervals around.
 * @returns The free and work intervals for the given timeframe.
 */
function getFreeIntervals(logger: Logger, profile: UserProfile, timeframe: Interval, events: CalendarEvent[]): { freeIntervals: Interval[], freeWorkIntervals: Interval[] } {
  // logger.info(`Getting free intervals for ${JSON.stringify(timeframe, null, 2)}`);
  const freeIntervals: Interval[] = [];
  const freeWorkIntervals: Interval[] = [];
  const start = dayjs(timeframe.start);
  const end = dayjs(timeframe.end);
  const daysBetween = end.diff(start, 'days');
  logger.info(`Days between: ${daysBetween}`);
  // TODO: Take holidays into account
  const workdays = Array.isArray(profile.workDays) ? profile.workDays : [];

  for (let i = 0; i <= daysBetween; i++) {
    let currentTime = start.add(i, 'days')
    if (i > 0) {
      // Adjust the current time to the start of the day, otherwise it will be the start of the timeframe for each day
      currentTime = currentTime.subtract(start.hour(), 'hours').subtract(start.minute(), 'minutes');
    }
    let nextDay = currentTime.add(1, 'day');
    if (i === 0) {
      // Adjust the next day to the start of the day, otherwise it will be the start of the timeframe for the second day
      nextDay = nextDay.subtract(start.hour(), 'hours').subtract(start.minute(), 'minutes');
    }
    // logger.info(`Current time: ${currentTime.format(DATE_TIME_FORMAT)}`);
    // logger.info(`Next day: ${nextDay.format(DATE_TIME_FORMAT)}`);
    const upcomingEvents = events.filter(event => dayjs(event.startTime).isAfter(currentTime) && dayjs(event.startTime).isBefore(nextDay));
    const wakeUpTime = timeOffset(currentTime, dayjs(profile.preferredWakeUpTime).add(15, 'minutes')); // Add 15 minutes to the wake up time to account for getting out of bed
    const sleepTime = timeOffset(currentTime, dayjs(profile.preferredSleepTime).subtract(30, 'minutes')); // Subtract 30 minutes from the sleep time to account for getting ready to sleep
    // logger.info(`Wake up time: ${wakeUpTime.format(DATE_TIME_FORMAT)}`);
    // logger.info(`Sleep time: ${sleepTime.format(DATE_TIME_FORMAT)}`);
    let workStart: dayjs.Dayjs | null = null;
    let workEnd: dayjs.Dayjs | null = null;
    if (workdays.includes(currentTime.format('dddd'))) {
      workStart = profile.startsWorkAt ? timeOffset(currentTime, dayjs(profile.startsWorkAt)) : null;
      workEnd = profile.endsWorkAt ? timeOffset(currentTime, dayjs(profile.endsWorkAt)) : null;
    }

    while (currentTime.isBefore(nextDay)) {
      if (currentTime.isBefore(wakeUpTime)) {
        currentTime = wakeUpTime;
        continue;
      }
      if (currentTime.isAfter(sleepTime)) {
        currentTime = nextDay;
        continue;
      }
      // Find blocks before work
      if (workStart && currentTime.isBefore(workStart)) {
        freeIntervals.push(...getTimeblocks(currentTime, workStart, upcomingEvents));
        currentTime = workStart.add(1, 'second');
        continue;
      }
      // Find blocks during work
      if (workStart && workEnd && currentTime.isAfter(workStart) && currentTime.isBefore(workEnd)) {
        freeWorkIntervals.push(...getTimeblocks(currentTime, workEnd, upcomingEvents));
        currentTime = workEnd.add(1, 'second');
        continue;
      }
      // Find blocks after work
      if (workEnd && currentTime.isAfter(workEnd)) {
        freeIntervals.push(...getTimeblocks(currentTime, sleepTime, upcomingEvents));
        currentTime = nextDay;
        continue;
      }
      if (!workStart && !workEnd) {
        freeIntervals.push(...getTimeblocks(currentTime, sleepTime, upcomingEvents));
        currentTime = nextDay;
        continue;
      }
    }
  }
  return { freeIntervals, freeWorkIntervals };
}

/**
 * Get the remaining commitment for a goal for a given period.
 * @param goal - The goal to get the remaining commitment for.
 * @param timeframe - The timeframe to get the remaining commitment for.
 * @returns The remaining commitment for the goal for the given period.
 */
function getRemainingCommitmentForPeriod(goal: Goal, timeframe: Interval): number {
  // This function could also get the completed commitment so far to give some analytics
  // If the user has been on track or if they are having to work more per week to catch up
  const start = dayjs(timeframe.start);
  const end = dayjs(timeframe.end);
  const daysRemainingThisPeriod = end.diff(start, 'days');
  if (goal.commitment) {
    if (goal.completed === 0) {
      // This makes it so we don't rush to complete the commitment if the period is short
      return goal.commitment * daysRemainingThisPeriod / 7;
    }
    // This makes it so the user is on track to complete the commitment if they have completed some of it
    return (goal.commitment - goal.completed);
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const deadline = dayjs(goal.deadline!);
  const daysUntilDeadline = deadline.diff(start, 'days');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const remainingTime = goal.estimate! - goal.completed;
  if (daysUntilDeadline <= 0) {
    return remainingTime;
  }
  return remainingTime * daysRemainingThisPeriod / daysUntilDeadline;
}

export const scheduleGoalEvents = inngest.createFunction(
  {
    id: "schedule-goal-events",
    concurrency: [{
      scope: "fn",
      key: "event.data.userId",
      limit: 1,
    }],
    // debounce: {
    //   key: "event.data.userId",
    //   period: '5m',
    // },
    retries: 3,
  },
  [{
    event: InngestEvent.ScheduleGoalEvents,
  }],
  async ({ step, event, logger }) => {
    logger.info('Scheduling goal events');
    const { userId } = event.data;
    const { data, interval, goalMap, timezone } = await step.run('get-scheduling-data', async () => {
      const schedulingData = await getSchedulingData(userId);
      const { goals, interval, profile, schedule } = schedulingData as unknown as SchedulingData;
      const { freeIntervals, freeWorkIntervals } = getFreeIntervals(logger, profile, interval, schedule);
      // freeIntervals.map(interval => logger.info(`Free interval: ${dayjs.tz(interval.start, profile.timezone).format(DATE_TIME_FORMAT)} - ${dayjs.tz(interval.end, profile.timezone).format(DATE_TIME_FORMAT)}`));
      // freeWorkIntervals.map(interval => logger.info(`Free work interval: ${dayjs.tz(interval.start, profile.timezone).format(DATE_TIME_FORMAT)} - ${dayjs.tz(interval.end, profile.timezone).format(DATE_TIME_FORMAT)}`));
      return {
        interval: {
          start: interval.start.toISOString(),
          end: interval.end.toISOString(),
        },
        data: {
          goals: goals.map(goal => ({
            id: goal.id,
            title: goal.title,
            description: goal.description,
            allowMultiplePerDay: goal.allowMultiplePerDay,
            canDoDuringWork: goal.canDoDuringWork,
            priority: goal.priority,
            preferredTimes: parsePreferredTimes(profile, goal.preferredTimes as JsonValue),
            remainingCommitment: getRemainingCommitmentForPeriod(goal, interval),
            minimumTime: goal.minimumTime,
            maximumTime: goal.maximumTime,
          })),
          freeIntervals: freeIntervals.map(interval => ({
            start: dayjs(interval.start).format(DATE_TIME_FORMAT),
            end: dayjs(interval.end).format(DATE_TIME_FORMAT),
          })),
          freeWorkIntervals: freeWorkIntervals.map(interval => ({
            start: dayjs(interval.start).format(DATE_TIME_FORMAT),
            end: dayjs(interval.end).format(DATE_TIME_FORMAT),
          })),
        },
        goalMap: goals.reduce((prev, curr) => {
          prev[curr.id] = {
            title: curr.title,
            description: curr.description,
            color: curr.color,
          };
          return prev;
        }, {} as Record<string, GoalSchedulingData>),
        timezone: profile.timezone,
      } as PreparedSchedulingData;
    });

    let freeIntervals = data.freeIntervals.map(interval => ({
      start: dayjs(interval.start),
      end: dayjs(interval.end),
    }));
    let freeWorkIntervals = data.freeWorkIntervals.map(interval => ({
      start: dayjs(interval.start),
      end: dayjs(interval.end),
    }));
    const schedule: Array<Interval<dayjs.Dayjs> & { goalId: string }> = [];
    for (const goal of data.goals) {
      logger.info(`Scheduling goal: ${goal.id}`);
      const input: GoalSchedulingInput = {
        goal,
        freeIntervals: freeIntervals.map(interval => ({
          start: interval.start.format(DATE_TIME_FORMAT),
          end: interval.end.format(DATE_TIME_FORMAT),
        })),
        freeWorkIntervals: freeWorkIntervals.map(interval => ({
          start: interval.start.format(DATE_TIME_FORMAT),
          end: interval.end.format(DATE_TIME_FORMAT),
        })),
      }
      const intervals = await step.ai.wrap('schedule-goal', scheduleGoal, input);
      ({ freeIntervals, freeWorkIntervals } = updateIntervals(
        { freeIntervals, freeWorkIntervals },
        intervals.map(interval => ({
          start: dayjs.tz(interval.start, timezone),
          end: dayjs.tz(interval.end, timezone),
        })).sort((a, b) => a.start.diff(b.start))
      ));
      schedule.push(...intervals.map(interval => ({ start: dayjs(interval.start), end: dayjs(interval.end), goalId: goal.id })));
    }

    const { deletedEvents, newEvents } = await step.run('save-schedule', async () => {
      const deletedEvents = await deleteGoalEvents(userId, interval);
      const newEvents = await saveSchedule(userId, goalMap, timezone, schedule);
      return { deletedEvents, newEvents };
    });

    await step.sendEvent('sync-to-client', {
      name: InngestEvent.SyncToClient,
      data: {
        userId,
        calendarEvents: newEvents,
        calendarEventsToDelete: deletedEvents,
      },
    });
  }
)

interface Intervals {
  freeIntervals: Interval<dayjs.Dayjs>[];
  freeWorkIntervals: Interval<dayjs.Dayjs>[];
}
function updateIntervals(intervals: Intervals, schedule: Array<Interval<dayjs.Dayjs>>): Intervals {
  let { freeIntervals, freeWorkIntervals } = { ...intervals };

  for (const scheduledInterval of schedule) {
    freeIntervals = freeIntervals.flatMap(freeInterval => {
      if (freeInterval.start.isAfter(scheduledInterval.end)) {
        // Free interval starts after the scheduled interval ends
        return [freeInterval];
      } else if (freeInterval.end.isBefore(scheduledInterval.start)) {
        // Free interval ends before the scheduled interval starts
        return [freeInterval];
      } else if (freeInterval.start.isSame(scheduledInterval.start, 'minute') && freeInterval.end.isAfter(scheduledInterval.end)) {
        // Free interval starts at the same time as the scheduled interval and ends after it
        return [{ start: scheduledInterval.end, end: freeInterval.end }];
      } else if (freeInterval.end.isSame(scheduledInterval.start, 'minute') && freeInterval.start.isBefore(scheduledInterval.start)) {
        // Free interval ends at the same time as the scheduled interval and starts before it
        return [{ start: freeInterval.start, end: scheduledInterval.start }];
      } else if (freeInterval.start.isBefore(scheduledInterval.start) && freeInterval.end.isAfter(scheduledInterval.end)) {
        // Free interval contains the scheduled interval
        return [
          { start: freeInterval.start, end: scheduledInterval.start },
          { start: scheduledInterval.end, end: freeInterval.end },
        ];
      } else {
        // Free interval is fully covered by the scheduled interval
        return [];
      }
    });

    freeWorkIntervals = freeWorkIntervals.flatMap(freeInterval => {
      if (freeInterval.start.isAfter(scheduledInterval.end)) {
        // Free interval starts after the scheduled interval ends
        return [freeInterval];
      } else if (freeInterval.end.isBefore(scheduledInterval.start)) {
        // Free interval ends before the scheduled interval starts
        return [freeInterval];
      } else if (freeInterval.start.isSame(scheduledInterval.start, 'minute') && freeInterval.end.isAfter(scheduledInterval.end)) {
        // Free interval starts at the same time as the scheduled interval and ends after it
        return [{ start: scheduledInterval.end, end: freeInterval.end }];
      } else if (freeInterval.end.isSame(scheduledInterval.start, 'minute') && freeInterval.start.isBefore(scheduledInterval.start)) {
        // Free interval ends at the same time as the scheduled interval and starts before it
        return [{ start: freeInterval.start, end: scheduledInterval.start }];
      } else if (freeInterval.start.isBefore(scheduledInterval.start) && freeInterval.end.isAfter(scheduledInterval.end)) {
        // Free interval contains the scheduled interval
        return [
          { start: freeInterval.start, end: scheduledInterval.start },
          { start: scheduledInterval.end, end: freeInterval.end },
        ];
      } else {
        // Free interval is fully covered by the scheduled interval
        return [];
      }
    });
  }

  return { freeIntervals, freeWorkIntervals };
}
