'use server'

import { inngest, InngestEvent } from "@/libs/server-utils/src/lib/inngest";
import { getPrismaClient } from "@/server-utils/prisma";
import { CalendarEventInput } from "@/shared/zod";
import { CalendarEvent, GoogleAuth, UserProfile } from "@prisma/client";

export async function updateCalendarEventAction(original: CalendarEvent, updated: CalendarEventInput): Promise<CalendarEvent> {
  const prisma = await getPrismaClient(original.userId)
  const updatedEvent = await prisma.calendarEvent.update({
    where: { id: original.id, userId: original.userId },
    data: updated,
  })
  return updatedEvent
}

export async function updateCalendarEventColorsAction(userId: string, eventIds: string[], color: string): Promise<void> {
  const prisma = await getPrismaClient(userId)
  await prisma.calendarEvent.updateMany({ where: { id: { in: eventIds }, userId }, data: { color } })
}

export async function deleteCalendarEventAction(eventId: string, userId: string): Promise<void> {
  const prisma = await getPrismaClient(userId)
  await prisma.calendarEvent.delete({ where: { id: eventId, userId } })
}

export async function syncCalendarAction(userId: string): Promise<void> {
  const prisma = await getPrismaClient(userId)
  const googleAuth = await prisma.googleAuth.findUnique({ where: { userId } })
  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  if (!googleAuth || !profile) {
    throw new Error('Google auth or profile not found')
  }
  await inngest.send({
    name: InngestEvent.GoogleCalendarSync,
    data: {
      googleAuth,
      profile,
    },
  })
}

export async function fullSyncCalendarAction(profile: UserProfile, googleAuth: GoogleAuth) {
  googleAuth.lastFullSyncAt = null;
  googleAuth.calendarSyncToken = null;
  await inngest.send({
    name: InngestEvent.GoogleCalendarSync,
    data: {
      profile,
      googleAuth,
      forceFullSync: true,
    },
  })
}
