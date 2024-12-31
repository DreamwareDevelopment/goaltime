import { Jsonify } from "inngest/helpers/jsonify";
import { CalendarEvent } from "@prisma/client";
import { dayjs } from "../utils";

export type SerializableCalendarEvent = Jsonify<CalendarEvent>;

export interface SyncEvent {
  userId: string;
  calendarEvents?: SerializableCalendarEvent[];
  calendarEventsToDelete?: string[];
}

export function deserializeCalendarEvents(events: SerializableCalendarEvent[]): CalendarEvent[] {
  return events.map(event => ({
    ...event,
    startTime: event.startTime ? dayjs.utc(event.startTime).toDate() : null,
    endTime: event.endTime ? dayjs.utc(event.endTime).toDate() : null,
    allDay: event.allDay ? dayjs.utc(event.allDay).toDate() : null,
  }));
}
