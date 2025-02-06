import { CalendarEvent, CalendarProvider, User } from "@prisma/client";
// import { Jsonify } from 'inngest/helpers/jsonify';

import { DATE_TIME_FORMAT, dayjs } from "@/shared/utils";

import { getPrismaClient } from '../lib/prisma/client';
import { GoalEvent, Interval } from "@/shared/utils";
// import { inngestConsumer, InngestEvent } from "../lib/inngest/client";

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
  const scheduleData = schedule.map(({ goalId, start, end }) => {
    const utcOffset = Math.abs(start.tz(timezone).utcOffset())
    // console.log(`UTC Offset: ${utcOffset}`)
    // console.log(`Start: ${start.format(DATE_TIME_FORMAT)}`)
    // console.log(`Start UTC: ${start.utc().add(utcOffset, 'minutes').format(DATE_TIME_FORMAT)}`)
    // console.log(`End: ${end.format(DATE_TIME_FORMAT)}`)
    // console.log(`End UTC: ${end.utc().add(utcOffset, 'minutes').format(DATE_TIME_FORMAT)}`)
    // I have no idea why, but the interval is in the timezone of the user in dev, but not in prod.
    const startUTC = process.env.NODE_ENV !== 'development' ? start.utc().add(utcOffset, 'minutes').toDate() : start.utc().toDate()
    const endUTC = process.env.NODE_ENV !== 'development' ? end.utc().add(utcOffset, 'minutes').toDate() : end.utc().toDate()
    return {
      id: crypto.randomUUID(),
      userId,
      goalId,
      provider: CalendarProvider.goaltime,
      duration: end.diff(start, 'minutes'),
      startTime: startUTC,
      endTime: endUTC,
      title: goalMap[goalId].title,
      description: goalMap[goalId].description,
      color: goalMap[goalId].color,
      timezone,
    }
  });
  await prisma.calendarEvent.createMany({
    data: scheduleData,
  });
  return scheduleData as CalendarEvent[];
}

export async function linkEventToGoal(
  userId: User['id'],
  eventId: string,
  goalId: string | null,
  linkFutureEvents = false,
): Promise<void> {
  console.log(`Linking user ${userId} event ${eventId} to goal ${goalId} with linkFutureEvents: ${linkFutureEvents}`)
  const prisma = await getPrismaClient(userId);
  let goal = goalId ? await prisma.goal.findUnique({
    where: { id: goalId, userId },
  }) : null;
  const originalEvent = await prisma.calendarEvent.findUnique({
    where: { id: eventId, userId },
  });
  const event = await prisma.calendarEvent.update({
    where: { id: eventId, userId },
    data: { goalId, color: goal?.color ?? undefined },
  });
  // TODO: Doing it this way means we're not updating the goal completed time for all events with the same title
  // To do so we'd have to first find all the events with the same title that are within the current sync time range
  // in order to get the correct duration to add/subtract.
  await prisma.calendarEvent.updateMany({
    where: {
      userId,
      title: event.title,
    },
    data: { goalId },
  });
  if (goalId) {
    console.log(`Adding ${(event.duration ?? 0) / 60} hours to goal ${goalId} with completed: ${goal?.completed}`)
    await prisma.goal.update({
      where: { id: goalId, userId },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        completed: goal!.completed + (event.duration ?? 0) / 60,
      },
    });
    console.log(`Updated goal ${goalId} to have completed: ${goal?.completed}`)
  } else {
    console.log(`Original event: ${JSON.stringify(originalEvent)}`)
    if (originalEvent?.goalId) {
      goal = await prisma.goal.findUnique({
        where: { id: originalEvent.goalId, userId },
      });
      console.log(`Removing ${(originalEvent.duration ?? 0) / 60} hours from goal ${originalEvent.goalId} with completed: ${goal?.completed}`)
      goal = await prisma.goal.update({
        where: { id: originalEvent.goalId, userId },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data: { completed: goal!.completed - (originalEvent.duration ?? 0) / 60 },
      });
      console.log(`Updated goal ${originalEvent.goalId} to have completed: ${goal?.completed}`)
    }
  }
  // TODO: This is hard to do because the timezone issue in production
  // await inngestConsumer.send({
  //   id: `sync-link-event-to-goal-${eventId}-${goalId}`,
  //   name: InngestEvent.SyncToClient,
  //   data: {
  //     userId,
  //     calendarEvents: [{
  //       ...event,
  //       startTime: dayjs(event.startTime).format(DATE_TIME_FORMAT),
  //       endTime: dayjs(event.endTime).format(DATE_TIME_FORMAT),
  //       allDay: event.allDay ? dayjs(event.allDay).format(DATE_TIME_FORMAT) : null,
  //     }],
  //     goals: goal ? [{
  //       ...goal,
  //       createdAt: dayjs(goal.createdAt).format(DATE_TIME_FORMAT),
  //       updatedAt: dayjs(goal.updatedAt).format(DATE_TIME_FORMAT),
  //       deadline: goal.deadline ? dayjs(goal.deadline).format(DATE_TIME_FORMAT) : null,
  //     } as Jsonify<Goal>] : [],
  //   },
  // });
  if (linkFutureEvents || !goalId) {
    await prisma.linkedCalendarEvent.upsert({
      where: {
        eventId,
        userId,
      },
      update: {
        goalId,
        eventTitle: event.title,
      },
      create: {
        eventTitle: event.title,
        eventId,
        goalId,
        userId,
      },
    });
  }
  console.log(`Updated user ${userId} event ${eventId} to have goalId ${goalId}`)
}

export async function deleteGoalEvents(userId: User['id'], interval: Interval<string>, timezone: string): Promise<string[]> {
  const utcOffset = Math.abs(dayjs(interval.start).tz(timezone).utcOffset())
  const offsetStart = dayjs(interval.start).subtract(1, 'hour').utc() // This is a hack to ensure that goal events scheduled during the current user session are removed.
  const end = dayjs(interval.end).utc()
  const adjustedInterval = {
    start: process.env.NODE_ENV !== 'development' ? offsetStart.add(utcOffset, 'minutes') : offsetStart,
    end: process.env.NODE_ENV !== 'development' ? end.add(utcOffset, 'minutes') : end,
  }
  console.log(`Deleting goal events between: ${adjustedInterval.start.format(DATE_TIME_FORMAT)} - ${adjustedInterval.end.format(DATE_TIME_FORMAT)}`)
  const prisma = await getPrismaClient(userId);
  const idsToDelete = await prisma.calendarEvent.findMany({
    where: {
      userId,
      goalId: {
        not: null,
      },
      startTime: {
        gte: adjustedInterval.start.toDate(),
        lte: adjustedInterval.end.toDate(),
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