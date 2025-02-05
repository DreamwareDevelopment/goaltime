import { Milestone } from '@prisma/client';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { MilestoneViewEnum } from '../../schemas';

const c = initContract();

export const milestonesContract = c.router({
  getMilestones: {
    method: 'GET',
    path: `/api/milestones`,
    query: z.object({
      goalId: z.string().uuid(),
      userId: z.string().uuid(),
      view: MilestoneViewEnum,
    }),
    responses: {
      200: c.type<Milestone[]>(),
      401: c.type<{ error: string }>(),
      403: c.type<{ error: string }>(),
      404: c.type<{ error: string }>(),
    },
    summary: 'Get the milestones for a goal under the given view',
  },
})
