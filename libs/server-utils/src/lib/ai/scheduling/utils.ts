
import { dayjs, DATE_TIME_FORMAT, ExternalEvent, Interval, MIN_BLOCK_SIZE, WakeUpOrSleepEvent } from "@/shared/utils";
import { Goal, UserProfile } from "@prisma/client";
import { Logger } from "inngest/middleware/logger";
import { DaysOfTheWeekType, getProfileRoutine, PreferredTimesEnumType } from "@/shared/zod";
import { JsonValue } from "inngest/helpers/jsonify";

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
export function getFreeIntervals(
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
  const routine = getProfileRoutine(profile);
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

    const dayName = currentTime.format('dddd');
    const isLastDay = daysBetween + 1 === i;
    const upcomingEvents = events.filter(event => !event.allDay && event.start.isAfter(currentTime) && event.start.isBefore(nextDay));
    const sleepRoutine = routine.sleep[dayName as DaysOfTheWeekType]
    if (!sleepRoutine || !sleepRoutine.start || !sleepRoutine.end) {
      throw new Error(`sleepRoutine for ${dayName} is not defined`);
    }
    const preferredWakeUpTime = dayjs(sleepRoutine.end)
    const wakeUpTime = currentTime
      .hour(preferredWakeUpTime.hour())
      .minute(preferredWakeUpTime.minute())
    // This makes sure we don't schedule past the next full sync
    const preferredSleepTime = isLastDay ? dayjs(timeframe.end) : dayjs(sleepRoutine.start);
    const sleepHour = preferredSleepTime.hour();
    const sleepTime = currentTime
      .hour(sleepHour < wakeUpTime.hour() ? sleepHour + 24 : sleepHour)
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

// Get the preferred times for a goal in the format of HH:mm-HH:mm, merging time blocks and adhering to the preferred wake up and sleep times
export function parsePreferredTimes(logger: Logger, profile: UserProfile, start: dayjs.Dayjs, preferredTimes: JsonValue): Interval<dayjs.Dayjs>[] {
  if (!Array.isArray(preferredTimes)) {
    throw new Error('Preferred times must be an array');
  }
  const dayName = start.format('dddd') as DaysOfTheWeekType;
  const routine = getProfileRoutine(profile);
  const sleepRoutine = routine.sleep[dayName as DaysOfTheWeekType]
  if (!sleepRoutine || !sleepRoutine.start || !sleepRoutine.end) {
    throw new Error(`sleepRoutine for ${dayName} is not defined`);
  }
  const preferredWakeUpTime = dayjs(sleepRoutine.end);
  const preferredSleepTime = dayjs(sleepRoutine.start);
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

/**
 * Get the remaining commitment for a goal for a given period, this does not take into account the amount completed.
 * @param goal - The goal to get the remaining commitment for.
 * @param timeframe - The timeframe to get the remaining commitment for.
 * @returns The remaining commitment for the goal for the given period.
 */
export function getRemainingCommitmentForPeriod(
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
