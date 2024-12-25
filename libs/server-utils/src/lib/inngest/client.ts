import { EventSchemas, GetEvents, Inngest } from "inngest";
import { GoogleAuth } from "@prisma/client";

import type { AccountabilityEvent } from "./agents";

export enum InngestEvent {
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
      data: GoogleAuth;
    };
    [InngestEvent.GoogleCalendarCronSync]: {
      data: GoogleAuth;
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
  }>()
});

export type InngestEventData = GetEvents<typeof inngest>
