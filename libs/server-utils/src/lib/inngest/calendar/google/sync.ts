import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { Logger } from "inngest/middleware/logger";

import { CalendarEvent, CalendarProvider, EventType, GoogleAuth, PrismaClient, UserProfile } from "@prisma/client";
import { dayjs, DATE_TIME_FORMAT, truncateText } from "@/shared/utils";
import { SerializableCalendarEvent } from "@/shared/zod";

import { getPrismaClient } from "../../../prisma/client";
import { inngestConsumer, InngestEvent, InngestEventData } from "../../client";
import { Jsonify } from "inngest/helpers/jsonify";

// Relevant docs:
// https://developers.google.com/calendar/api/guides/sync
// https://developers.google.com/calendar/api/v3/reference/events/list

interface CalendarEventResult {
  list: calendar_v3.Schema$Event[];
  nextPageToken?: string | null;
  nextSyncToken?: string | null;
}

interface CalendarEventsIterationResult {
  nextPageToken?: string | null | undefined;
  nextSyncToken?: string | null | undefined;
  calendarEvents?: SerializableCalendarEvent[];
  calendarEventsToDelete?: string[];
  freshGoogleAuth: Jsonify<GoogleAuth>;
  isFullSync: boolean;
}

type CalendarSyncAction = "refresh" | "full-sync";

export function getNextFullSync(lastFullSync: dayjs.Dayjs, timezone: string): dayjs.Dayjs {
  return lastFullSync.tz(timezone).day(7).hour(15).minute(30);
}

async function incrementalSyncCalendarEvents(
  logger: Logger,
  googleAuth: Jsonify<GoogleAuth>,
  calendar: calendar_v3.Calendar,
  pageToken: string | null | undefined,
  syncToken: string | null | undefined,
  profile: UserProfile,
): Promise<CalendarEventResult | CalendarSyncAction> {
  if (!googleAuth.lastFullSyncAt) {
    return "full-sync";
  }
  const lastFullSyncAt = dayjs.tz(googleAuth.lastFullSyncAt, profile.timezone);
  const nextSundayNight = getNextFullSync(lastFullSyncAt, profile.timezone);
  console.log(`lastFullSyncAt: ${lastFullSyncAt.format(DATE_TIME_FORMAT)}, nextSundayNight: ${nextSundayNight.format(DATE_TIME_FORMAT)}`);

  try {
    // Schedule a full sync on the next Sunday night when the user is going to sleep
    // TODO: Fire an event to archive the last week's events
    if (dayjs.tz(new Date(),profile.timezone).isAfter(nextSundayNight)) {
      return "full-sync";
    }
    const res = await calendar.events.list({
      calendarId: 'primary',
      singleEvents: true,
      pageToken: pageToken ?? undefined,
      syncToken: syncToken ?? undefined,
    });
    if (res.status === 401 || res.status === 403) {
      return "refresh";
    }
    if (res.status === 410) {
      return "full-sync";
    }
    if (!res.data.items) {
      logger.warn(`No items returned from Google calendar`);
    }
    return {
      list: res.data.items ?? [],
      nextPageToken: res.data.nextPageToken,
      nextSyncToken: res.data.nextSyncToken,
    };
  } catch (error) {
    logError(logger, "Failed to get calendar events during incremental sync", error);
    return "refresh";
  }
}

async function fullSyncCalendarEvents(
  logger: Logger,
  calendar: calendar_v3.Calendar,
  profile: UserProfile,
  pageToken?: string | null,
): Promise<CalendarEventResult | "refresh"> {
  try {
    // Sync events for the next 7 days
    const timeMin = dayjs().tz(profile.timezone).startOf('day').utc().toISOString();
    const timeMax = dayjs().tz(profile.timezone).day(7).endOf('day').utc().toISOString();
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      pageToken: pageToken ?? undefined,
    });
    if (res.status === 401 || res.status === 403) {
      return "refresh";
    }
    return {
      list: res.data.items ?? [],
      nextPageToken: res.data.nextPageToken,
      nextSyncToken: res.data.nextSyncToken,
    };
  } catch (error) {
    logError(logger, "Failed to get calendar events during full sync", error);
    return "refresh";
  }
}

async function saveFullSync(
  logger: Logger,
  prisma: PrismaClient,
  googleAuth: Jsonify<GoogleAuth>,
  nextSyncToken: string | null | undefined,
  eventsToSave: CalendarEvent[],
): Promise<Jsonify<GoogleAuth>> {
  const freshGoogleAuth = {
    ...googleAuth,
    calendarSyncToken: nextSyncToken ?? null,
    lastFullSyncAt: new Date(),
    hasSyncedBefore: true,
  }
  await prisma.$transaction(async (tx) => {
    logger.info(`Updating google auth ${googleAuth.userId} for full sync`);
    try {
      await tx.googleAuth.update({
        where: {
          id: googleAuth.id,
        },
        data: freshGoogleAuth,
      });
    } catch (error) {
      logError(logger, `Failed to update google auth ${googleAuth.userId} for full sync`, error);
      throw error;
    }
    logger.info(`Creating ${eventsToSave.length} calendar events`);
    try {
      await tx.calendarEvent.createMany({
        data: eventsToSave,
      });
    } catch (error) {
      logError(logger, "Failed to create calendar events", error);
      throw error;
    }
  });
  return {
    ...freshGoogleAuth,
    lastFullSyncAt: dayjs(freshGoogleAuth.lastFullSyncAt).format(DATE_TIME_FORMAT),
  };
}

async function saveIncrementalSync(
  logger: Logger,
  prisma: PrismaClient,
  googleAuth: Jsonify<GoogleAuth>,
  nextSyncToken: string | null | undefined,
  eventsToDelete: string[],
  eventsToSave: CalendarEvent[],
): Promise<Jsonify<GoogleAuth>> {
  const freshGoogleAuth = {
    ...googleAuth,
    lastFullSyncAt: googleAuth.lastFullSyncAt ? dayjs(googleAuth.lastFullSyncAt).toDate() : null,
    calendarSyncToken: nextSyncToken ?? null,
  }
  await prisma.$transaction(async (tx) => {
    logger.info(`Updating google auth ${googleAuth.userId} for incremental sync`);
    try {
      await tx.googleAuth.update({
        where: {
          id: googleAuth.id,
        },
        data: freshGoogleAuth,
      });
    } catch (error) {
      logError(logger, `Failed to update google auth ${googleAuth.userId} during incremental sync`, error);
      throw error;
    }
    for (const event of eventsToSave) {
      try {
        await tx.calendarEvent.upsert({
          where: { id: event.id },
          update: event,
          create: event,
        });
      } catch (error) {
        logError(logger, `Failed to upsert calendar event ${event.id}`, error);
        throw error;
      }
    }
    try {
      await tx.calendarEvent.deleteMany({
        where: { id: { in: eventsToDelete } },
      });
    } catch (error) {
      logError(logger, "Failed to delete calendar events", error);
      throw error;
    }
  });
  return {
    ...freshGoogleAuth,
    lastFullSyncAt: dayjs(freshGoogleAuth.lastFullSyncAt).format(DATE_TIME_FORMAT),
  };
}

export async function refreshGoogleAccessToken(logger: Logger, prisma: PrismaClient, googleAuth: Jsonify<GoogleAuth>, oauth2Client: OAuth2Client) {
  try {
    const newTokens = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(newTokens.credentials);
    if (!newTokens.credentials.access_token || !newTokens.credentials.refresh_token) {
      throw new Error('No access token or refresh token received from Google during refresh');
    }
    await prisma.googleAuth.update({
      where: {
        id: googleAuth.id,
      },
      data: {
        accessToken: newTokens.credentials.access_token,
        refreshToken: newTokens.credentials.refresh_token,
      },
    });
  } catch (error) {
    logError(logger, "Failed to refresh Google access token", error);
    throw error;
  }
}

function logError(logger: Logger, message: string, error: unknown) {
  logger.error(`${message}: ${error instanceof Error ? error.message : JSON.stringify(error, null, 2)}`);
}

function transformCalendarEvent(event: calendar_v3.Schema$Event, userId: string): CalendarEvent {
  const start = event.start?.dateTime ? dayjs.utc(event.start.dateTime) : null;
  const end = event.end?.dateTime ? dayjs.utc(event.end.dateTime) : null;
  return {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    id: event.id ?? event.iCalUID!,
    userId,
    title: event.summary ?? "External event",
    completed: 0,
    subtitle: null,
    description: event.description ?? null,
    location: event.location ?? null,
    duration: end ? end.diff(start, 'minutes') : null,
    startTime: start?.toDate() ?? null,
    endTime: end?.toDate() ?? null,
    timezone: event.start?.timeZone ?? null,
    eventType: event.eventType as EventType | undefined ?? EventType.default,
    locked: Boolean(event.locked),
    allDay: event.start?.date ? dayjs.utc(event.start.date).toDate() : event.end?.date ? dayjs.utc(event.end.date).toDate() : null,
    color: "#f8fafc",
    provider: CalendarProvider.google,
    goalId: null,
  }
}

export const getGoogleOAuth2Client = (googleAuth: Jsonify<GoogleAuth>) => {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CALENDAR_API_KEY is not set');
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not set');
  }
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET is not set');
  }
  const oauth2Client = new google.auth.OAuth2({
    apiKey,
    clientId,
    clientSecret,
    credentials: {
      access_token: googleAuth.accessToken,
      refresh_token: googleAuth.refreshToken,
      scope: 'email profile openid https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.settings.readonly',
    },
  });
  return oauth2Client;
}

async function deleteForFullSync(logger: Logger, prisma: PrismaClient, googleAuth: Jsonify<GoogleAuth>) {
  const freshGoogleAuth = {
    ...googleAuth,
    calendarSyncToken: null,
    lastFullSyncAt: null,
  }
  await prisma.$transaction(async (tx) => {
    try {
      await tx.googleAuth.update({
        where: {
          id: googleAuth.id,
        },
        data: freshGoogleAuth,
      });
    } catch (error) {
      logError(logger, `Failed to update google auth ${googleAuth.userId} for full sync during delete`, error);
      throw error;
    }
    await deleteCalendarEvents(logger, tx as PrismaClient, googleAuth);
  });
  return freshGoogleAuth;
}

async function deleteCalendarEvents(logger: Logger, tx: PrismaClient, googleAuth: Jsonify<GoogleAuth>) {
  const now = new Date();
  try {
    await tx.calendarEvent.deleteMany({
      where: {
        userId: googleAuth.userId,
        OR: [
          { startTime: { gt: now } },
          { allDay: { gt: now } },
        ],
      },
    });
  } catch (error) {
    logError(logger, `Failed to delete calendar events for user ${googleAuth.userId} during full sync`, error);
    throw error;
  }
}

export const syncGoogleCalendar = inngestConsumer.createFunction(
  {
    id: 'google-calendar-sync',
    concurrency: [{
      // global concurrency queue for this function,
      // limit to 5 concurrent syncs as per the free tier quota
      scope: "fn",
      key: `"google-calendar-sync"`,
      limit: 5,
    }, {
      // virtual concurrency queue for this function,
      // only one sync per user at a time
      scope: "fn",
      key: "event.data.userId",
      limit: 1,
    }],
    retries: 1,
  },
  [{
    event: InngestEvent.GoogleCalendarSync,
  }, {
    event: InngestEvent.GoogleCalendarCronSync,
  }],
  async ({ step, event, logger }) => {
    const { profile, googleAuth, forceFullSync } = event.data;
    const prisma = await getPrismaClient(googleAuth.userId);
    let freshGoogleAuth = await step.run(`get-google-auth`, async () => {
      return await prisma.googleAuth.findUniqueOrThrow({
        where: {
          id: googleAuth.id,
          userId: googleAuth.userId,
        },
      });
    });
    const oauth2Client = getGoogleOAuth2Client(freshGoogleAuth);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    let cursor: string | null | undefined = undefined;
    let nextSyncToken: string | null | undefined = freshGoogleAuth.calendarSyncToken;
    const calendarEvents: SerializableCalendarEvent[] = [];
    const calendarEventsToDelete: string[] = [];
    const initialSync = !freshGoogleAuth.hasSyncedBefore;
    let isFullSync = Boolean(initialSync || forceFullSync);
    let index = 0;
    do {
      logger.info(`Google auth calendar sync token: ${truncateText(freshGoogleAuth.calendarSyncToken ?? 'null', 5)}, last full sync at: ${freshGoogleAuth.lastFullSyncAt}`);
      logger.info(`Syncing calendar events...\n- full sync: ${isFullSync}\n- initial sync: ${initialSync}`);
      // eslint-disable-next-line no-loop-func
      const stepResult: CalendarEventsIterationResult = await step.run(`download-calendar-list-${index++}`, async () => {
        if (forceFullSync && index === 1) {
          logger.info(`Force full sync for user ${freshGoogleAuth.userId}, deleting all events...`);
          await deleteCalendarEvents(logger, prisma, freshGoogleAuth);
        }
        if (isFullSync) {
          if (index === 1) {
            logger.info(`Starting full sync...`);
          } else {
            logger.info(`Continuing full sync...`);
          }
          const res = await fullSyncCalendarEvents(logger, calendar, profile, cursor);
          if (res === "refresh") {
            logger.info(`Google access token expired, refreshing...`);
            await refreshGoogleAccessToken(logger, prisma, freshGoogleAuth, oauth2Client);
            throw new Error(`Google access token refreshed, retrying...`);
          }
          const events = res.list.map(event => transformCalendarEvent(event, freshGoogleAuth.userId));
          logger.info(`Saving ${events.length} events for full sync`);
          const gAuth = await saveFullSync(logger, prisma, freshGoogleAuth, res.nextSyncToken, events);
          return {
            nextPageToken: res.nextPageToken,
            nextSyncToken: res.nextSyncToken,
            calendarEvents: events,
            calendarEventsToDelete: [],
            freshGoogleAuth: gAuth,
            isFullSync: true,
          };
        } else {
          if (index === 1) {
            logger.info(`Starting incremental sync...`);
          } else {
            logger.info(`Continuing incremental sync...`);
          }
          const res = await incrementalSyncCalendarEvents(logger, freshGoogleAuth, calendar, cursor, nextSyncToken, profile);
          if (res === "refresh") {
            logger.info(`Google access token expired, refreshing...`);
            await refreshGoogleAccessToken(logger, prisma, freshGoogleAuth, oauth2Client);
            throw new Error(`Google access token refreshed, retrying...`);
          }
          if (res === "full-sync") {
            logger.info(`Full sync required, deleting all events...`);
            const gAuth = await deleteForFullSync(logger, prisma, freshGoogleAuth);
            return {
              nextPageToken: undefined,
              nextSyncToken: undefined,
              freshGoogleAuth: gAuth,
              isFullSync: true,
            };
          }
          const events: CalendarEvent[] = [];
          const deletedEvents: string[] = [];
          for (const event of res.list) {
            if (event.status === 'cancelled') {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              deletedEvents.push(event.id ?? event.iCalUID!);
            } else {
              events.push(transformCalendarEvent(event, freshGoogleAuth.userId));
            }
          }
          logger.info(`Saving ${events.length} events for incremental sync`);
          logger.info(`Deleting ${deletedEvents.length} events for incremental sync`);
          const gAuth = await saveIncrementalSync(logger, prisma, freshGoogleAuth, res.nextSyncToken, deletedEvents, events);
          return {
            nextPageToken: res.nextPageToken,
            nextSyncToken: res.nextSyncToken,
            calendarEvents: events,
            calendarEventsToDelete: deletedEvents,
            freshGoogleAuth: gAuth,
            isFullSync: false,
          };
        }
      });
      isFullSync = stepResult.isFullSync;
      freshGoogleAuth = stepResult.freshGoogleAuth;
      cursor = stepResult.nextPageToken;
      nextSyncToken = stepResult.nextSyncToken;
      if (stepResult.calendarEvents) {
        calendarEvents.push(...stepResult.calendarEvents);
      }
      if (stepResult.calendarEventsToDelete) {
        calendarEventsToDelete.push(...stepResult.calendarEventsToDelete);
      }
    } while (!nextSyncToken);

    if (initialSync) {
      // If it's initial sync, there are no goals yet, so we can skip scheduling
      logger.info(`Initial sync for user ${googleAuth.userId}, skipping scheduling`);
      return;
    }
    if (isFullSync) {
      await step.sendEvent("full-sync-goal-scheduling", {
        name: InngestEvent.ScheduleGoalEvents,
        data: {
          userId: googleAuth.userId,
        },
      });
    } else {
      // TODO: If the events have changed or there are new events, we need to schedule goal events again
    }
    await step.sendEvent("sync-events-to-client", {
      name: InngestEvent.SyncToClient,
      data: {
        userId: googleAuth.userId,
        calendarEvents,
        calendarEventsToDelete,
      },
    });
  },
);

export const syncCalendars = inngestConsumer.createFunction(
  {
    id: "sync-all-calendars",
    concurrency: [{
      scope: "account",
      key: "sync-all-calendars",
      limit: 1,
    }],
  },
  {
    // sync every 60 minutes from 6am to 10pm EST
    cron: 'TZ=America/New_York 0/60 6-22 * * *',
  },
  async ({ step }) => {
    const prisma = await getPrismaClient();
    const googleAuths = await prisma.googleAuth.findMany();
    const profiles = await prisma.userProfile.findMany();
    const googleAuthsAndProfiles = googleAuths.map(googleAuth => {
      const profile = profiles.find(profile => profile.userId === googleAuth.userId);
      if (!profile) {
        throw new Error(`Profile not found during cron sync for user ${googleAuth.userId}`);
      }
      return { googleAuth, profile };
    });
    const events: InngestEventData[InngestEvent.GoogleCalendarCronSync][] = googleAuthsAndProfiles.map(({ googleAuth, profile }) => ({
      name: InngestEvent.GoogleCalendarCronSync,
      data: {
        profile,
        googleAuth,
      },
    }));
    await step.sendEvent("sync-all-calendars", events);
  },
);
