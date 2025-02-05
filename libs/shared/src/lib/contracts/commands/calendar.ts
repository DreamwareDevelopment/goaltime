import { initContract } from '@ts-rest/core';
import z from 'zod';

const c = initContract();

export const calendarCommandContract = c.router({
  linkEventToGoal: {
    method: 'POST',
    path: `/api/calendar/event/link`,
    body: z.object({
      id: z.string(),
      goalId: z.string().nullable(),
      linkFutureEvents: z.boolean().optional(),
    }),
    responses: {
      200: c.type<{ success: true }>(),
      401: c.type<{ error: string }>(),
      403: c.type<{ error: string }>(),
      404: c.type<{ error: string }>(),
    },
    summary: 'Link an event to a goal',
  },
})
