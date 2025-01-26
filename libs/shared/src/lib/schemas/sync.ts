import { Jsonify } from "inngest/helpers/jsonify";
import { CalendarEvent, Goal, UserProfile } from "@prisma/client";
import { dayjs } from "../utils";

export type SerializableCalendarEvent = Jsonify<CalendarEvent>;

export interface SyncEvent {
  userId: string;
  goals?: Jsonify<Goal>[];
  calendarEvents?: SerializableCalendarEvent[];
  calendarEventsToDelete?: string[];
  profile?: Jsonify<Partial<UserProfile>>;
}

export function deserializeCalendarEvents(events: SerializableCalendarEvent[]): CalendarEvent[] {
  return events.map(event => ({
    ...event,
    startTime: event.startTime ? dayjs.utc(event.startTime).toDate() : null,
    endTime: event.endTime ? dayjs.utc(event.endTime).toDate() : null,
    allDay: event.allDay ? dayjs.utc(event.allDay).toDate() : null,
  }));
}

export function deserializeGoals(goals: Jsonify<Goal>[]): Goal[] {
  return goals.map(goal => ({
    ...goal,
    deadline: goal.deadline ? dayjs(goal.deadline).toDate() : null,
    createdAt: dayjs(goal.createdAt).toDate(),
    updatedAt: dayjs(goal.updatedAt).toDate(),
  }));
}
