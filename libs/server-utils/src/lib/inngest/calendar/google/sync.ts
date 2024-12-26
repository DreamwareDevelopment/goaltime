import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

import { CalendarEvent, CalendarProvider, EventType, GoogleAuth, PrismaClient } from "@prisma/client";

import { getPrismaClient } from "../../../prisma/client";
import { inngest, InngestEvent, InngestEventData } from "../../client";
import { Logger } from "inngest/middleware/logger";
import { dayjs } from "@/shared/utils";

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
}

type CalendarSyncAction = "refresh" | "full-sync";

async function incrementalSyncCalendarEvents(
  logger: Logger,
  googleAuth: GoogleAuth,
  calendar: calendar_v3.Calendar,
  pageToken: string | null | undefined,
  syncToken: string | null | undefined,
): Promise<CalendarEventResult | CalendarSyncAction> {
  if (!googleAuth.lastFullSyncAt) {
    throw new Error(`Invariant error: Google auth ${googleAuth.userId} has no last full sync date during incremental sync`);
  }
  const lastFullSyncAt = new Date(googleAuth.lastFullSyncAt);
  try {
    // Schedule a full sync 6 days in the future
    if ((new Date().getTime() - lastFullSyncAt.getTime()) > 6 * 24 * 60 * 60 * 1000) {
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
  pageToken?: string | null,
): Promise<CalendarEventResult | "refresh"> {
  try {
    // Sync events for the next 7 days
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

async function saveFullSync(logger: Logger, prisma: PrismaClient, googleAuth: GoogleAuth, nextSyncToken: string | null | undefined, eventsToSave: CalendarEvent[]) {
  await prisma.$transaction(async (tx) => {
    logger.info(`Updating google auth ${googleAuth.userId} for full sync`);
    try {
      await tx.googleAuth.update({
        where: {
          id: googleAuth.id,
        },
        data: {
          calendarSyncToken: nextSyncToken ?? null,
          lastFullSyncAt: new Date(),
        },
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
}

async function saveIncrementalSync(logger: Logger, prisma: PrismaClient, googleAuth: GoogleAuth, nextSyncToken: string | null | undefined, eventsToDelete: string[], eventsToSave: CalendarEvent[]) {
  await prisma.$transaction(async (tx) => {
    logger.info(`Updating google auth ${googleAuth.userId} for incremental sync`);
    try {
      await tx.googleAuth.update({
        where: {
          id: googleAuth.id,
        },
        data: {
          calendarSyncToken: nextSyncToken ?? null,
        },
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
}

export async function refreshGoogleAccessToken(logger: Logger, prisma: PrismaClient, googleAuth: GoogleAuth, oauth2Client: OAuth2Client) {
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
  return {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    id: event.id ?? event.iCalUID!,
    userId,
    title: event.summary ?? "External event",
    subtitle: null,
    description: event.description ?? null,
    location: event.location ?? null,
    startTime: event.start?.dateTime ? dayjs.utc(event.start.dateTime).toDate() : null,
    endTime: event.end?.dateTime ? dayjs.utc(event.end.dateTime).toDate() : null,
    timeZone: event.start?.timeZone ?? null,
    eventType: event.eventType as EventType | undefined ?? EventType.default,
    locked: Boolean(event.locked),
    allDay: event.start?.date ? dayjs.utc(event.start.date).toDate() : event.end?.date ? dayjs.utc(event.end.date).toDate() : null,
    color: "#f8fafc",
    provider: CalendarProvider.google,
    goalId: null,
  }
}

export const getGoogleOAuth2Client = (googleAuth: GoogleAuth) => {
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

async function deleteForFullSync(logger: Logger, prisma: PrismaClient, googleAuth: GoogleAuth) {
  await prisma.$transaction(async (tx) => {
    try {
      await tx.googleAuth.update({
        where: {
          id: googleAuth.id,
        },
        data: {
          calendarSyncToken: null,
        },
      });
    } catch (error) {
      logError(logger, `Failed to update google auth ${googleAuth.userId} for full sync during delete`, error);
      throw error;
    }
    try {
      await tx.calendarEvent.deleteMany({
        where: {
          userId: googleAuth.userId,
        },
      });
    } catch (error) {
      logError(logger, `Failed to delete calendar events for user ${googleAuth.userId} during full sync`, error);
      throw error;
    }
  });
}

export async function fullSyncCalendar(googleAuth: GoogleAuth) {
  googleAuth.lastFullSyncAt = null;
  googleAuth.calendarSyncToken = null;
  await inngest.send({
    name: InngestEvent.GoogleCalendarSync,
    data: {
      googleAuth,
      forceFullSync: true,
    },
  })
}

export const syncGoogleCalendar = inngest.createFunction(
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
    const { googleAuth, forceFullSync } = event.data;
    const prisma = await getPrismaClient(googleAuth.userId);
    const oauth2Client = getGoogleOAuth2Client(googleAuth);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    let cursor: string | null | undefined = undefined;
    let nextSyncToken: string | null | undefined = googleAuth.calendarSyncToken;
    const initialSync = !googleAuth.calendarSyncToken && !forceFullSync;
    let isFullSync = initialSync || forceFullSync;
    let index = 0;
    do {
      // eslint-disable-next-line no-loop-func
      const stepResult: CalendarEventsIterationResult = await step.run(`download-calendar-list-${index++}`, async () => {
        if (forceFullSync && index === 1) {
          logger.info(`Force full sync for user ${googleAuth.userId}, deleting all events...`);
          await deleteForFullSync(logger, prisma, googleAuth);
        }
        if (isFullSync) {
          if (index === 1) {
            logger.info(`Starting full sync...`);
          } else {
            logger.info(`Continuing full sync...`);
          }
          const res = await fullSyncCalendarEvents(logger, calendar, cursor);
          if (res === "refresh") {
            logger.info(`Google access token expired, refreshing...`);
            await refreshGoogleAccessToken(logger, prisma, googleAuth, oauth2Client);
            throw new Error(`Google access token refreshed, retrying...`);
          }
          const events = res.list.map(event => transformCalendarEvent(event, googleAuth.userId));
          logger.info(`Saving ${events.length} events for full sync`);
          await saveFullSync(logger, prisma, googleAuth, res.nextSyncToken, events);
          return {
            nextPageToken: res.nextPageToken,
            nextSyncToken: res.nextSyncToken,
          };
        } else {
          if (index === 1) {
            logger.info(`Starting incremental sync...`);
          } else {
            logger.info(`Continuing incremental sync...`);
          }
          const res = await incrementalSyncCalendarEvents(logger, googleAuth, calendar, cursor, nextSyncToken);
          if (res === "refresh") {
            logger.info(`Google access token expired, refreshing...`);
            await refreshGoogleAccessToken(logger, prisma, googleAuth, oauth2Client);
            throw new Error(`Google access token refreshed, retrying...`);
          }
          if (res === "full-sync") {
            logger.info(`Full sync required, deleting all events...`);
            await deleteForFullSync(logger, prisma, googleAuth);
            isFullSync = true;
            return {
              nextPageToken: undefined,
              nextSyncToken: undefined,
            };
          }
          const events: CalendarEvent[] = [];
          const deletedEvents: string[] = [];
          for (const event of res.list) {
            if (event.status === 'cancelled') {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              deletedEvents.push(event.id ?? event.iCalUID!);
            } else {
              events.push(transformCalendarEvent(event, googleAuth.userId));
            }
          }
          logger.info(`Saving ${events.length} events for incremental sync`);
          logger.info(`Deleting ${deletedEvents.length} events for incremental sync`);
          await saveIncrementalSync(logger, prisma, googleAuth, res.nextSyncToken, deletedEvents, events);
          return {
            nextPageToken: res.nextPageToken,
            nextSyncToken: res.nextSyncToken,
          };
        }
      });
      cursor = stepResult.nextPageToken;
      nextSyncToken = stepResult.nextSyncToken;
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
  },
);

export const syncCalendars = inngest.createFunction(
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
    const events: InngestEventData[InngestEvent.GoogleCalendarCronSync][] = googleAuths.map(googleAuth => ({
      name: InngestEvent.GoogleCalendarCronSync,
      data: {
        googleAuth,
      },
    }));
    await step.sendEvent("sync-all-calendars", events);
  },
);
