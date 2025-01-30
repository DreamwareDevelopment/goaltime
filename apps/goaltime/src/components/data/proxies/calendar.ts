import { proxy } from 'valtio'

import { CalendarEventInput } from "@/shared/zod"
import { CalendarEvent } from '@prisma/client'
import { deleteCalendarEventAction, updateCalendarEventAction, updateCalendarEventColorsAction } from '../../../app/actions/calendar'
import { binarySearchInsert, DATE_FORMAT, DATE_TIME_FORMAT, dayjs } from '@/libs/shared/src'
import { getTsRestClient } from '@/libs/ui-components/src/hooks/ts-rest'
import { goalStore } from './goals'
import { getTokenInfo, refreshTokenIfNeeded } from '@/libs/ui-components/src/hooks/supabase'

export const calendarStore = proxy<{
  events: Record<string, CalendarEvent[]>,
  init(events: CalendarEvent[]): void,
  ensureCalendarEvents(date: string): void,
  loadCalendarEvents(date: dayjs.Dayjs, timezone: string): Promise<void>,
  updateCalendarEvent(original: CalendarEvent, updated: CalendarEventInput): Promise<void>,
  updateEventColors(goalId: string, color: string): Promise<void>,
  deleteCalendarEvent(event: CalendarEvent): Promise<void>,
  setCalendarEvents(events: CalendarEvent[], eventsToDelete: string[]): void,
}>({
  events: {},
  init(events: CalendarEvent[]) {
    const today = dayjs().format(DATE_FORMAT);
    calendarStore.events[today] = events;
    console.log(`${events.length} Calendar events initialized for ${today}`)
  },
  ensureCalendarEvents(date: string) {
    if (!calendarStore.events[date]) {
      calendarStore.events[date] = []
    }
  },
  async loadCalendarEvents(day: dayjs.Dayjs, timezone: string) {
    const dayString = day.format(DATE_FORMAT);
    console.log(`Loading calendar events for ${day.format(DATE_TIME_FORMAT)}`)
    if (calendarStore.events[dayString] && calendarStore.events[dayString].length > 0) {
      console.log(`${calendarStore.events[dayString].length} Calendar events already loaded for ${dayString}`)
      return;
    }
    let tokenInfo = await getTokenInfo();
    let client = await getTsRestClient(tokenInfo);
    let response = await client.calendar.getSchedule({
      query: {
        date: day.toDate(),
        timezone,
      }
    });
    if (response.status === 401 || response.status === 403) {
      tokenInfo = await refreshTokenIfNeeded(tokenInfo);
      client = await getTsRestClient(tokenInfo);
      response = await client.calendar.getSchedule({
        query: {
          date: day.toDate(),
          timezone,
        }
      });
    }
    const { body, status } = response;
    if (status === 200) {
      calendarStore.events[dayString] = body;
      console.log(`${body.length} Calendar events loaded for ${day}`)
    } else if (status === 404) {
      console.error(`Calendar events not found for ${dayString}`)
      const errorMessage = response.body.error;
      throw new Error(errorMessage);
    } else {
      throw new Error(`Unexpected status code: ${status}`)
    }
  },
  async updateCalendarEvent(original, updated) {
    const dayString = original.startTime ? dayjs(original.startTime).format(DATE_FORMAT) : dayjs(original.allDay).format(DATE_FORMAT)
    if (!calendarStore.events[dayString]) {
      throw new Error(`Invariant: day: ${dayString} not initialized in calendarStore`)
    }
    const originalIndex = calendarStore.events[dayString].findIndex(e => e.id === original.id)
    if (originalIndex === -1) {
      throw new Error(`Invariant: event not found in calendarStore`)
    }
    calendarStore.events[dayString].splice(originalIndex, 1)
    const newIndex = original.allDay ? originalIndex : binarySearchInsert(calendarStore.events[dayString], { ...original, ...updated }, (a, b) => {
      if (!a.startTime || !b.startTime) {
        return !a.startTime ? -1 : 1
      }
      return dayjs(a.startTime).diff(dayjs(b.startTime))
    })
    const updatedEvent = await updateCalendarEventAction(original, updated)
    calendarStore.events[dayString].splice(newIndex, 1, updatedEvent)
  },
  async deleteCalendarEvent(event) {
    const dayString = event.startTime ? dayjs(event.startTime).format(DATE_FORMAT) : dayjs(event.allDay).format(DATE_FORMAT)
    if (!calendarStore.events[dayString]) {
      throw new Error(`Invariant: day: ${dayString} not initialized in calendarStore`)
    }
    const index = calendarStore.events[dayString].findIndex(e => e.id === event.id)
    if (index === -1) {
      throw new Error(`Invariant: event not found in calendarStore`)
    }
    calendarStore.events[dayString].splice(index, 1)
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
      const eventDateString = dayjs(eventDate).format(DATE_FORMAT);
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

