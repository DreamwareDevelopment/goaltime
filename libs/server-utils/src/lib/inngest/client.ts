import { EventSchemas, GetEvents, Inngest } from "inngest";
import { CalendarEvent, GoogleAuth, UserProfile } from "@prisma/client";

import type { NotificationData } from "@/shared/utils";
import type { SyncEvent } from "@/shared/zod";
import { Jsonify } from "inngest/helpers/jsonify";

export enum InngestEvent {
  StartAccountabilityLoop = "accountability/loop/start",
  StopAccountabilityLoop = "accountability/loop/stop",
  ScheduleUpdated = "accountability/schedule-updated",
  SyncToClient = "streaming/sync",
  GoogleCalendarSync = "calendar/google/sync",
  GoogleCalendarCronSync = "calendar/google/sync/cron",
  ScheduleGoalEvents = "calendar/scheduling",
  CheckIn = "agents/accountability/check-in",
  PreEvent = "agents/accountability/pre-event",
  PostEvent = "agents/accountability/post-event",
  NewUser = "marketing/new-user",
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
      data: NotificationData<string>;
    };
    [InngestEvent.PreEvent]: {
      data: NotificationData<string>;
    };
    [InngestEvent.PostEvent]: {
      data: NotificationData<string>;
    };
    [InngestEvent.StartAccountabilityLoop]: {
      data: never;
    };
    [InngestEvent.StopAccountabilityLoop]: {
      data: never;
    };
    [InngestEvent.ScheduleUpdated]: {
      data: {
        userId: string;
        schedule: Jsonify<CalendarEvent[]>;
      };
    };
    [InngestEvent.ScheduleGoalEvents]: {
      data: {
        userId: string;
      };
    };
    [InngestEvent.SyncToClient]: {
      data: SyncEvent;
    };
    [InngestEvent.NewUser]: {
      data: never;
    };
  }>()
});

export type InngestEventData = GetEvents<typeof inngest>
