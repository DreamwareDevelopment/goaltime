import { EventSchemas, GetEvents, Inngest } from "inngest";
import { CalendarEvent, GoogleAuth, UserProfile } from "@prisma/client";

import type { NotificationData, NotificationPayload, SanitizedUser } from "@/shared/utils";
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
  IncomingSMS = "incoming/sms",
  Chat = "agents/accountability/chat",
  CheckIn = "agents/accountability/check-in",
  NewUser = "marketing/new-user",
}

export const inngestConsumer = new Inngest({
  id: "goaltime-websocket-server",
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
    [InngestEvent.Chat]: {
      data: {
        userId: string;
        message?: string;
        notification?: NotificationPayload<string>;
      };
    };
    [InngestEvent.IncomingSMS]: {
      data: {
        from: string;
        message: string;
        userId: string;
      };
    };
    [InngestEvent.CheckIn]: {
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
      data: {
        user: SanitizedUser;
        profile: UserProfile;
      };
    };
  }>()
});

export const inngestProducer = new Inngest({
  id: "goaltime-next",
  schemas: new EventSchemas().fromRecord<{
    [InngestEvent.GoogleCalendarSync]: {
      data: {
        profile: UserProfile;
        googleAuth: GoogleAuth;
        forceFullSync?: true;
      }
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
    [InngestEvent.NewUser]: {
      data: {
        user: SanitizedUser;
        profile: UserProfile;
      };
    };
  }>()
});

export type InngestEventData = GetEvents<typeof inngestConsumer>
