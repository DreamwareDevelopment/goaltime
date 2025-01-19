import { inngest, InngestEvent, InngestEventData } from "@/server-utils/inngest";
import { getPrismaClient } from "@/server-utils/prisma";
import { getUserIds } from "@/server-utils/queries/user";
import { MAX_NOTIFICATION_EVENT_OFFSET } from "@/shared/zod";
import { dayjs, DATE_TIME_FORMAT, GoalWithNotifications, NotificationData, NotificationDestination, NotificationType, NotificationTimes } from "@/shared/utils";
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
    const { notifications, minimumTime } = getNextEventTimes(logger, now, settings, event);
    if (result.nextEventTime !== null && minimumTime !== null) {
      if (minimumTime.isAfter(result.nextEventTime)) {
        logger.info(`Minimum time is after the next event time, so we're done`);
        break;
      } else if (minimumTime.isBefore(result.nextEventTime)) {
        logger.info(`Minimum time is before the next event time, do nothing`);
      } else {
        logger.info(`Adding a new event to the batch`);
      }
    }
    if (notifications.length > 0) {
      logger.info(`Notifications:\n${notifications.map(n => `${n.fireAt.format(DATE_TIME_FORMAT)} ${n.destination} ${n.type}`).join('\n')}`);
    }
    for (const notification of notifications) {
      if (notification.fireAt.isBefore(now)) {
        // This event has already fired, so we can skip it
        logger.info(`Skipping event already fired "${event.title}" for user ${event.userId} - ${dayjs(event.startTime).format(DATE_TIME_FORMAT)}: ${dayjs(event.endTime).format(DATE_TIME_FORMAT)}`);
        continue;
      }
      if (!notification.fireAt.isAfter(state.lastEventTime)) {
        // This event is before the last event time, so we can skip it
        continue;
      }
      if (result.nextEventTime === null) {
        // This is the first event we've found, so we set it as the next event time
        result.nextEventTime = notification.fireAt;
      }
      if (notification.fireAt.isBefore(result.nextEventTime)) {
        // We've found a new event that's closer than the current one
        result.nextEventTime = notification.fireAt;
        logger.warn(`Found a new event that's closer than the current one, resetting the results:\n${result.data.map(e => `${e.type} "${e.event.title}"\nfireAt: ${dayjs(e.fireAt).format(DATE_TIME_FORMAT)}\nEvent time: ${dayjs(e.event.startTime).format(DATE_TIME_FORMAT)} - ${dayjs(e.event.endTime).format(DATE_TIME_FORMAT)}`).join('\n')}\nTo ${notification.type} "${goal.title}"\nfireAt: ${dayjs(notification.fireAt).format(DATE_TIME_FORMAT)}\nEvent time: ${dayjs(event.startTime).format(DATE_TIME_FORMAT)} - ${dayjs(event.endTime).format(DATE_TIME_FORMAT)}`);
        result.data = [];
      } else if (notification.fireAt.isAfter(result.nextEventTime)) {
        // We've found an event that's after the current set. Since the notifications are sorted we should exit the inner loop
        break;
      }
      result.data.push({
        goal,
        event,
        settings,
        ...notification,
      });
    }
  }
  return result;
}

function getNextEventTimes(
  logger: Logger,
  now: dayjs.Dayjs,
  settings: NotificationSettings,
  event: Jsonify<CalendarEvent>,
): {
  minimumTime: dayjs.Dayjs | null,
  notifications: NotificationTimes<dayjs.Dayjs>[]
} {
  const eventStart = dayjs(event.startTime);
  const eventEnd = dayjs(event.endTime);
  const result: NotificationTimes<dayjs.Dayjs>[] = [];
  let minimumTime: dayjs.Dayjs | null = null;
  let fireAt = settings.pushBefore ? eventStart.subtract(settings.pushBefore, 'minutes') : null;
  if (settings.pushBefore && fireAt !== null && now.isBefore(fireAt)) {
    result.push({
      fireAt,
      destination: NotificationDestination.Push,
      type: NotificationType.Before,
    });
    minimumTime = fireAt;
  }
  fireAt = settings.pushAfter ? eventEnd.add(settings.pushAfter, 'minutes') : null;
  if (settings.pushAfter && fireAt !== null && now.isBefore(fireAt)) {
    result.push({
      fireAt,
      destination: NotificationDestination.Push,
      type: NotificationType.After,
    });
    if (minimumTime === null || fireAt.isBefore(minimumTime)) {
      minimumTime = fireAt;
    }
  }
  fireAt = settings.textBefore ? eventStart.subtract(settings.textBefore, 'minutes') : null;
  if (settings.textBefore && fireAt !== null && now.isBefore(fireAt)) {
    result.push({
      fireAt,
      destination: NotificationDestination.SMS,
      type: NotificationType.Before,
    });
    if (minimumTime === null || fireAt.isBefore(minimumTime)) {
      minimumTime = fireAt;
    }
  }
  fireAt = settings.textAfter ? eventEnd.add(settings.textAfter, 'minutes') : null;
  if (settings.textAfter && fireAt !== null && now.isBefore(fireAt)) {
    result.push({
      fireAt,
      destination: NotificationDestination.SMS,
      type: NotificationType.After,
    });
    if (minimumTime === null || fireAt.isBefore(minimumTime)) {
      minimumTime = fireAt;
    }
  }
  fireAt = settings.phoneBefore ? eventStart.subtract(settings.phoneBefore, 'minutes') : null;
  if (settings.phoneBefore && fireAt !== null && now.isBefore(fireAt)) {
    result.push({
      fireAt,
      destination: NotificationDestination.Phone,
      type: NotificationType.Before,
    });
    if (minimumTime === null || fireAt.isBefore(minimumTime)) {
      minimumTime = fireAt;
    }
  }
  fireAt = settings.phoneAfter ? eventEnd.add(settings.phoneAfter, 'minutes') : null;
  if (settings.phoneAfter && fireAt !== null && now.isBefore(fireAt)) {
    result.push({
      fireAt,
      destination: NotificationDestination.Phone,
      type: NotificationType.After,
    });
    if (minimumTime === null || fireAt.isBefore(minimumTime)) {
      minimumTime = fireAt;
    }
  }
  if (minimumTime === null) {
    logger.info('Notification times are empty, likely because the event is too far in the past');
  }
  return {
    minimumTime: minimumTime?.second(0) ?? null,
    notifications: result.sort((a, b) => a.fireAt.diff(b.fireAt)),
  };
}

export const startAccountabilityLoop = inngest.createFunction({
  id: 'start-accountability-loop',
  concurrency: [{
    // One loop per environment
    scope: "env",
    key: "accountability",
    limit: 1,
  }],
  retries: 20,
  cancelOn: [
    {
      event: InngestEvent.StopAccountabilityLoop,
    },
  ],
}, {
  event: InngestEvent.StartAccountabilityLoop,
}, async ({ logger, step }) => {
  logger.info('Starting accountability loop');
  let i = 0;
  do {
    const state = await step.run(`get-accountability-state-${i}`, async () => {
      logger.info(`Getting accountability state ${i}`);
      const now = dayjs().second(0);
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
            gte: now.subtract(MAX_NOTIFICATION_EVENT_OFFSET, 'minutes').toDate(), // The max notification offset is 1 hour
            lte: now.add(1, 'day').toDate(),
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
      const state = getAccountabilityState(now, goalsAndNotifications, calendarEvents);
      logger.info(`Got ${calendarEvents.length} calendar events`);
      return state;
    });

    let j = 0;
    do {
      const nextEvents = getNextEvents(logger, state);
      if (nextEvents.data.length === 0) {
        // This can cause a tight loop if there are no new events from the db in the next iteration, be rare in production
        // as long as we have customers with events in the db.
        // So sleep until the schedule is updated or a day passes
        logger.info(`No events found, so we wait for the schedule to be updated or a day to pass`);
        await step.waitForEvent(`no-events-wait-for-update-${i}-${j}`, {
          event: InngestEvent.ScheduleUpdated,
          timeout: '1d',
        });
        break;
      }
      if (nextEvents.data.length < j) {
        logger.info(`No upcoming events remaining after ${j} events, so we're re-fetching state`);
        break;
      }
      logger.info(`Waiting to send notifications:\n${nextEvents.data.map(e => `${e.type} "${e.event.title}"\nfireAt: ${dayjs(e.fireAt).format(DATE_TIME_FORMAT)}\nEvent time: ${dayjs(e.event.startTime).format(DATE_TIME_FORMAT)} - ${dayjs(e.event.endTime).format(DATE_TIME_FORMAT)}`).join('\n')}`);
      let nextEventTime = nextEvents.nextEventTime;
      if (!nextEventTime) {
        nextEventTime = dayjs().add(1, 'day').second(0);
      }
      logger.info(`Next event time: ${nextEventTime.format(DATE_TIME_FORMAT)}`);
      state.lastEventTime = nextEventTime.format(DATE_TIME_FORMAT);
      const sleepPromise = step.sleepUntil(`sleep-until-${i}-${j}`, nextEventTime.toDate());
      const updatePromise = step.waitForEvent(`wait-for-update-${i}-${j}`, {
        event: InngestEvent.ScheduleUpdated,
        timeout: '1d',
      });

      const command = await Promise.race([updatePromise, sleepPromise]);
      j++;
      if (!command) {
        logger.info(`Accountability loop ${i}-${j} sleep finished`, nextEvents.data);
        let now = dayjs().second(0);
        logger.info(`Current time: ${now}`);
        logger.info(`Accountability next event time: ${nextEventTime.format(DATE_TIME_FORMAT)}`);
        if (now.diff(nextEventTime, 'minute') !== 0) {
          logger.info(`Accountability loop ${i}-${j} time is different, so we're not notifying`);
          state.now = now.format(DATE_TIME_FORMAT); // Reset now since we've slept
          continue;
        }

        logger.info(`Sending notifications:\n${nextEvents.data.map(e => `${e.type} "${e.event.title}"\nfireAt: ${e.fireAt}\n${dayjs(e.event.startTime).format(DATE_TIME_FORMAT)} - ${dayjs(e.event.endTime).format(DATE_TIME_FORMAT)}`).join('\n')}`);
        const sleepPromise = step.sleep(`one-minute-sleep-${i}-${j}`, 1);
        const payload: NotificationData<string> = {
          data: nextEvents.data.map(e => ({
            ...e,
            fireAt: e.fireAt.format(DATE_TIME_FORMAT),
          })),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          nextEventTime: nextEvents.nextEventTime!.format(DATE_TIME_FORMAT),
        }
        const data: InngestEventData[InngestEvent.CheckIn] = {
          name: InngestEvent.CheckIn,
          data: payload,
        };
        const sendNotificationsPromise = step.sendEvent(`send-notifications-${i}-${j}`, data);
        await Promise.all([sendNotificationsPromise, sleepPromise]);
        now = dayjs().second(0);
        state.now = now.format(DATE_TIME_FORMAT); // Reset now since we've slept
        continue;
      }
      if (command.name === InngestEvent.ScheduleUpdated) {
        logger.info(`Accountability loop ${i}-${j} schedule updated`);
        break;
      }
      // eslint-disable-next-line no-constant-condition
    } while (true);
    i++;
  // eslint-disable-next-line no-constant-condition
  } while (true);
});
