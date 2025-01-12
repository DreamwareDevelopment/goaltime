import { CalendarEvent, Goal, NotificationSettings } from "@prisma/client";
import { Jsonify } from "inngest/helpers/jsonify";

export enum NotificationDestination {
  Push = 'push',
  SMS = 'sms',
  Phone = 'phone',
  Email = 'email',
}

export enum NotificationType {
  Before = 'before',
  After = 'after',
}

export interface NotificationTimes<T> {
  fireAt: T;
  destination: NotificationDestination;
  type: NotificationType;
}

export interface NotificationPayload<T> extends NotificationTimes<T> {
  goal: Jsonify<Goal>;
  event: Jsonify<CalendarEvent>;
  settings: Jsonify<NotificationSettings>;
}

export interface NotificationData<T> {
  nextEventTime: T | null;
  data: NotificationPayload<T>[];
}
