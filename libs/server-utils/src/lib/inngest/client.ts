import { EventSchemas, GetEvents, Inngest } from "inngest";
import { GoogleAuth, UserProfile } from "@prisma/client";

import type { AccountabilityEvent } from "./agents";
import type { SyncEvent } from "@/shared/zod";

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
        profile: UserProfile;
        googleAuth: GoogleAuth;
        forceFullSync?: true;
      }
    };
    [InngestEvent.GoogleCalendarCronSync]: {
      data: {
        profile: UserProfile;
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
      data: SyncEvent;
    };
  }>()
});

export type InngestEventData = GetEvents<typeof inngest>
