import { DATE_TIME_FORMAT, inngest, InngestEvent, InngestEventData } from "@/server-utils/inngest";
import { getPrismaClient } from "@/server-utils/prisma";
import { getUserIds } from "@/server-utils/queries/user";
import { dayjs, GoalWithNotifications, NotificationData } from "@/shared/utils";
import { CalendarEvent, Goal, NotificationSettings } from "@prisma/client";
import { Jsonify } from "inngest/helpers/jsonify";
import { Logger } from "inngest/middleware/logger";

interface AccountabilityLoopState {
  goals: Record<string, Goal[]>;
  settings: Record<string, Record<string, NotificationSettings>>;
  events: CalendarEvent[];
  now: dayjs.Dayjs;
  lastEventTime: dayjs.Dayjs;
}

function getAccountabilityState(now: dayjs.Dayjs, goals: GoalWithNotifications[], calendarEvents: CalendarEvent[]): AccountabilityLoopState {
  const result: AccountabilityLoopState = {
    goals: {},
    settings: {},
    events: calendarEvents,
    now,
    lastEventTime: dayjs().second(0),
  };
  for (const goal of goals) {
    const settings = goal.notifications;
    if (!settings) {
      throw new Error('Invariant: Settings not found');
    }
    if (!result.settings[goal.userId]) {
      result.settings[goal.userId] = {};
    }
    result.settings[goal.userId][goal.id] = settings;
    if (!result.goals[goal.userId]) {
      result.goals[goal.userId] = [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (goal as any).notifications;
    result.goals[goal.userId].push(goal);
  }
  return result;
}

function getNextEvents(logger: Logger, state: Jsonify<AccountabilityLoopState>): NotificationData<dayjs.Dayjs> {
  const result: NotificationData<dayjs.Dayjs> = {
    nextEventTime: null,
    data: [],
  };
  const now = dayjs(state.now).second(0);
  logger.info(`Considering ${state.events.length} events at ${now.format(DATE_TIME_FORMAT)}`);
  for (const event of state.events) {
    logger.info(`Considering event "${event.title}" for user ${event.userId} - ${dayjs(event.startTime).format(DATE_TIME_FORMAT)}: ${dayjs(event.endTime).format(DATE_TIME_FORMAT)}`);
    const userId = event.userId;
    if (!event.goalId) {
      throw new Error('Invariant: Goal ID not found in event');
    }
    if (!event.startTime) {
      throw new Error('Invariant: Start time not found in event');
    }
    if (!state.settings[userId]) {
      throw new Error('Invariant: Settings not found for user');
    }
    const settings = state.settings[userId][event.goalId];
    if (!settings) {
      throw new Error('Invariant: Settings not found');
    }
    if (!state.goals[userId]) {
      throw new Error('Invariant: Goals not found for user');
    }
    const goal = state.goals[userId].find(g => g.id === event.goalId);
    if (!goal) {
      throw new Error('Invariant: Goal not found in state');
    }
    const maxNotificationBefore = Math.max(settings.pushBefore ?? 0, settings.textBefore ?? 0, settings.phoneBefore ?? 0);
    const minNotificationAfter = Math.min(settings.pushAfter ?? Number.MAX_SAFE_INTEGER, settings.textAfter ?? Number.MAX_SAFE_INTEGER, settings.phoneAfter ?? Number.MAX_SAFE_INTEGER);
    const nextEventStart = dayjs(event.startTime).second(0).subtract(maxNotificationBefore, 'minutes');
    const nextEventEnd = dayjs(event.endTime).second(0).add(minNotificationAfter, 'minutes');
    const isAfterEvent = nextEventStart.isBefore(now);
    const nextEventTime = isAfterEvent ? nextEventEnd : nextEventStart;
    logger.info(`Next: ${nextEventTime.format(DATE_TIME_FORMAT)}`);
    if (!nextEventTime.isAfter(state.lastEventTime)) {
      continue;
    }
    if (result.nextEventTime === null) {
      result.nextEventTime = nextEventTime;
    }
    if (nextEventTime.isBefore(result.nextEventTime)) {
      // We've found a new event that's closer than the current one
      result.nextEventTime = nextEventTime;
      result.data = [];
    } else if (nextEventTime.isAfter(result.nextEventTime)) {
      // We've found an event that's after the current set, so we should exit and wait for the next event
      break;
    }
    result.data.push({
      goalId: event.goalId,
      event,
      settings,
      type: isAfterEvent ? 'after' : 'before',
      fireAt: nextEventTime.format(DATE_TIME_FORMAT),
    });
  }
  return result;
}

export const startAccountabilityLoop = inngest.createFunction({
  id: 'start-accountability-loop',
  concurrency: [{
    // One loop per environment
    scope: "env",
    key: "accountability",
    limit: 1,
  }],
  retries: 1,
}, {
  event: InngestEvent.StartAccountabilityLoop,
}, async ({ logger, step }) => {
  logger.info('Starting accountability loop');
  let i = 0;
  do {
    const state = await step.run(`get-accountability-state-${i}`, async () => {
      const now = dayjs();
      const prisma = await getPrismaClient();
      const userIds = await getUserIds(prisma);
      const goalsAndNotifications = await prisma.goal.findMany({
        where: {
          userId: {
            in: userIds,
          },
        },
        include: {
          notifications: true,
        },
      });
      const calendarEvents = await prisma.calendarEvent.findMany({
        where: {
          userId: {
            in: userIds,
          },
          endTime: {
            gte: now.toDate(),
          },
        },
        take: userIds.length * 2, // Two events per user in case of overlap
        orderBy: {
          startTime: 'asc',
        },
      });
      return getAccountabilityState(now, goalsAndNotifications, calendarEvents);
    });

    let j = 0;
    do {
      const nextEvents = getNextEvents(logger, state);
      if (nextEvents.data.length === 0) {
        logger.info(`No events found, so we're re-fetching state`);
        break;
      }
      if (nextEvents.data.length < j) {
        logger.info(`No upcoming events remaining after ${j} events, so we're re-fetching state`);
        break;
      }
      logger.info(`Waiting for events:\n${nextEvents.data.map(e => `${e.type} "${e.event.title}"\nfireAt: ${e.fireAt}\n${dayjs(e.event.startTime).format(DATE_TIME_FORMAT)} - ${dayjs(e.event.endTime).format(DATE_TIME_FORMAT)}`).join('\n')}`);
      let nextEventTime = nextEvents.nextEventTime;
      if (!nextEventTime) {
        nextEventTime = dayjs().add(1, 'day').second(0);
      }
      state.lastEventTime = nextEventTime.format(DATE_TIME_FORMAT);
      const sleepPromise = step.sleepUntil(`sleep-until-${i}-${j}`, nextEventTime.toDate());
      const updatePromise = step.waitForEvent(`wait-for-update-${i}-${j}`, {
        event: InngestEvent.ScheduleUpdated,
        timeout: '1d',
      });
      const stopPromise = step.waitForEvent(`wait-for-stop-${i}-${j}`, {
        event: InngestEvent.StopAccountabilityLoop,
        timeout: '1d',
      });

      const command = await Promise.race([stopPromise, updatePromise, sleepPromise]);
      j++;
      if (!command) {
        logger.info(`Accountability loop ${i}-${j} sleep finished`, nextEvents.data);
        const now = dayjs().second(0);
        state.now = now.format(DATE_TIME_FORMAT); // Reset now since we've slept
        logger.info(`Current time: ${state.now}`);
        logger.info(`Accountability next event time: ${nextEventTime.format(DATE_TIME_FORMAT)}`);
        if (now.diff(nextEventTime, 'minute') !== 0) {
          logger.info(`Accountability loop ${i}-${j} time is different, so we're not notifying`);
          continue;
        }
        logger.info(`Accountability loop ${i}-${j} time is the same, so we're notifying`);

        const sleepPromise = step.sleep(`one-minute-sleep-${i}-${j}`, 1);
        const payload: NotificationData<string> = {
          ...nextEvents,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          nextEventTime: nextEvents.nextEventTime!.format(DATE_TIME_FORMAT),
        }
        const data: InngestEventData[InngestEvent.CheckIn] = {
          name: InngestEvent.CheckIn,
          data: payload,
        };
        const sendNotificationsPromise = step.sendEvent(`send-notifications-${i}-${j}`, data);
        await Promise.all([sendNotificationsPromise, sleepPromise]);
        continue;
      }
      if (command.name === InngestEvent.StopAccountabilityLoop) {
        logger.info(`Accountability loop ${i}-${j} stopped`);
        return;
      }
      if (command.name === InngestEvent.ScheduleUpdated) {
        logger.info(`Accountability loop ${i}-${j} schedule updated`);
        break;
      }
      i++;
    // eslint-disable-next-line no-constant-condition
    } while (true);
  // eslint-disable-next-line no-constant-condition
  } while (true);
});
