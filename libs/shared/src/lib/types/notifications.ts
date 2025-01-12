import { CalendarEvent, NotificationSettings } from "@prisma/client";
import { Jsonify } from "inngest/helpers/jsonify";

export interface NotificationPayload {
  goalId: string;
  event: Jsonify<CalendarEvent>;
  settings: Jsonify<NotificationSettings>;
  fireAt: string;
  type: 'before' | 'after';
}

export interface NotificationData<T> {
  nextEventTime: T | null;
  data: NotificationPayload[];
}
