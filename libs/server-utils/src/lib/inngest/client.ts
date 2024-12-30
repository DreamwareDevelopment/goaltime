import { EventSchemas, GetEvents, Inngest } from "inngest";
import { CalendarEvent, GoogleAuth } from "@prisma/client";

import type { AccountabilityEvent } from "./agents";

export enum InngestEvent {
  SyncToClient = "streaming/sync",
  GoogleCalendarSync = "calendar/google/sync",
  GoogleCalendarCronSync = "calendar/google/sync/cron",
  ScheduleGoalEvents = "calendar/scheduling",
  CheckIn = "agents/accountability/check-in",
  PreEvent = "agents/accountability/pre-event",
  PostEvent = "agents/accountability/post-event",
}

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "goaltime",
  schemas: new EventSchemas().fromRecord<{
    [InngestEvent.GoogleCalendarSync]: {
      data: {
        googleAuth: GoogleAuth;
        forceFullSync?: true;
      }
    };
    [InngestEvent.GoogleCalendarCronSync]: {
      data: {
        googleAuth: GoogleAuth;
        forceFullSync?: undefined;
      }
    };
    [InngestEvent.CheckIn]: {
      data: AccountabilityEvent;
    };
    [InngestEvent.PreEvent]: {
      data: AccountabilityEvent;
    };
    [InngestEvent.PostEvent]: {
      data: AccountabilityEvent;
    };
    [InngestEvent.ScheduleGoalEvents]: {
      data: {
        userId: string;
      };
    };
    [InngestEvent.SyncToClient]: {
      data: {
        userId: string;
        calendarEvents?: CalendarEvent[];
      };
    };
  }>()
});

export type InngestEventData = GetEvents<typeof inngest>
