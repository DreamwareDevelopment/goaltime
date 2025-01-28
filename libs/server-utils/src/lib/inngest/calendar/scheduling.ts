import { JsonValue } from "inngest/helpers/jsonify";
import { Logger } from "inngest/middleware/logger";

import { dayjs, DATE_TIME_FORMAT, ExternalEvent, GoalEvent, Interval, IntervalWithScore, TypedIntervalWithScore } from "@/shared/utils";
import { DaysOfTheWeekType, MinimalScheduleableGoal, ScheduleableGoal, ScheduleInputData } from "@/shared/zod";

import { deleteGoalEvents, getSchedulingData, GoalSchedulingData, saveSchedule } from "../../../queries/calendar";
import { getFreeIntervals, getGoalScoringInstructions, getPreferredTimes, getRemainingCommitmentForPeriod, parsePreferredTimes, scoreIntervals } from "../../ai/scheduling";
import { inngestConsumer, InngestEvent } from "../client";
import { posthog } from "../../posthog";

interface PreparedSchedulingData {
  interval: Interval<string>;
  eventsAndRoutines: ExternalEvent<string>[];
  data: ScheduleInputData;
  goalMap: Record<string, GoalSchedulingData>;
  timezone: string;
}

export const scheduleGoalEvents = inngestConsumer.createFunction(
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
    const { data, interval, goalMap, eventsAndRoutines, timezone } = await step.run('get-scheduling-data', async () => {
      const { goals, interval, profile, schedule, fullSyncTimeframe } = await getSchedulingData(userId);
      const { eventsAndRoutines, freeIntervals, freeWorkIntervals, wakeUpOrSleepEvents } = getFreeIntervals(logger, profile, interval, schedule);
      logger.info(`Found ${freeIntervals.length} free intervals and ${freeWorkIntervals.length} free work intervals and ${wakeUpOrSleepEvents.length} wake up or sleep events`);
      freeIntervals.map(interval => logger.info(`Free interval: ${dayjs.tz(interval.start, profile.timezone).format(DATE_TIME_FORMAT)} - ${dayjs.tz(interval.end, profile.timezone).format(DATE_TIME_FORMAT)}`));
      freeWorkIntervals.map(interval => logger.info(`Free work interval: ${dayjs.tz(interval.start, profile.timezone).format(DATE_TIME_FORMAT)} - ${dayjs.tz(interval.end, profile.timezone).format(DATE_TIME_FORMAT)}`));
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
        eventsAndRoutines: eventsAndRoutines.map(event => ({
          ...event,
          start: event.start.format(DATE_TIME_FORMAT),
          end: event.end.format(DATE_TIME_FORMAT),
          allDay: event.allDay ? event.allDay.format(DATE_TIME_FORMAT) : undefined,
        })),
        data: {
          wakeUpOrSleepEvents,
          goals: goals.map(goal => 
            {
              const preferredTimes = parsePreferredTimes(logger, profile, timeframe, goal.preferredTimes as JsonValue);
              const stringifiedPreferredTimes = Object.entries(preferredTimes).reduce((acc, [day, times]) => {
                acc[day as DaysOfTheWeekType] = times.map(time => ({
                  start: time.start.format(DATE_TIME_FORMAT),
                  end: time.end.format(DATE_TIME_FORMAT),
                }));
                return acc;
              }, {} as Record<DaysOfTheWeekType, Interval<string>[]>);
              return {
                id: goal.id,
                title: goal.title,
                description: goal.description,
                breakDuration: goal.breakDuration,
                allowMultiplePerDay: goal.allowMultiplePerDay,
                canDoDuringWork: goal.canDoDuringWork,
                priority: goal.priority,
                preferredTimes: stringifiedPreferredTimes,
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
      const instructions = await step.ai.wrap(`get-${goal.id}-scoring-instructions`, getGoalScoringInstructions, minimalGoal, goalsScheduledSoFar, eventsAndRoutines);
      logger.info(`${instructions}`);

      const preferredTimes = Object.entries(goal.preferredTimes).reduce((acc, [day, times]) => {
        acc[day as DaysOfTheWeekType] = times.map(time => ({
          start: dayjs(time.start),
          end: dayjs(time.end),
        }));
        return acc;
      }, {} as Record<DaysOfTheWeekType, Interval<dayjs.Dayjs>[]>);
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
        eventsAndRoutines,
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
      posthog?.capture({
        distinctId: userId,
        event: "goal events scheduled",
        properties: {
          deletedEventsCount: deletedEvents.length,
          newEventsCount: newEvents.length,
          goalCount: data.goals.length,
        },
      })
      return { deletedEvents, newEvents };
    });
    logger.info(`Deleted ${deletedEvents.length} events and saved ${newEvents.length} events`);

    const syncPromise = step.sendEvent('sync-to-client', {
      name: InngestEvent.SyncToClient,
      data: {
        userId,
        calendarEvents: newEvents,
        calendarEventsToDelete: deletedEvents,
      },
    });
    const scheduleUpdatedPromise = step.sendEvent('schedule-updated', {
      name: InngestEvent.ScheduleUpdated,
      data: {
        userId,
        schedule: newEvents,
      },
    });
    await Promise.all([syncPromise, scheduleUpdatedPromise]);
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
  let currentRemainingCommitment = remainingCommitment;
  const schedule: Array<GoalEvent<dayjs.Dayjs>> = [];
  const queue: Array<{ intervals: Interval<dayjs.Dayjs>[] }> = [
    { intervals },
  ];

  while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { intervals } = queue.shift()!;

    logger.info(`Scheduling goal ${goal.title} with ${currentRemainingCommitment} minutes of remaining commitment`);
    if (intervals.length === 0 || currentRemainingCommitment < goal.minimumDuration) {
      continue;
    }

    const middle = Math.floor(intervals.length / 2);
    const middleResult = scheduleGoalInternal(logger, goal, currentRemainingCommitment, intervals[middle], scheduledDayLookup);
    currentRemainingCommitment -= middleResult.duration;

    if (middleResult.scheduled) {
      schedule.push(middleResult.scheduled);
    }

    if (currentRemainingCommitment >= goal.minimumDuration) {
      if (intervals.length > 2) {
        queue.push({ intervals: intervals.slice(0, middle) });
        queue.push({ intervals: intervals.slice(middle + 1) });
      } else if (intervals.length === 2) {
        // We just scheduled the interval at 1, so we need to schedule the interval at 0
        queue.push({ intervals: [intervals[0]] });
      } // If there is only one interval, we don't need to schedule it again
    } else {
      break;
    }
  }

  return { scheduled: schedule, duration: originalRemainingCommitment - currentRemainingCommitment };
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
  logger.info(`Break duration: ${breakDuration} minutes`);
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
    const sameScoreWorkIntervals = currentWork ? freeWorkIntervals.slice(currentWorkIndex, nextWorkIndex === -1 ? freeWorkIntervals.length : nextWorkIndex) : [];
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
      // Schedule the leftmost interval
      let { scheduled, duration } = scheduleGoalBFS(logger, goal, freeWorkIntervals.slice(0, 1), remainingCommitment, scheduledDayLookup);
      remainingCommitment -= duration;
      schedule.push(...scheduled);
      logger.info(`Scheduled ${duration} minutes and remaining commitment ${remainingCommitment} - ${scheduled.length} events`);
      if (remainingCommitment < goal.minimumDuration) {
        logger.info(`Total time available: ${totalTimeAvailable} minutes`);
        return schedule;
      }
      if (freeWorkIntervals.length > 1) {
        // Schedule the rightmost interval
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
        // BFS the middle
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
    // Schedule the leftmost interval
    let { scheduled, duration } = scheduleGoalBFS(logger, goal, freeIntervals.slice(0, 1), remainingCommitment, scheduledDayLookup);
    remainingCommitment -= duration;
    schedule.push(...scheduled);
    logger.info(`Scheduled ${duration} minutes and remaining commitment ${remainingCommitment} - ${scheduled.length} events`);
    if (remainingCommitment < goal.minimumDuration) {
      logger.info(`Total time available: ${totalTimeAvailable} minutes`);
      return schedule;
    }
    if (freeIntervals.length > 1) {
      // Schedule the rightmost interval
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
      // BFS the middle
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
