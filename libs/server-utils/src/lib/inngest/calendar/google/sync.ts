import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

import { CalendarEvent, CalendarProvider, EventType, GoogleAuth, PrismaClient } from "@prisma/client";

import { getPrismaClient } from "../../../prisma/client";
import { inngest, InngestEvent } from "../../client";

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

async function getCalendarEvents(calendar: calendar_v3.Calendar, pageToken?: string, syncToken?: string): Promise<CalendarEventResult | CalendarSyncAction> {
  try {
    // TODO: Schedule a sync 13 days in the future, should store the last full sync date in the db.
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: syncToken ? undefined : new Date().toISOString(),
      timeMax: syncToken ? undefined : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      pageToken,
      syncToken,
    });
    if (res.status === 401 || res.status === 403) {
      return "refresh";
    }
    if (res.status === 410) {
      return "full-sync";
    }
    return {
      list: res.data.items ?? [],
      nextPageToken: res.data.nextPageToken,
      nextSyncToken: res.data.nextSyncToken,
    };
  } catch (error) {
    console.error('Failed to get calendar events:', JSON.stringify(error, null, 2));
    return "refresh";
  }
}

export async function refreshGoogleAccessToken(prisma: PrismaClient, googleAuth: GoogleAuth, oauth2Client: OAuth2Client) {
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
    console.error('Failed to refresh Google access token:', JSON.stringify(error, null, 2));
    throw error;
  }
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
    startTime: event.start?.dateTime ?? null,
    endTime: event.end?.dateTime ?? null,
    timeZone: event.start?.timeZone ?? null,
    eventType: event.eventType as EventType | undefined ?? EventType.default,
    locked: Boolean(event.locked),
    allDay: event.start?.date ?? event.end?.date ?? null,
    color: "#f8fafc",
    provider: CalendarProvider.google,
  }
}

async function saveCalendarEvents(prisma: PrismaClient, googleAuth: GoogleAuth, isFullSync: boolean, nextSyncToken: string | null | undefined, eventsToDelete: string[], eventsToSave: CalendarEvent[]) {
  await prisma.$transaction(async (tx) => {
    console.log(`Updating google auth ${googleAuth.userId}`);
    try {
      await tx.googleAuth.update({
        where: {
          id: googleAuth.id,
        },
        data: {
          calendarSyncToken: nextSyncToken,
        },
      });
    } catch (error) {
      console.error(`Failed to update google auth ${googleAuth.userId}:`, JSON.stringify(error, null, 2));
      throw error;
    }
    if (isFullSync) {
      console.log(`Creating ${eventsToSave.length} calendar events`);
      try {
        await tx.calendarEvent.createMany({
          data: eventsToSave,
        });
      } catch (error) {
        console.error('Failed to create calendar events:', JSON.stringify(error, null, 2));
        throw error;
      }
    } else {
      console.log(`Upserting ${eventsToSave.length} calendar events`);
      for (const event of eventsToSave) {
        try {
          await tx.calendarEvent.upsert({
            where: { id: event.id },
            update: event,
            create: event,
          });
        } catch (error) {
          console.error(`Failed to upsert calendar event ${event.id}:`, JSON.stringify(error, null, 2));
          throw error;
        }
      }
    }
  });
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

async function deleteUserCalendarEvents(prisma: PrismaClient, googleAuth: GoogleAuth) {
  await prisma.$transaction(async (tx) => {
    await tx.googleAuth.update({
      where: {
        id: googleAuth.id,
      },
      data: {
        calendarSyncToken: null,
      },
    });
    await tx.calendarEvent.deleteMany({
      where: {
        userId: googleAuth.userId,
      },
    });
  });
}

export const syncGoogleCalendar = inngest.createFunction(
  {
    id: 'google-calendar-init',
    concurrency: 0,
    retries: 1,
  },
  {
    event: InngestEvent.GoogleCalendarSync,
  },
  async ({ step, event }) => {
    const googleAuth = event.data;
    const prisma = await getPrismaClient(googleAuth.userId);
    const oauth2Client = getGoogleOAuth2Client(googleAuth);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
    let cursor: string | null | undefined = undefined;
    let nextSyncToken: string | null | undefined = googleAuth.calendarSyncToken;
    let isFullSync = !nextSyncToken;
    let index = 0;
    do {
      // eslint-disable-next-line no-loop-func
      const eventsResult: CalendarEventsIterationResult = await step.run(`download-calendar-list-${index++}`, async () => {
        const eventsResult = await getCalendarEvents(calendar, cursor ?? undefined, nextSyncToken ?? undefined);
        const deletedEvents: string[] = [];
        const events: CalendarEvent[] = [];
        if (eventsResult === "refresh") {
          await refreshGoogleAccessToken(prisma, googleAuth, oauth2Client);
          throw new Error(`Google access token refreshed`);
        }
        if (eventsResult === "full-sync") {
          await deleteUserCalendarEvents(prisma, googleAuth);
          isFullSync = true;
          return {
            nextPageToken: undefined,
            nextSyncToken: undefined,
            events,
            eventsToDelete: deletedEvents,
          };
        }
        for (const event of eventsResult.list) {
          if (event.status === 'cancelled') {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            deletedEvents.push(event.id ?? event.iCalUID!);
          } else {
            events.push(transformCalendarEvent(event, googleAuth.userId));
          }
        }
        await saveCalendarEvents(prisma, googleAuth, isFullSync, nextSyncToken, deletedEvents, events);
        return {
          nextPageToken: eventsResult.nextPageToken,
          nextSyncToken: eventsResult.nextSyncToken,
          events,
          eventsToDelete: deletedEvents,
        };
      });
      cursor = eventsResult.nextPageToken;
      nextSyncToken = eventsResult.nextSyncToken;
    } while (!nextSyncToken);
  },
);
