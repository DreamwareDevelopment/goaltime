import { JsonValue } from "inngest/helpers/jsonify";
import { Logger } from "inngest/middleware/logger";

import { Goal, UserProfile } from "@prisma/client";
import { dayjs, ExternalEvent, GoalEvent, Interval, IntervalWithScore, TypedIntervalWithScore, WakeUpOrSleepEvent } from "@/shared/utils";
import { MinimalScheduleableGoal, PreferredTimesEnumType, ScheduleableGoal, ScheduleInputData } from "@/shared/zod";

import { deleteGoalEvents, getSchedulingData, GoalSchedulingData, saveSchedule } from "../../../queries/calendar";
import { getGoalScoringInstructions, scoreIntervals } from "../../ai/scheduling";
import { inngest, InngestEvent } from "../client";

interface PreparedSchedulingData {
  interval: Interval<string>;
  externalEvents: ExternalEvent<string>[];
  data: ScheduleInputData;
  goalMap: Record<string, GoalSchedulingData>;
  timezone: string;
}

export const MIN_BLOCK_SIZE = 10;
export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

const getTimeToIntervalLookup = (start: dayjs.Dayjs): Record<PreferredTimesEnumType, Interval<dayjs.Dayjs>> => {
  const five = start.hour(5).minute(0);
  const eight = start.hour(8).minute(0);
  const eleven = start.hour(11).minute(0);
  const fourteen = start.hour(14).minute(0);
  const seventeen = start.hour(17).minute(0);
  const twenty = start.hour(20).minute(0);
  const twentyThree = start.hour(23).minute(0);
  return {
    'Early Morning': {
      start: five,
      end: eight,
    },
    'Morning': {
      start: eight,
      end: eleven,
    },
    'Midday': {
      start: eleven,
      end: fourteen,
    },
    'Afternoon': {
      start: fourteen,
      end: seventeen,
    },
    'Evening': {
      start: seventeen,
      end: twenty,
    },
    'Night': {
      start: twenty,
      end: twentyThree,
    },
  };
}

// Get the preferred times for a goal in the format of HH:mm-HH:mm, merging time blocks and adhering to the preferred wake up and sleep times
function parsePreferredTimes(logger: Logger, profile: UserProfile, start: dayjs.Dayjs, preferredTimes: JsonValue): Interval<dayjs.Dayjs>[] {
  if (!Array.isArray(preferredTimes)) {
    throw new Error('Preferred times must be an array');
  }
  const preferredWakeUpTime = dayjs(profile.preferredWakeUpTime);
  const preferredSleepTime = dayjs(profile.preferredSleepTime);
  // logger.info(`Preferred times: ${JSON.stringify(preferredTimes, null, 2)}`);
  const timeToIntervalLookup = getTimeToIntervalLookup(start);
  const adjustedPreferredTimes = preferredTimes.map(time => {
    const interval = timeToIntervalLookup[time as PreferredTimesEnumType];
    if (preferredWakeUpTime.isAfter(interval.start) && preferredWakeUpTime.isBefore(interval.end)) {
      return {
        start: preferredWakeUpTime,
        end: interval.end,
      };
    }
    if (preferredSleepTime.isAfter(interval.start) && preferredSleepTime.isBefore(interval.end)) {
      return {
        start: interval.start,
        end: preferredSleepTime,
      };
    }
    return {
      start: interval.start,
      end: interval.end,
    };
  })
  // for (const time of adjustedPreferredTimes) {
  //   logger.info(`Adjusted preferred time: ${time.start.format(DATE_TIME_FORMAT)} - ${time.end.format(DATE_TIME_FORMAT)}`);
  // }
  const sortedPreferredTimes = adjustedPreferredTimes.sort((a, b) => a.start.diff(b.start, 'minutes'))
  const mergedPreferredTimes = sortedPreferredTimes.reduce((prev, curr) => {
    if (!prev.length) {
      prev.push(curr);
    } else {
      const last = prev[prev.length - 1];
      if (last.end.isSame(curr.start, 'minute')) {
        prev[prev.length - 1] = {
          start: last.start,
          end: curr.end,
        };
      } else {
        prev.push(curr);
      }
    }
    return prev;
  }, [] as Interval<dayjs.Dayjs>[]);
  // for (const time of mergedPreferredTimes) {
  //   logger.info(`Merged preferred time: ${time.start.format(DATE_TIME_FORMAT)} - ${time.end.format(DATE_TIME_FORMAT)}`);
  // }
  return mergedPreferredTimes;
}

function getTimeblocks(start: dayjs.Dayjs, end: dayjs.Dayjs, upcomingEvents: ExternalEvent<dayjs.Dayjs>[]): Interval[] {
  const timeblocks: Interval[] = [];
  let currentTime = start;
  while (currentTime.isBefore(end)) {
    // eslint-disable-next-line no-loop-func
    const nextEvent = upcomingEvents.find(event => {
      if (event.allDay) {
        throw new Error('Invariant: All day events should not be in the upcoming events');
      }
      return (event.start.isAfter(currentTime) || event.end.isAfter(currentTime)) && event.start.isBefore(end);
    });
    if (nextEvent) {
      if (nextEvent.start.diff(currentTime, 'minutes') > MIN_BLOCK_SIZE) {
        timeblocks.push({ start: currentTime.toDate(), end: nextEvent.start.toDate() });
      }
      currentTime = nextEvent.end;
      continue;
    }
    if (end.diff(currentTime, 'minutes') > MIN_BLOCK_SIZE) {
      timeblocks.push({ start: currentTime.toDate(), end: end.toDate() });
    }
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
function getFreeIntervals(
  logger: Logger,
  profile: UserProfile,
  timeframe: Interval,
  events: ExternalEvent<dayjs.Dayjs>[],
): {
  freeIntervals: Interval[],
  freeWorkIntervals: Interval[],
  wakeUpOrSleepEvents: WakeUpOrSleepEvent<string>[],
} {
  logger.info(`Getting free intervals for ${dayjs(timeframe.start).format(DATE_TIME_FORMAT)} - ${dayjs(timeframe.end).format(DATE_TIME_FORMAT)}`);
  const wakeUpOrSleepEvents: WakeUpOrSleepEvent<string>[] = [];
  const freeIntervals: Interval[] = [];
  const freeWorkIntervals: Interval[] = [];
  const start = dayjs(timeframe.start);
  const end = dayjs(timeframe.end);
  const daysBetween = end.diff(start, 'days');
  logger.info(`Days between: ${daysBetween}`);
  // TODO: Take holidays into account
  const workdays = Array.isArray(profile.workDays) ? profile.workDays : [];

  for (let i = 0; i <= daysBetween + 1; i++) {
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

    const isLastDay = daysBetween + 1 === i;
    const upcomingEvents = events.filter(event => !event.allDay && event.start.isAfter(currentTime) && event.start.isBefore(nextDay));
    const preferredWakeUpTime = dayjs(profile.preferredWakeUpTime);
    const wakeUpTime = currentTime
      .hour(preferredWakeUpTime.hour())
      .minute(preferredWakeUpTime.minute())
    // This makes sure we don't schedule past the next full sync
    const preferredSleepTime = isLastDay ? dayjs(timeframe.end) : dayjs(profile.preferredSleepTime);
    const sleepHour = preferredSleepTime.hour();
    const sleepTime = currentTime
      .hour(sleepHour === 0 ? 24 : sleepHour)
      .minute(preferredSleepTime.minute())
    wakeUpOrSleepEvents.push({
      type: 'wakeUp',
      start: wakeUpTime.format(DATE_TIME_FORMAT),
    });
    if (!isLastDay) {
      wakeUpOrSleepEvents.push({
        type: 'sleep',
        start: sleepTime.format(DATE_TIME_FORMAT),
      });
    }
    // logger.info(`Wake up time: ${wakeUpTime.format(DATE_TIME_FORMAT)}`);
    // logger.info(`Sleep time: ${sleepTime.format(DATE_TIME_FORMAT)}`);
    let workStart: dayjs.Dayjs | null = null;
    let workEnd: dayjs.Dayjs | null = null;
    if (workdays.includes(currentTime.format('dddd'))) {
      const startsWorkAt = dayjs(profile.startsWorkAt);
      workStart = currentTime
        .hour(startsWorkAt.hour())
        .minute(startsWorkAt.minute());
      const endsWorkAt = dayjs(profile.endsWorkAt);
      workEnd = currentTime
        .hour(endsWorkAt.hour())
        .minute(endsWorkAt.minute());
    }

    while (currentTime.isBefore(nextDay)) {
      // logger.info(`Current time: ${currentTime.format(DATE_TIME_FORMAT)}`);
      // logger.info(`Wake up time: ${wakeUpTime.format(DATE_TIME_FORMAT)}`);
      // logger.info(`Sleep time: ${sleepTime.format(DATE_TIME_FORMAT)}`);
      // logger.info(`Work start: ${workStart?.format(DATE_TIME_FORMAT)}`);
      // logger.info(`Work end: ${workEnd?.format(DATE_TIME_FORMAT)}`);
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
        const intervals = getTimeblocks(currentTime, workStart, upcomingEvents);
        freeIntervals.push(...intervals);
        logger.info(`Found ${intervals.length} free intervals before work on ${currentTime.format('YYYY-MM-DD')}`);
        currentTime = workStart.add(1, 'minute').second(0).subtract(1, 'second');
        continue;
      }
      // Find blocks during work
      if (workStart && workEnd && currentTime.isAfter(workStart.subtract(1, 'minute')) && currentTime.isBefore(workEnd)) {
        const intervals = getTimeblocks(currentTime, workEnd, upcomingEvents);
        freeWorkIntervals.push(...intervals);
        logger.info(`Found ${intervals.length} free work intervals during work on ${currentTime.format('YYYY-MM-DD')}`);
        currentTime = workEnd.add(1, 'minute').second(0).subtract(1, 'second');
        continue;
      }
      // Find blocks after work
      if (workEnd && currentTime.isAfter(workEnd.subtract(1, 'minute'))) {
        const intervals = getTimeblocks(currentTime, sleepTime, upcomingEvents);
        freeIntervals.push(...intervals);
        logger.info(`Found ${intervals.length} free intervals after work on ${currentTime.format('YYYY-MM-DD')}`);
        currentTime = nextDay;
        continue;
      }
      if (!workStart && !workEnd) {
        const intervals = getTimeblocks(currentTime, sleepTime, upcomingEvents);
        freeIntervals.push(...intervals);
        logger.info(`Found ${intervals.length} free intervals on day off on ${currentTime.format('YYYY-MM-DD')}`);
        currentTime = nextDay;
        continue;
      }
      logger.error('Finished loop without finding any free intervals');
    }
  }
  return { freeIntervals, freeWorkIntervals, wakeUpOrSleepEvents };
}

function getIntersection<T extends Interval<dayjs.Dayjs>>(logger: Logger, a: Interval<dayjs.Dayjs>, b: T): T | null {
  // logger.info(`Getting intersection of ${a.start.format(DATE_TIME_FORMAT)} - ${a.end.format(DATE_TIME_FORMAT)} and ${b.start.format(DATE_TIME_FORMAT)} - ${b.end.format(DATE_TIME_FORMAT)}`);
  const start = a.start.isAfter(b.start) ? a.start : b.start;
  const end = a.end.isBefore(b.end) ? a.end : b.end;
  if (start.isBefore(end) && !start.isSame(end, 'minute')) {
    // logger.info(`Found intersection of ${start.format(DATE_TIME_FORMAT)} - ${end.format(DATE_TIME_FORMAT)}`);
    return { ...b, start, end };
  }
  // logger.info(`No intersection found`);
  return null;
}

export function getPreferredTimes<T extends Interval<dayjs.Dayjs>>(
  logger: Logger,
  canDoDuringWork: boolean,
  preferredTimes: Interval<dayjs.Dayjs>[],
  freeIntervals: T[],
  freeWorkIntervals: T[],
  timeframe: Interval<dayjs.Dayjs>,
): {
  freeIntervals: T[],
  freeWorkIntervals: T[],
} {
  const result: {
    freeIntervals: T[],
    freeWorkIntervals: T[],
  } = {
    freeIntervals: [],
    freeWorkIntervals: [],
  };
  iterateOverPreferredTimes(logger, canDoDuringWork, preferredTimes, freeIntervals, freeWorkIntervals, timeframe, (intersection, duringWork) => {
    if (duringWork) {
      result.freeWorkIntervals.push(intersection);
    } else {
      result.freeIntervals.push(intersection);
    }
  });
  return result;
}

export function iterateOverPreferredTimes<T extends Interval<dayjs.Dayjs>>(
  logger: Logger,
  canDoDuringWork: boolean,
  preferredTimes: Interval<dayjs.Dayjs>[],
  freeIntervals: T[] | null,
  freeWorkIntervals: T[] | null,
  timeframe: Interval<dayjs.Dayjs>,
  callback: (intersection: T, duringWork: boolean) => void,
): void {
  function getPreferredTimesForDay(day: dayjs.Dayjs): Interval<dayjs.Dayjs>[] {
    return preferredTimes.map(time => ({
      start: time.start.year(day.year()).month(day.month()).date(day.date()),
      end: time.end.year(day.year()).month(day.month()).date(day.date()),
    }));
  }
  if (!freeIntervals || !freeWorkIntervals) {
    if (freeIntervals || freeWorkIntervals) {
      throw new Error('Invariant: freeIntervals or freeWorkIntervals is null during iteration over preferred times');
    }
    let currentDay = timeframe.start;
    while (currentDay.isBefore(timeframe.end) || currentDay.isSame(timeframe.end, 'day')) {
      const preferredTimesToday = getPreferredTimesForDay(currentDay);
      preferredTimesToday.forEach(preferredTime => callback(preferredTime as T, false));
      currentDay = currentDay.add(1, 'day');
    }
    return;
  }
  let preferredTimesToday: Interval<dayjs.Dayjs>[] = getPreferredTimesForDay(timeframe.start);
  let currentDay = timeframe.start.date();
  if (canDoDuringWork) {
    // logger.info(`Free work intervals:\n${freeWorkIntervals.map(interval => `${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)}`).join('\n')}`);
    for (const interval of freeWorkIntervals) {
      if (interval.start.date() !== currentDay) {
        preferredTimesToday = getPreferredTimesForDay(interval.start);
        currentDay = interval.start.date();
      }
      const preferredTimesIntersections = preferredTimesToday.map(preferredTime => getIntersection(logger, preferredTime, interval)).filter(Boolean) as T[];
      if (preferredTimesIntersections.length > 0) {
        preferredTimesIntersections.forEach(intersection => callback(intersection, true));
      }
    }
  }
  // logger.info(`Free intervals:\n${freeIntervals.map(interval => `${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)}`).join('\n')}`);
  for (const interval of freeIntervals) {
    if (interval.start.date() !== currentDay) {
      preferredTimesToday = getPreferredTimesForDay(interval.start);
      currentDay = interval.start.date();
    }
    const preferredTimesIntersections = preferredTimesToday.map(preferredTime => getIntersection(logger, preferredTime, interval)).filter(Boolean) as T[];
    if (preferredTimesIntersections.length > 0) {
      preferredTimesIntersections.forEach(intersection => callback(intersection, false));
    }
  }
}

/**
 * Get the remaining commitment for a goal for a given period, this does not take into account the amount completed.
 * @param goal - The goal to get the remaining commitment for.
 * @param timeframe - The timeframe to get the remaining commitment for.
 * @returns The remaining commitment for the goal for the given period.
 */
function getRemainingCommitmentForPeriod(
  logger: Logger,
  goal: Goal,
  preferredTimes: Interval<dayjs.Dayjs>[],
  freeIntervals: Interval<dayjs.Dayjs>[],
  freeWorkIntervals: Interval<dayjs.Dayjs>[],
  timeframe: Interval<dayjs.Dayjs>,
  fullSyncTimeframe: Interval<dayjs.Dayjs>,
): number {
  const priorityRestFactor = goal.priority === 'High' ? 1 : goal.priority === 'Medium' ? 0.985 : 0.95;
  let remainingMinutesThisPeriod = 0;
  iterateOverPreferredTimes(logger, goal.canDoDuringWork, preferredTimes, freeIntervals, freeWorkIntervals, timeframe, (intersection, duringWork) => {
    if (duringWork && goal.canDoDuringWork) {
      remainingMinutesThisPeriod += intersection.end.diff(intersection.start, 'minutes');
    } else if (!duringWork) {
      remainingMinutesThisPeriod += intersection.end.diff(intersection.start, 'minutes');
    }
  });
  const getScalingFactor = (timeframe: Interval<dayjs.Dayjs>) => {
    const daysBetween = timeframe.end.diff(timeframe.start, 'days') + 1;
    const scalingFactor = Math.pow(0.95, daysBetween); // The more days between, the higher likelihood that we are accounting for non-free intervals
    logger.info(`Scaling factor for ${timeframe.start.format(DATE_TIME_FORMAT)} - ${timeframe.end.format(DATE_TIME_FORMAT)}: ${scalingFactor}`);
    return scalingFactor;
  }
  if (goal.commitment) {
    const amountToComplete = (goal.commitment - goal.completed) * 60;
    logger.info(`Amount to complete: ${amountToComplete}`);
    if (!goal.allowMultiplePerDay) {
      const daysBetween = timeframe.end.diff(timeframe.start, 'days') + 1;
      const maxDuration = daysBetween * goal.maximumDuration;
      return Math.min(Math.floor(maxDuration / 5) * 5, amountToComplete) / 60;
    }
    const periodScalingFactor = getScalingFactor(fullSyncTimeframe);
    let totalMinutesThisPeriod = 0;
    iterateOverPreferredTimes(logger, goal.canDoDuringWork, preferredTimes, null, null, fullSyncTimeframe, (intersection, duringWork) => {
      if (duringWork && goal.canDoDuringWork) {
        totalMinutesThisPeriod += intersection.end.diff(intersection.start, 'minutes');
      } else if (!duringWork) {
        totalMinutesThisPeriod += intersection.end.diff(intersection.start, 'minutes');
      }
    });
    logger.info(`Remaining minutes this period: ${remainingMinutesThisPeriod}`);
    logger.info(`Total minutes this period: ${totalMinutesThisPeriod * periodScalingFactor}`);
    const adjustmentFactor = Math.min(1, remainingMinutesThisPeriod / totalMinutesThisPeriod * periodScalingFactor);
    logger.info(`Adjustment factor: ${adjustmentFactor}`);
    const minutesToComplete = Math.ceil(adjustmentFactor * priorityRestFactor * amountToComplete / 5) * 5;
    logger.info(`Minutes to complete: ${minutesToComplete}`);
    return Math.max(goal.minimumDuration, minutesToComplete) / 60;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const amountToComplete = (goal.estimate! - goal.completed) * 60;
  if (!goal.allowMultiplePerDay) {
    const daysBetween = timeframe.end.diff(timeframe.start, 'days') + 1;
    const maxDuration = daysBetween * goal.maximumDuration;
    return Math.min(Math.floor(maxDuration / 5) * 5, amountToComplete) / 60;
  }
  const start = dayjs(goal.createdAt);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const end = dayjs(goal.deadline!)
  let minutesSoFar = 0;
  iterateOverPreferredTimes(logger, goal.canDoDuringWork, preferredTimes, freeIntervals, freeWorkIntervals, { start, end: timeframe.start }, (intersection, duringWork) => {
    if (duringWork && goal.canDoDuringWork) {
      minutesSoFar += intersection.end.diff(intersection.start, 'minutes');
    } else if (!duringWork) {
      minutesSoFar += intersection.end.diff(intersection.start, 'minutes');
    }
  });
  let totalMinutes = 0;
  iterateOverPreferredTimes(logger, goal.canDoDuringWork, preferredTimes, freeIntervals, freeWorkIntervals, { start, end }, (intersection, duringWork) => {
    if (duringWork && goal.canDoDuringWork) {
      totalMinutes += intersection.end.diff(intersection.start, 'minutes');
    } else if (!duringWork) {
      totalMinutes += intersection.end.diff(intersection.start, 'minutes');
    }
  });
  const previousPeriodScalingFactor = getScalingFactor({ start, end: timeframe.start });
  const totalScalingFactor = getScalingFactor({ start, end });
  const remainingMinutes = totalMinutes * totalScalingFactor - minutesSoFar * previousPeriodScalingFactor;
  const adjustmentFactor = Math.min(1, remainingMinutesThisPeriod / remainingMinutes);
  const minutesToComplete = Math.floor(adjustmentFactor * priorityRestFactor * amountToComplete / 5) * 5;
  return Math.max(goal.minimumDuration, Math.min(minutesToComplete, remainingMinutes)) / 60;
}

/**
 * Get the remaining commitment for a goal for a given period, this tries to catch up on the goal if running behind.
 * @param goal - The goal to get the remaining commitment for.
 * @param timeframe - The timeframe to get the remaining commitment for.
 * @returns The remaining commitment for the goal for the given period.
 */
export function getRemainingCommitmentForCatchup(
  logger: Logger,
  goal: Goal,
  preferredTimes: Interval<dayjs.Dayjs>[],
  freeIntervals: Interval<dayjs.Dayjs>[],
  freeWorkIntervals: Interval<dayjs.Dayjs>[],
  timeframe: Interval<dayjs.Dayjs>,
): number {
  if (!goal.allowMultiplePerDay) {
    const daysBetween = timeframe.end.diff(timeframe.start, 'days');
    const maxDuration = daysBetween * goal.maximumDuration;
    return Math.floor(maxDuration / 5) * 5 / 60;
  }
  let totalMinutes = 0;
  iterateOverPreferredTimes(logger, goal.canDoDuringWork, preferredTimes, freeIntervals, freeWorkIntervals, timeframe, (intersection, duringWork) => {
    totalMinutes += intersection.end.diff(intersection.start, 'minutes');
  });
  const priorityRestFactor = goal.priority === 'High' ? 1 : goal.priority === 'Medium' ? 0.85 : 0.75;
  const adjustedMinutesRemaining = totalMinutes * priorityRestFactor;
  if (goal.commitment) {
    if ((goal.commitment - goal.completed) * 60 > adjustedMinutesRemaining) {
      // If there isn't enough time to complete the commitment, we return how much time there is available
      logger.info(`Adjusted remaining commitment for ${goal.title}: ${adjustedMinutesRemaining / 60}`);
      return adjustedMinutesRemaining / 60;
    }
    // Return how much time is left to complete the commitment
    const remaining = goal.commitment - goal.completed;
    logger.info(`Remaining commitment for ${goal.title}: ${remaining}`);
    return remaining;
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return Math.min((goal.estimate! - goal.completed) * 60, adjustedMinutesRemaining) / 60;
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
    const { data, interval, goalMap, externalEvents, timezone } = await step.run('get-scheduling-data', async () => {
      const { goals, interval, profile, schedule, fullSyncTimeframe } = await getSchedulingData(userId);
      const { freeIntervals, freeWorkIntervals, wakeUpOrSleepEvents } = getFreeIntervals(logger, profile, interval, schedule);
      logger.info(`Found ${freeIntervals.length} free intervals and ${freeWorkIntervals.length} free work intervals and ${wakeUpOrSleepEvents.length} wake up or sleep events`);
      // freeIntervals.map(interval => logger.info(`Free interval: ${dayjs.tz(interval.start, profile.timezone).format(DATE_TIME_FORMAT)} - ${dayjs.tz(interval.end, profile.timezone).format(DATE_TIME_FORMAT)}`));
      // freeWorkIntervals.map(interval => logger.info(`Free work interval: ${dayjs.tz(interval.start, profile.timezone).format(DATE_TIME_FORMAT)} - ${dayjs.tz(interval.end, profile.timezone).format(DATE_TIME_FORMAT)}`));
      const dayJsFreeIntervals = freeIntervals.map(interval => ({
        ...interval,
        start: dayjs(interval.start),
        end: dayjs(interval.end),
      }));
      const dayJsFreeWorkIntervals = freeWorkIntervals.map(interval => ({
        ...interval,
        start: dayjs(interval.start),
        end: dayjs(interval.end),
      }));
      const timeframe = {
        start: dayjs(interval.start),
        end: dayjs(interval.end),
      };
      return {
        interval: {
          start: timeframe.start.format(DATE_TIME_FORMAT),
          end: timeframe.end.format(DATE_TIME_FORMAT),
        },
        externalEvents: schedule.map(event => ({
          ...event,
          start: event.start.format(DATE_TIME_FORMAT),
          end: event.end.format(DATE_TIME_FORMAT),
          allDay: event.allDay ? event.allDay.format(DATE_TIME_FORMAT) : undefined,
        })),
        data: {
          wakeUpOrSleepEvents,
          goals: goals.map(goal => 
            {
              const preferredTimes = parsePreferredTimes(logger, profile, timeframe.start, goal.preferredTimes as JsonValue);
              return {
                id: goal.id,
                title: goal.title,
                description: goal.description,
                allowMultiplePerDay: goal.allowMultiplePerDay,
                canDoDuringWork: goal.canDoDuringWork,
                priority: goal.priority,
                preferredTimes: preferredTimes.map(time => ({
                  start: time.start.format(DATE_TIME_FORMAT),
                  end: time.end.format(DATE_TIME_FORMAT),
                })),
                remainingCommitment: getRemainingCommitmentForPeriod(
                  logger,
                  goal,
                  preferredTimes,
                  dayJsFreeIntervals,
                  dayJsFreeWorkIntervals,
                  timeframe,
                  fullSyncTimeframe,
                ),
                minimumDuration: goal.minimumDuration,
                maximumDuration: goal.maximumDuration,
            }
          }),
          freeIntervals: dayJsFreeIntervals.map(interval => ({
            start: interval.start.format(DATE_TIME_FORMAT),
            end: interval.end.format(DATE_TIME_FORMAT),
          })),
          freeWorkIntervals: dayJsFreeWorkIntervals.map(interval => ({
            start: interval.start.format(DATE_TIME_FORMAT),
            end: interval.end.format(DATE_TIME_FORMAT),
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

    let freeIntervals: TypedIntervalWithScore<dayjs.Dayjs>[] = data.freeIntervals.map(interval => ({
      start: dayjs(interval.start),
      end: dayjs(interval.end),
      type: 'free',
      score: 0,
    }));
    let freeWorkIntervals: TypedIntervalWithScore<dayjs.Dayjs>[] = data.freeWorkIntervals.map(interval => ({
      start: dayjs(interval.start),
      end: dayjs(interval.end),
      type: 'work',
      score: 0,
    }));
    const timeframe: Interval<dayjs.Dayjs> = {
      start: dayjs(interval.start),
      end: dayjs(interval.end),
    };
    const schedule: Array<GoalEvent<dayjs.Dayjs>> = [];
    logger.info(`Scheduling ${data.goals.length} goals...`, data.goals.map(goal => goal.title));
    const goalsScheduledSoFar: string[] = [];
    for (const goal of data.goals) {
      const minimalGoal: MinimalScheduleableGoal = {
        title: goal.title,
        description: goal.description,
        allowMultiplePerDay: goal.allowMultiplePerDay,
        canDoDuringWork: goal.canDoDuringWork,
        minimumDuration: goal.minimumDuration,
        maximumDuration: goal.maximumDuration,
      }
      const instructions = await step.ai.wrap(`get-${goal.id}-scoring-instructions`, getGoalScoringInstructions, minimalGoal, goalsScheduledSoFar, externalEvents);
      logger.info(`${instructions}`);

      const preferredTimes: Interval<dayjs.Dayjs>[] = goal.preferredTimes.map(time => ({
        start: dayjs(time.start),
        end: dayjs(time.end),
      }));
      const { freeIntervals: preferredFreeIntervals, freeWorkIntervals: preferredFreeWorkIntervals } = getPreferredTimes(logger, goal.canDoDuringWork, preferredTimes, freeIntervals, freeWorkIntervals, timeframe);
      const preferredFreeIntervalsString = preferredFreeIntervals.map(interval => `${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)}`).join('\n');
      logger.info(`${preferredFreeIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of preferred free intervals\n${preferredFreeIntervalsString}`);
      const preferredFreeWorkIntervalsString = preferredFreeWorkIntervals.map(interval => `${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)}`).join('\n');
      logger.info(`${preferredFreeWorkIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of preferred free work intervals\n${preferredFreeWorkIntervalsString}`);

      logger.info(`Scoring intervals for "${goal.title}"...`);
      const { scoredFreeWorkIntervals, scoredFreeIntervals } = await step.ai.wrap(
        `score-${goal.id}-intervals`,
        scoreIntervals,
        logger,
        instructions,
        minimalGoal,
        preferredFreeIntervals,
        preferredFreeWorkIntervals,
        data.wakeUpOrSleepEvents,
        externalEvents,
        schedule,
      );

      logger.info(`Scheduling "${goal.title} with ${goal.remainingCommitment * 60} minutes of remaining commitment`);

      const sortIntervals = (a: IntervalWithScore<dayjs.Dayjs>, b: IntervalWithScore<dayjs.Dayjs>) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        return a.start.diff(b.start)
      }

      const filteredFreeIntervals = scoredFreeIntervals.map(interval => ({
        ...interval.interval,
        start: dayjs(interval.interval.start),
        end: dayjs(interval.interval.end),
      }))
      .filter(interval => interval.score >= 0 && interval.end.diff(interval.start, 'minutes') >= goal.minimumDuration)
      const splitFreeIntervals = splitIntervals(logger, goal, filteredFreeIntervals);
      const sortedFreeIntervals = splitFreeIntervals.sort(sortIntervals);

      const filteredFreeWorkIntervals = scoredFreeWorkIntervals.map(interval => ({
        ...interval.interval,
        start: dayjs(interval.interval.start),
        end: dayjs(interval.interval.end),
      }))
      .filter(interval => interval.score >= 0 && interval.end.diff(interval.start, 'minutes') >= goal.minimumDuration)
      const splitFreeWorkIntervals = splitIntervals(logger, goal, filteredFreeWorkIntervals);
      const sortedFreeWorkIntervals = splitFreeWorkIntervals.sort(sortIntervals);

      logger.info(`${sortedFreeIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of allowed free intervals:\n${sortedFreeIntervals.map(interval => `${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)}`).join('\n')}`);
      logger.info(`${sortedFreeWorkIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of allowed free work intervals:\n${sortedFreeWorkIntervals.map(interval => `${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)}`).join('\n')}`);

      const intervals = scheduleGoal(
        logger,
        goal,
        sortedFreeIntervals,
        sortedFreeWorkIntervals,
      );
      ({ freeIntervals, freeWorkIntervals } = updateIntervals({ freeIntervals, freeWorkIntervals }, intervals));

      logger.info(`Scheduled ${intervals.reduce((acc, curr) => acc + dayjs(curr.end).diff(curr.start, 'minutes'), 0)} minutes of intervals for ${goal.title}`);
      logger.info(`${freeIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of free intervals after scheduling ${goal.title}`);
      logger.info(`${freeWorkIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of free work intervals after scheduling ${goal.title}`);

      schedule.push(...intervals.map(interval => ({
        start: interval.start,
        end: interval.end,
        goalId: goal.id,
        title: goal.title,
      })));
      goalsScheduledSoFar.push(goal.title);
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
    await step.sendEvent('schedule-updated', {
      name: InngestEvent.ScheduleUpdated,
      data: {
        userId,
        schedule: newEvents,
      },
    });
  }
)

interface Intervals {
  freeIntervals: TypedIntervalWithScore<dayjs.Dayjs>[];
  freeWorkIntervals: TypedIntervalWithScore<dayjs.Dayjs>[];
}
function updateIntervals(intervals: Intervals, schedule: Array<GoalEvent<dayjs.Dayjs>>): Intervals {
  let { freeIntervals, freeWorkIntervals } = { ...intervals };

  for (const scheduledInterval of schedule) {
    freeIntervals = freeIntervals.flatMap(freeInterval => {
      if (freeInterval.start.isAfter(scheduledInterval.end)) {
        // Free interval starts after the scheduled interval ends
        return [{ ...freeInterval, score: 0 }];
      } else if (freeInterval.end.isBefore(scheduledInterval.start)) {
        // Free interval ends before the scheduled interval starts
        return [{ ...freeInterval, type: 'free', score: 0 }];
      } else if (freeInterval.start.isSame(scheduledInterval.start, 'minute') && freeInterval.end.isAfter(scheduledInterval.end)) {
        // Free interval starts at the same time as the scheduled interval and ends after it
        return [{ start: scheduledInterval.end, end: freeInterval.end, type: 'free', score: 0 }];
      } else if (freeInterval.end.isSame(scheduledInterval.start, 'minute') && freeInterval.start.isBefore(scheduledInterval.start)) {
        // Free interval ends at the same time as the scheduled interval and starts before it
        return [{ start: freeInterval.start, end: scheduledInterval.start, type: 'free', score: 0 }];
      } else if (freeInterval.start.isBefore(scheduledInterval.start) && freeInterval.end.isAfter(scheduledInterval.end)) {
        // Free interval contains the scheduled interval
        return [
          { start: freeInterval.start, end: scheduledInterval.start, type: 'free', score: 0 },
          { start: scheduledInterval.end, end: freeInterval.end, type: 'free', score: 0 },
        ];
      } else {
        // Free interval is fully covered by the scheduled interval
        return [];
      }
    });

    freeWorkIntervals = freeWorkIntervals.flatMap(freeInterval => {
      if (freeInterval.start.isAfter(scheduledInterval.end)) {
        // Free interval starts after the scheduled interval ends
        return [{ ...freeInterval, score: 0 }];
      } else if (freeInterval.end.isBefore(scheduledInterval.start)) {
        // Free interval ends before the scheduled interval starts
        return [{ ...freeInterval, score: 0 }];
      } else if (freeInterval.start.isSame(scheduledInterval.start, 'minute') && freeInterval.end.isAfter(scheduledInterval.end)) {
        // Free interval starts at the same time as the scheduled interval and ends after it
        return [{ start: scheduledInterval.end, end: freeInterval.end, type: 'work', score: 0 }];
      } else if (freeInterval.end.isSame(scheduledInterval.start, 'minute') && freeInterval.start.isBefore(scheduledInterval.start)) {
        // Free interval ends at the same time as the scheduled interval and starts before it
        return [{ start: freeInterval.start, end: scheduledInterval.start, type: 'work', score: 0 }];
      } else if (freeInterval.start.isBefore(scheduledInterval.start) && freeInterval.end.isAfter(scheduledInterval.end)) {
        // Free interval contains the scheduled interval
        return [
          { start: freeInterval.start, end: scheduledInterval.start, type: 'work', score: 0 },
          { start: scheduledInterval.end, end: freeInterval.end, type: 'work', score: 0 },
        ];
      } else {
        // Free interval is fully covered by the scheduled interval
        return [];
      }
    });
  }

  return { freeIntervals, freeWorkIntervals };
}

function scheduleGoalInternal(
  logger: Logger,
  goal: ScheduleableGoal,
  remainingCommitment: number,
  interval: Interval<dayjs.Dayjs>,
  scheduledDayLookup: Record<string, boolean>,
): { scheduled: GoalEvent<dayjs.Dayjs> | null, duration: number } {
  if (interval.start.format('YYYY-MM-DD') in scheduledDayLookup && !goal.allowMultiplePerDay) {
    logger.info(`Goal ${goal.title} is not allowed to be scheduled multiple times per day`);
    return { scheduled: null, duration: 0 };
  }
  const intervalDuration = interval.end.diff(interval.start, 'minutes');
  if (intervalDuration === 0) {
    logger.info(`Interval ${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)} is 0 minutes long`);
    return { scheduled: null, duration: 0 };
  }
  const goalMinimumTime = Math.ceil(goal.minimumDuration / 5) * 5;
  const goalMaximumTime = Math.floor(goal.maximumDuration / 5) * 5;
  logger.info(`Interval ${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)} is ${intervalDuration} minutes long`);
  const maxDuration = Math.max(goalMinimumTime, Math.min(goalMaximumTime, intervalDuration, remainingCommitment));
  // logger.info(`Max duration for ${goal.title} is ${maxDuration} minutes`);
  if (intervalDuration < goalMinimumTime) {
    logger.info(`Interval ${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)} is less than the minimum time ${goalMinimumTime} minutes`);
    return { scheduled: null, duration: 0 };
  } else if (intervalDuration <= maxDuration) {
    scheduledDayLookup[interval.start.format('YYYY-MM-DD')] = true;
    return { scheduled: {
      start: interval.start,
      end: interval.start.add(intervalDuration, 'minutes'),
      goalId: goal.id,
      title: goal.title,
    }, duration: intervalDuration };
  }
  // Interval is longer than the maximum time, so put the goal in the middle of the interval
  scheduledDayLookup[interval.start.format('YYYY-MM-DD')] = true;
  const offset = (intervalDuration - maxDuration) / 2;
  const adjustedOffset = Math.floor(offset / 5) * 5;
  return { scheduled: {
    start: interval.start.add(adjustedOffset, 'minute'),
    end: interval.start.add(adjustedOffset + maxDuration, 'minute'),
    goalId: goal.id,
    title: goal.title,
  }, duration: maxDuration };
}

function scheduleGoalBFS(
  logger: Logger,
  goal: ScheduleableGoal,
  intervals: Interval<dayjs.Dayjs>[],
  remainingCommitment: number,
  scheduledDayLookup: Record<string, boolean>,
): { scheduled: Array<GoalEvent<dayjs.Dayjs>>, duration: number } {
  const originalRemainingCommitment = remainingCommitment;
  let updatedRemainingCommitment = remainingCommitment;
  const schedule: Array<GoalEvent<dayjs.Dayjs>> = [];
  const queue: Array<{ intervals: Interval<dayjs.Dayjs>[], remainingCommitment: number }> = [
    { intervals, remainingCommitment },
  ];

  while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { intervals, remainingCommitment: currentRemainingCommitment } = queue.shift()!;

    if (intervals.length === 0 || currentRemainingCommitment < goal.minimumDuration) {
      continue;
    }

    const middle = Math.floor(intervals.length / 2);
    const middleResult = scheduleGoalInternal(logger, goal, currentRemainingCommitment, intervals[middle], scheduledDayLookup);
    updatedRemainingCommitment = currentRemainingCommitment - middleResult.duration;

    if (middleResult.scheduled) {
      schedule.push(middleResult.scheduled);
    }

    if (updatedRemainingCommitment >= goal.minimumDuration) {
      if (intervals.length > 2) {
        queue.push({ intervals: intervals.slice(0, middle), remainingCommitment: updatedRemainingCommitment });
        queue.push({ intervals: intervals.slice(middle + 1), remainingCommitment: updatedRemainingCommitment });
      } else if (intervals.length === 2) {
        // We just scheduled the interval at 1, so we need to schedule the interval at 0
        queue.push({ intervals: [intervals[0]], remainingCommitment: updatedRemainingCommitment });
      } // If there is only one interval, we don't need to schedule it again
    }
  }

  return { scheduled: schedule, duration: originalRemainingCommitment - updatedRemainingCommitment };
}

interface IntervalsState {
  freeIntervals: Interval<dayjs.Dayjs>[];
  freeWorkIntervals: Interval<dayjs.Dayjs>[];
  score: number;
}

const DEFAULT_BREAK_DURATION = 10;

function splitInterval(logger: Logger, interval: IntervalWithScore<dayjs.Dayjs>, durations: number[], breakDuration: number): IntervalWithScore<dayjs.Dayjs>[] {
  const intervals: IntervalWithScore<dayjs.Dayjs>[] = [];
  let currentStart = interval.start;

  let i = 0;
  for (const duration of durations) {
    i++;
    if (duration === 0) {
      continue;
    }
    const end = currentStart.add(duration, 'minutes');
    if (end.isAfter(interval.end.add(1, 'minute'))) {
      logger.error(`Split interval ${currentStart.format(DATE_TIME_FORMAT)} - ${end.format(DATE_TIME_FORMAT)} at ${duration} minutes is after the end of the interval`);
      intervals.push({ start: currentStart, end: interval.end, score: i === 1 ? interval.score : -0.5 });
      continue;
    }
    intervals.push({ start: currentStart, end, score: i === 1 ? interval.score : -0.5 });
    currentStart = end.add(breakDuration, 'minutes');
  }

  return intervals;
}

function splitIntervals(
  logger: Logger,
  goal: ScheduleableGoal,
  intervals: IntervalWithScore<dayjs.Dayjs>[]
): IntervalWithScore<dayjs.Dayjs>[] {
  const breakDuration = goal.breakDuration ?? DEFAULT_BREAK_DURATION;
  const minDuration = Math.ceil(goal.minimumDuration / 5) * 5;
  const maxDuration = Math.floor(goal.maximumDuration / 5) * 5;
  const result: IntervalWithScore<dayjs.Dayjs>[] = [];
  for (const interval of intervals) {
    let intervalDuration = interval.end.diff(interval.start, 'minutes');
    logger.info(`Interval ${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)} is ${intervalDuration} minutes long`);
    if (intervalDuration >= maxDuration + minDuration + breakDuration) {
      const splitDurations = [maxDuration]
      intervalDuration -= maxDuration;
      while (intervalDuration >= maxDuration + breakDuration) {
        splitDurations.push(maxDuration);
        intervalDuration -= (maxDuration + breakDuration);
      }
      if (intervalDuration >= minDuration + breakDuration) {
        splitDurations.push(intervalDuration - breakDuration);
      }
      
      const splitIntervals = splitInterval(logger, interval, splitDurations, breakDuration);
      logger.info(`Split intervals:\n${splitIntervals.map(interval => `\t${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)} duration: ${interval.end.diff(interval.start, 'minutes')} minutes`).join('\n')}`);
      result.push(...splitIntervals);
    } else {
      result.push(interval);
    }
  }
  return result;
}

function scheduleGoal(logger: Logger, goal: ScheduleableGoal, freeIntervals: IntervalWithScore<dayjs.Dayjs>[], freeWorkIntervals: IntervalWithScore<dayjs.Dayjs>[]): Array<GoalEvent<dayjs.Dayjs>> {
  const schedule: Array<GoalEvent<dayjs.Dayjs>> = [];
  const preferredIntervals: IntervalsState[] = [];
  let currentFreeIndex = 0;
  let currentWorkIndex = 0;
  let nextFreeIndex = -1;
  let nextWorkIndex = -1;
  do {
    const currentFree = currentFreeIndex < freeIntervals.length ? freeIntervals[currentFreeIndex] : undefined;
    const currentWork = currentWorkIndex < freeWorkIntervals.length ? freeWorkIntervals[currentWorkIndex] : undefined;
    if (!currentFree && !currentWork) {
      break;
    }
    const currentHighScore = Math.max(currentFree?.score ?? -0.5, currentWork?.score ?? -0.5); // -0.5 is the default score for an interval that was split
    nextFreeIndex = freeIntervals.findIndex(interval => interval.score < currentHighScore);
    nextWorkIndex = freeWorkIntervals.findIndex(interval => interval.score < currentHighScore);
    const sameScoreFreeIntervals = currentFree ? freeIntervals.slice(currentFreeIndex, nextFreeIndex === -1 ? freeIntervals.length : nextFreeIndex) : [];
    const sameScoreWorkIntervals = currentFree ? freeWorkIntervals.slice(currentWorkIndex, nextWorkIndex === -1 ? freeWorkIntervals.length : nextWorkIndex) : [];
    if (sameScoreFreeIntervals.length <= 0 && sameScoreWorkIntervals.length <= 0) {
      continue;
    }
    preferredIntervals.push({
      freeIntervals: sameScoreFreeIntervals,
      freeWorkIntervals: sameScoreWorkIntervals,
      score: currentHighScore,
    });
    currentFreeIndex = nextFreeIndex;
    currentWorkIndex = nextWorkIndex;
  } while (nextFreeIndex !== -1 || nextWorkIndex !== -1);

  let remainingCommitment = Math.floor(goal.remainingCommitment * 60);
  const scheduledDayLookup: Record<string, boolean> = {};
  let totalTimeAvailable = 0;
  for (let i = 0; i < preferredIntervals.length; i++) {
    const { freeIntervals, freeWorkIntervals, score } = preferredIntervals[i];
    logger.info(`Scheduling "${goal.title}" in preferred intervals with score ${score} and remaining commitment ${remainingCommitment}`);
    totalTimeAvailable += freeIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0);
    if (goal.canDoDuringWork) {
      totalTimeAvailable += freeWorkIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0);
      logger.info(`Free work intervals:\n${freeWorkIntervals.map(interval => `  ${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)}`).join('\n')}`);
      let { scheduled, duration } = scheduleGoalBFS(logger, goal, freeWorkIntervals.slice(0, 1), remainingCommitment, scheduledDayLookup);
      remainingCommitment -= duration;
      schedule.push(...scheduled);
      logger.info(`Scheduled ${duration} minutes and remaining commitment ${remainingCommitment} - ${scheduled.length} events`);
      if (remainingCommitment < goal.minimumDuration) {
        logger.info(`Total time available: ${totalTimeAvailable} minutes`);
        return schedule;
      }
      if (freeWorkIntervals.length > 1) {
        ({ scheduled, duration } = scheduleGoalBFS(logger, goal, freeWorkIntervals.slice(-1), remainingCommitment, scheduledDayLookup));
        remainingCommitment -= duration;
        schedule.push(...scheduled);
        logger.info(`Scheduled ${duration} minutes and remaining commitment ${remainingCommitment} - ${scheduled.length} events`);
      }
      if (remainingCommitment < goal.minimumDuration) {
        logger.info(`Total time available: ${totalTimeAvailable} minutes`);
        return schedule;
      }
      if (freeWorkIntervals.length > 2) {
        ({ scheduled, duration } = scheduleGoalBFS(logger, goal, freeWorkIntervals.slice(1, -1), remainingCommitment, scheduledDayLookup));
        remainingCommitment -= duration;
        schedule.push(...scheduled);
        logger.info(`Scheduled ${duration} minutes and remaining commitment ${remainingCommitment} - ${scheduled.length} events`);
      }
      if (remainingCommitment < goal.minimumDuration) {
        logger.info(`Total time available: ${totalTimeAvailable} minutes`);
        return schedule;
      }
    }
    logger.info(`Free intervals:\n${freeIntervals.map(interval => `  ${interval.start.format(DATE_TIME_FORMAT)} - ${interval.end.format(DATE_TIME_FORMAT)}`).join('\n')}`);
    let { scheduled, duration } = scheduleGoalBFS(logger, goal, freeIntervals.slice(0, 1), remainingCommitment, scheduledDayLookup);
    remainingCommitment -= duration;
    schedule.push(...scheduled);
    logger.info(`Scheduled ${duration} minutes and remaining commitment ${remainingCommitment} - ${scheduled.length} events`);
    if (remainingCommitment < goal.minimumDuration) {
      logger.info(`Total time available: ${totalTimeAvailable} minutes`);
      return schedule;
    }
    if (freeIntervals.length > 1) {
      ({ scheduled, duration } = scheduleGoalBFS(logger, goal, freeIntervals.slice(-1), remainingCommitment, scheduledDayLookup));
      remainingCommitment -= duration;
      schedule.push(...scheduled);
      logger.info(`Scheduled ${duration} minutes and remaining commitment ${remainingCommitment} - ${scheduled.length} events`);
    }
    if (remainingCommitment < goal.minimumDuration) {
      logger.info(`Total time available: ${totalTimeAvailable} minutes`);
      return schedule;
    }
    if (freeIntervals.length > 2) {
      ({ scheduled, duration } = scheduleGoalBFS(logger, goal, freeIntervals.slice(1, -1), remainingCommitment, scheduledDayLookup));
      remainingCommitment -= duration;
      schedule.push(...scheduled);
      logger.info(`Scheduled ${duration} minutes and remaining commitment ${remainingCommitment} - ${scheduled.length} events`);
    }
    if (remainingCommitment < goal.minimumDuration) {
      logger.info(`Total time available: ${totalTimeAvailable} minutes`);
      return schedule;
    }
  }

  logger.info(`Total time available: ${totalTimeAvailable} minutes`);
  return schedule;
}
