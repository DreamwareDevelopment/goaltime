import { proxy } from 'valtio'

import { CalendarEventInput } from "@/shared/zod"
import { CalendarEvent } from '@prisma/client'
import { deleteCalendarEventAction, updateCalendarEventAction, updateCalendarEventColorsAction } from '../../../app/actions/calendar'
import { binarySearchInsert, DATE_TIME_FORMAT, dayjs } from '@/libs/shared/src'
import { getTsRestClient } from '@/libs/ui-components/src/hooks/ts-rest'
import { goalStore } from './goals'

export const calendarStore = proxy<{
  events: Record<string, CalendarEvent[]>,
  init(events: CalendarEvent[]): void,
  ensureCalendarEvents(date: Date): void,
  loadCalendarEvents(date: Date, timezone: string): Promise<void>,
  updateCalendarEvent(original: CalendarEvent, updated: CalendarEventInput): Promise<void>,
  updateEventColors(goalId: string, color: string): Promise<void>,
  deleteCalendarEvent(event: CalendarEvent): Promise<void>,
  setCalendarEvents(events: CalendarEvent[], eventsToDelete: string[]): void,
}>({
  events: {},
  init(events: CalendarEvent[]) {
    const today = dayjs().toDate().toDateString();
    calendarStore.events[today] = events;
    console.log(`${events.length} Calendar events initialized for ${today}`)
  },
  ensureCalendarEvents(date: Date) {
    if (!calendarStore.events[dayjs(date).toDate().toDateString()]) {
      calendarStore.events[dayjs(date).toDate().toDateString()] = []
    }
  },
  async loadCalendarEvents(date: Date, timezone: string) {
    const day = date.toDateString()
    console.log(`Loading calendar events for ${dayjs(date).format(DATE_TIME_FORMAT)}`)
    if (calendarStore.events[day] && calendarStore.events[day].length > 0) {
      console.log(`${calendarStore.events[day].length} Calendar events already loaded for ${day}`)
      return;
    }
    const client = getTsRestClient();
    const response = await client.calendar.getSchedule({
      query: {
        date,
        timezone,
      }
    });
    const { body, status } = response;
    if (status === 200) {
      calendarStore.events[day] = body;
      console.log(`${body.length} Calendar events loaded for ${day}`)
    } else if (status === 404) {
      const errorMessage = response.body.error;
      throw new Error(errorMessage);
    }
  },
  async updateCalendarEvent(original, updated) {
    const day = original.startTime ? dayjs(original.startTime).toDate().toDateString() : dayjs(original.allDay).toDate().toDateString()
    if (!calendarStore.events[day]) {
      throw new Error(`Invariant: day: ${day} not initialized in calendarStore`)
    }
    const originalIndex = calendarStore.events[day].findIndex(e => e.id === original.id)
    if (originalIndex === -1) {
      throw new Error(`Invariant: event not found in calendarStore`)
    }
    calendarStore.events[day].splice(originalIndex, 1)
    const newIndex = original.allDay ? originalIndex : binarySearchInsert(calendarStore.events[day], { ...original, ...updated }, (a, b) => {
      if (!a.startTime || !b.startTime) {
        return !a.startTime ? -1 : 1
      }
      return dayjs(a.startTime).diff(dayjs(b.startTime))
    })
    const updatedEvent = await updateCalendarEventAction(original, updated)
    calendarStore.events[day].splice(newIndex, 1, updatedEvent)
  },
  async deleteCalendarEvent(event) {
    const day = event.startTime ? dayjs(event.startTime).toDate().toDateString() : dayjs(event.allDay).toDate().toDateString()
    if (!calendarStore.events[day]) {
      throw new Error(`Invariant: day: ${day} not initialized in calendarStore`)
    }
    const index = calendarStore.events[day].findIndex(e => e.id === event.id)
    if (index === -1) {
      throw new Error(`Invariant: event not found in calendarStore`)
    }
    calendarStore.events[day].splice(index, 1)
    await deleteCalendarEventAction(event.id, event.userId)
  },
  async updateEventColors(goalId: string, color: string) {
    const eventIdsToUpdate: string[] = []
    let userId: string | null = null;
    for (const day of Object.keys(calendarStore.events)) {
      const events = calendarStore.events[day];
      for (const event of events) {
        if (event.goalId === goalId) {
          event.color = color;
          eventIdsToUpdate.push(event.id);
          userId = event.userId;
        }
      }
    }
    if (userId === null) {
      return; // No events to update
    }
    await updateCalendarEventColorsAction(userId, eventIdsToUpdate, color)
  },
  setCalendarEvents(events: CalendarEvent[], eventsToDelete: string[]) {
    if (eventsToDelete.length > 0) {
      // TODO: Improve performance of this
      for (const day of Object.keys(calendarStore.events)) {
        for (const event of eventsToDelete) {
          const index = calendarStore.events[day].findIndex(e => e.id === event);
          if (index > -1) {
            calendarStore.events[day].splice(index, 1);
          }
        }
      }
    }
    const goalAggregates: Record<string, number> = {};
    for (const event of events) {
      const eventTime = dayjs(event.startTime || event.allDay);
      const eventDate = eventTime.toDate();
      if (!event.allDay && event.goalId && event.duration) {
        goalAggregates[event.goalId] = (goalAggregates[event.goalId] ?? 0) + event.duration;
      }
      const eventDateString = eventDate.toDateString();
      if (!(eventDateString in calendarStore.events)) {
        continue;
      }
      const existingEvents = calendarStore.events[eventDateString];
      const existingEventIndex = existingEvents.findIndex((e) => e.id === event.id);
      if (existingEventIndex > -1) {
        existingEvents.splice(existingEventIndex, 1, event);
      } else {
        if (event.allDay) {
          existingEvents.unshift(event);
        } else {
          binarySearchInsert(existingEvents, event, (a, b) => {
            if (!a?.startTime || !b?.startTime) {
              return !a?.startTime ? -1 : 1;
            }
            return dayjs(a.startTime).diff(dayjs(b.startTime));
          });
        }
      }
    }
    if (goalStore.goalAggregates) {
      goalStore.goalAggregates = {
        ...goalStore.goalAggregates,
        ...goalAggregates,
      }
    }
  },
})

