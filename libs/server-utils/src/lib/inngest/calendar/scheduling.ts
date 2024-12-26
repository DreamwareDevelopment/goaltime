import { getSchedulingData } from "libs/server-utils/src/queries/calendar";
import { inngest, InngestEvent } from "../client";
import { CalendarEvent, Goal, UserProfile } from "@prisma/client";
import { Logger } from "inngest/middleware/logger";
import { dayjs } from "@/shared/utils";

export interface Interval {
  start: Date;
  end: Date;
}

interface SchedulingData {
  goals: Goal[];
  interval: Interval;
  profile: UserProfile;
  schedule: CalendarEvent[];
}

export const MIN_BLOCK_SIZE = 10;

function timeOffset(date: dayjs.Dayjs, offset: dayjs.Dayjs): dayjs.Dayjs {
  return date.set('hours', offset.hour()).set('minutes', offset.minute());
}

function getTimeblocks(start: dayjs.Dayjs, end: dayjs.Dayjs, upcomingEvents: CalendarEvent[]): Interval[] {
  const timeblocks: Interval[] = [];
  let currentTime = start;
  while (currentTime.isBefore(end)) {
    const nextEvent = upcomingEvents.find(event => dayjs(event.startTime!).isAfter(currentTime) && dayjs(event.startTime!).isBefore(end));
    if (nextEvent) {
      if (dayjs(nextEvent.startTime!).diff(currentTime, 'minutes') > MIN_BLOCK_SIZE) {
        timeblocks.push({ start: currentTime.toDate(), end: nextEvent.startTime! });
      }
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
function getFreeIntervals(logger: Logger, profile: UserProfile, timeframe: Interval, events: CalendarEvent[]): { freeIntervals: Interval[], workIntervals: Interval[] } {
  logger.info(`Getting free intervals for ${JSON.stringify(timeframe, null, 2)}`);
  const freeIntervals: Interval[] = [];
  const workIntervals: Interval[] = [];
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
    // logger.info(`Current time: ${currentTime.format('YYYY-MM-DD HH:mm')}`);
    // logger.info(`Next day: ${nextDay.format('YYYY-MM-DD HH:mm')}`);
    const upcomingEvents = events.filter(event => dayjs(event.startTime).isAfter(currentTime) && dayjs(event.startTime).isBefore(nextDay));
    const wakeUpTime = timeOffset(currentTime, dayjs(profile.preferredWakeUpTime));
    const sleepTime = timeOffset(currentTime, dayjs(profile.preferredSleepTime));
    // logger.info(`Wake up time: ${wakeUpTime.format('YYYY-MM-DD HH:mm')}`);
    // logger.info(`Sleep time: ${sleepTime.format('YYYY-MM-DD HH:mm')}`);
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
        workIntervals.push(...getTimeblocks(currentTime, workEnd, upcomingEvents));
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
  return { freeIntervals, workIntervals };
}

/**
 * Get the remaining commitment for a goal for a given period.
 * @param goal - The goal to get the remaining commitment for.
 * @param timeframe - The timeframe to get the remaining commitment for.
 * @returns The remaining commitment for the goal for the given period.
 */
function getRemainingCommitmentForPeriod(goal: Goal, timeframe: Interval): number {
  if (goal.commitment) {
    return goal.commitment - goal.completed;
  }
  // This function could also get the completed commitment so far to give some analytics
  // If the user has been on track or if they are having to work more per week to catch up
  const start = dayjs(timeframe.start);
  const deadline = dayjs(goal.deadline!);
  const end = dayjs(timeframe.end);
  const daysRemainingThisPeriod = end.diff(start, 'days');
  const daysUntilDeadline = deadline.diff(start, 'days');
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
    await step.run('get-scheduling-data', async () => {
      const schedulingData = await getSchedulingData(userId);
      const { goals, interval, profile, schedule } = schedulingData as unknown as SchedulingData;
      const { freeIntervals, workIntervals } = getFreeIntervals(logger, profile, interval, schedule);
      freeIntervals.map(interval => logger.info(`Free interval: ${dayjs.tz(interval.start, profile.timezone).format('YYYY-MM-DD HH:mm')} - ${dayjs.tz(interval.end, profile.timezone).format('YYYY-MM-DD HH:mm')}`));
      workIntervals.map(interval => logger.info(`Work interval: ${dayjs.tz(interval.start, profile.timezone).format('YYYY-MM-DD HH:mm')} - ${dayjs.tz(interval.end, profile.timezone).format('YYYY-MM-DD HH:mm')}`));
      for (const goal of goals) {
        const remainingCommitment = getRemainingCommitmentForPeriod(goal, interval);
        logger.info(`${goal.title} - ${remainingCommitment} hours remaining`);
      }
    });
  }
)
