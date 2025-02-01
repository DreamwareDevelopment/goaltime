import { CalendarEvent } from '@prisma/client';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const calendarContract = c.router({
  getSchedule: {
    method: 'GET',
    path: `/api/schedule`,
    query: z.object({
      /** The date in the user\'s timezone to get the schedule for */
      date: z.coerce.date(),
    }),
    responses: {
      200: c.type<CalendarEvent[]>(),
      404: c.type<{ error: string }>(),
    },
    summary: 'Get the schedule for a user at a given date',
  },
})
