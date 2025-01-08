import { deleteGoalEvents, getSchedulingData, GoalSchedulingData, saveSchedule } from "../../../queries/calendar";
import { inngest, InngestEvent } from "../client";
import { Goal, UserProfile } from "@prisma/client";
import { Logger } from "inngest/middleware/logger";
import { dayjs } from "@/shared/utils";
import { JsonValue } from "inngest/helpers/jsonify";
import { PreferredTimesEnumType } from "@/shared/zod";
import { ExternalEvent, getGoalScoringInstructions, GoalEvent, GoalSchedulingInput, scheduleGoal, ScheduleInputData, scoreIntervals, TypedIntervalWithScore, WakeUpOrSleepEvent } from "../agents/scheduling/scheduling";

export interface Interval<T = Date> {
  start: T;
  end: T;
}

interface PreparedSchedulingData {
  interval: Interval<string>;
  externalEvents: ExternalEvent<string>[];
  data: ScheduleInputData;
  goalMap: Record<string, GoalSchedulingData>;
  timezone: string;
}

export const MIN_BLOCK_SIZE = 10;
export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';

const timeToInterval: Record<PreferredTimesEnumType, Interval<dayjs.Dayjs>> = {
  'Early Morning': {
    start: dayjs().hour(5).minute(0),
    end: dayjs().hour(8).minute(0),
  },
  'Morning': {
    start: dayjs().hour(8).minute(0),
    end: dayjs().hour(11).minute(0),
  },
  'Midday': {
    start: dayjs().hour(11).minute(0),
    end: dayjs().hour(14).minute(0),
  },
  'Afternoon': {
    start: dayjs().hour(14).minute(0),
    end: dayjs().hour(17).minute(0),
  },
  'Evening': {
    start: dayjs().hour(17).minute(0),
    end: dayjs().hour(20).minute(0),
  },
  'Night': {
    start: dayjs().hour(20).minute(0),
    end: dayjs().hour(23).minute(0),
  },
}

// Get the preferred times for a goal in the format of HH:mm-HH:mm, merging time blocks and adhering to the preferred wake up and sleep times
function parsePreferredTimes(profile: UserProfile, preferredTimes: JsonValue): Interval<dayjs.Dayjs>[] {
  if (!Array.isArray(preferredTimes)) {
    throw new Error('Preferred times must be an array');
  }
  const preferredWakeUpTime = dayjs(profile.preferredWakeUpTime);
  const preferredSleepTime = dayjs(profile.preferredSleepTime);
  console.log(`Preferred times: ${JSON.stringify(preferredTimes, null, 2)}`);
  const adjustedPreferredTimes = preferredTimes.map(time => {
    const interval = timeToInterval[time as PreferredTimesEnumType];
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
  console.log(`Adjusted preferred times: ${JSON.stringify(adjustedPreferredTimes, null, 2)}`);
  const sortedPreferredTimes = adjustedPreferredTimes.sort((a, b) => a.start.diff(b.start, 'minutes'))
  console.log(`Sorted preferred times: ${JSON.stringify(sortedPreferredTimes, null, 2)}`);
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
  console.log(`Merged preferred times: ${JSON.stringify(mergedPreferredTimes, null, 2)}`);
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
  // logger.info(`Getting free intervals for ${JSON.stringify(timeframe, null, 2)}`);
  const wakeUpOrSleepEvents: WakeUpOrSleepEvent<string>[] = [];
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
    const upcomingEvents = events.filter(event => !event.allDay && event.start.isAfter(currentTime) && event.start.isBefore(nextDay));
    const preferredWakeUpTime = dayjs(profile.preferredWakeUpTime);
    const wakeUpTime = currentTime
      .hour(preferredWakeUpTime.hour())
      .minute(preferredWakeUpTime.minute())
      .add(15, 'minutes'); // Add 15 minutes to the wake up time to account for getting out of bed
    const preferredSleepTime = dayjs(profile.preferredSleepTime);
    const sleepHour = preferredSleepTime.hour();
    const sleepTime = currentTime
      .hour(sleepHour === 0 ? 24 : sleepHour)
      .minute(preferredSleepTime.minute())
      .add(30, 'seconds').subtract(30, 'minutes'); // Subtract 30 minutes from the sleep time to account for getting ready to sleep
    wakeUpOrSleepEvents.push({
      type: 'wakeUp',
      start: wakeUpTime.format(DATE_TIME_FORMAT),
    });
    wakeUpOrSleepEvents.push({
      type: 'sleep',
      start: sleepTime.format(DATE_TIME_FORMAT),
    });
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
        // console.log(`Found ${intervals.length} free intervals before work`);
        currentTime = workStart.add(1, 'second');
        continue;
      }
      // Find blocks during work
      if (workStart && workEnd && currentTime.isAfter(workStart) && currentTime.isBefore(workEnd)) {
        const intervals = getTimeblocks(currentTime, workEnd, upcomingEvents);
        freeWorkIntervals.push(...intervals);
        // console.log(`Found ${intervals.length} free work intervals during work`);
        currentTime = workEnd.add(1, 'second');
        continue;
      }
      // Find blocks after work
      if (workEnd && currentTime.isAfter(workEnd)) {
        const intervals = getTimeblocks(currentTime, sleepTime, upcomingEvents);
        freeIntervals.push(...intervals);
        // console.log(`Found ${intervals.length} free intervals after work`);
        currentTime = nextDay;
        continue;
      }
      if (!workStart && !workEnd) {
        const intervals = getTimeblocks(currentTime, sleepTime, upcomingEvents);
        freeIntervals.push(...intervals);
        // console.log(`Found ${intervals.length} free intervals on day off`);
        currentTime = nextDay;
        continue;
      }
      console.warn('Finished loop without finding any free intervals');
    }
  }
  return { freeIntervals, freeWorkIntervals, wakeUpOrSleepEvents };
}

function getIntersection(a: Interval<dayjs.Dayjs>, b: Interval<dayjs.Dayjs>): Interval<dayjs.Dayjs> | null {
  const start = a.start.isAfter(b.start) ? a.start : b.start;
  const end = a.end.isBefore(b.end) ? a.end : b.end;
  if (start.isBefore(end)) {
    return { start, end };
  }
  return null;
}

function getTimeRemainingInPreferredTimes(
  goal: Goal,
  preferredTimes: Interval<dayjs.Dayjs>[],
  freeIntervals: Interval<dayjs.Dayjs>[],
  freeWorkIntervals: Interval<dayjs.Dayjs>[],
  timeframe: Interval<dayjs.Dayjs>,
): number {
  function getPreferredTimesForDay(day: dayjs.Dayjs): Interval<dayjs.Dayjs>[] {
    return preferredTimes.map(time => ({
      start: time.start.year(day.year()).month(day.month()).date(day.date()).subtract(1, 'second'),
      end: time.end.year(day.year()).month(day.month()).date(day.date()).add(1, 'second'),
    }));
  }
  let totalMinutes = 0;
  let preferredTimesToday: Interval<dayjs.Dayjs>[] = getPreferredTimesForDay(timeframe.start);
  let currentDay = timeframe.start.date();
  for (const interval of freeIntervals) {
    if (interval.start.date() !== currentDay) {
      preferredTimesToday = getPreferredTimesForDay(interval.start);
      currentDay = interval.start.date();
    }
    const preferredTimesIntersections = preferredTimesToday.map(preferredTime => getIntersection(preferredTime, interval)).filter(Boolean) as Interval<dayjs.Dayjs>[];
    if (preferredTimesIntersections.length > 0) {
      totalMinutes += preferredTimesIntersections.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0);
    }
  }
  if (goal.canDoDuringWork) {
    for (const interval of freeWorkIntervals) {
      if (interval.start.date() !== currentDay) {
        preferredTimesToday = getPreferredTimesForDay(interval.start);
        currentDay = interval.start.date();
      }
      const preferredTimesIntersections = preferredTimesToday.map(preferredTime => getIntersection(preferredTime, interval)).filter(Boolean) as Interval<dayjs.Dayjs>[];
      if (preferredTimesIntersections.length > 0) {
        totalMinutes += preferredTimesIntersections.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0);
      }
    }
  }
  return totalMinutes;
}

/**
 * Get the remaining commitment for a goal for a given period.
 * @param goal - The goal to get the remaining commitment for.
 * @param timeframe - The timeframe to get the remaining commitment for.
 * @returns The remaining commitment for the goal for the given period.
 */
function getRemainingCommitmentForPeriod(
  goal: Goal,
  preferredTimes: Interval<dayjs.Dayjs>[],
  freeIntervals: Interval<dayjs.Dayjs>[],
  freeWorkIntervals: Interval<dayjs.Dayjs>[],
  timeframe: Interval<dayjs.Dayjs>,
): number {
  const totalMinutes = getTimeRemainingInPreferredTimes(goal, preferredTimes, freeIntervals, freeWorkIntervals, timeframe);
  const priorityRestFactor = goal.priority === 'High' ? 1 : goal.priority === 'Medium' ? 0.85 : 0.75;
  const adjustedMinutesRemaining = totalMinutes * priorityRestFactor;
  if (goal.commitment) {
    if ((goal.commitment - goal.completed) * 60 > adjustedMinutesRemaining) {
      // If there isn't enough time to complete the commitment, we return how much time there is available
      console.log(`Adjusted remaining commitment for ${goal.title}: ${adjustedMinutesRemaining}`);
      return adjustedMinutesRemaining / 60;
    }
    // Return how much time is left to complete the commitment
    const remaining = goal.commitment - goal.completed;
    console.log(`Remaining commitment for ${goal.title}: ${remaining}`);
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
      const { goals, interval, profile, schedule } = await getSchedulingData(userId);
      console.log(`Finding free intervals for`, interval);
      const { freeIntervals, freeWorkIntervals, wakeUpOrSleepEvents } = getFreeIntervals(logger, profile, interval, schedule);
      console.log(`Found ${freeIntervals.length} free intervals and ${freeWorkIntervals.length} free work intervals and ${wakeUpOrSleepEvents.length} wake up or sleep events`);
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
              const preferredTimes = parsePreferredTimes(profile, goal.preferredTimes as JsonValue);
              return {
                id: goal.id,
                title: goal.title,
                description: goal.description,
                allowMultiplePerDay: goal.allowMultiplePerDay,
                canDoDuringWork: goal.canDoDuringWork,
                priority: goal.priority,
                preferredTimes: preferredTimes.map(time => ({
                  start: time.start.format('HH:mm'),
                  end: time.end.format('HH:mm'),
                })),
                remainingCommitment: getRemainingCommitmentForPeriod(goal, preferredTimes, dayJsFreeIntervals, dayJsFreeWorkIntervals, timeframe),
                minimumTime: goal.minimumTime,
                maximumTime: goal.maximumTime,
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
    const schedule: Array<GoalEvent<dayjs.Dayjs>> = [];
    logger.info(`Scheduling ${data.goals.length} goals...`, data.goals.map(goal => goal.title));
    const goalsScheduledSoFar: string[] = [];
    for (const goal of data.goals) {
      const instructions = await step.ai.wrap('get-goal-scoring-instructions', getGoalScoringInstructions, goal, goalsScheduledSoFar, externalEvents);
      logger.info(`${instructions}`);
      logger.info(`${freeIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of free intervals`);
      logger.info(`${freeWorkIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of free work intervals`);

      logger.info(`Scoring intervals for ${goal.title}...`);
      const { scoredFreeWorkIntervals, scoredFreeIntervals } = await step.ai.wrap(
        'score-intervals',
        scoreIntervals,
        instructions,
        goal,
        freeIntervals,
        freeWorkIntervals,
        data.wakeUpOrSleepEvents,
        externalEvents,
        schedule,
      );

      logger.info(`Scheduling goal: ${goal.title}...`);
      const input: GoalSchedulingInput = {
        goal,
        freeIntervals: scoredFreeIntervals.map(interval => interval.interval).filter(interval => interval.score >= 0).sort((a, b) => b.score - a.score),
        freeWorkIntervals: scoredFreeWorkIntervals.map(interval => interval.interval).filter(interval => interval.score >= 0).sort((a, b) => b.score - a.score),
      }
      const intervals = await step.ai.wrap('schedule-goal', scheduleGoal, input);
      ({ freeIntervals, freeWorkIntervals } = updateIntervals(
        { freeIntervals, freeWorkIntervals },
        intervals.map(interval => ({
          start: dayjs.tz(interval.start, timezone),
          end: dayjs.tz(interval.end, timezone),
        })).sort((a, b) => a.start.diff(b.start))
      ));

      logger.info(`${freeIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of free intervals after scheduling ${goal.title}`);
      logger.info(`${freeWorkIntervals.reduce((acc, curr) => acc + curr.end.diff(curr.start, 'minutes'), 0)} minutes of free work intervals after scheduling ${goal.title}`);
      logger.info(`Scheduled ${intervals.reduce((acc, curr) => acc + dayjs(curr.end).diff(curr.start, 'minutes'), 0)} minutes of intervals for ${goal.title}`);

      schedule.push(...intervals.map(interval => ({
        start: dayjs(interval.start),
        end: dayjs(interval.end),
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
  }
)

interface Intervals {
  freeIntervals: TypedIntervalWithScore<dayjs.Dayjs>[];
  freeWorkIntervals: TypedIntervalWithScore<dayjs.Dayjs>[];
}
function updateIntervals(intervals: Intervals, schedule: Array<Interval<dayjs.Dayjs>>): Intervals {
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
