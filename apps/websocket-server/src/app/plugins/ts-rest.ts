import { initServer } from '@ts-rest/fastify';

import { baseContract } from '@/shared/contracts';
import { dayjs } from '@/shared/utils';
import { getProfile } from '@/server-utils/queries/user';
import { getSchedule } from '@/server-utils/queries/calendar';
import { getMilestones } from '@/server-utils/queries/milestones';
import { FastifyRequest } from 'fastify';
import { User } from '@supabase/supabase-js';

const server = initServer();

function getUser(request: FastifyRequest): User {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (request as any).supabaseUser as User;
}

export default server.plugin(server.router(baseContract, {
  calendar: {
    getSchedule: async (args) => {
      const user = getUser(args.request);
      const profile = await getProfile(user.id);
      if (!profile) {
        console.error('Profile not found during getSchedule');
        return {
          status: 404,
          body: { error: 'Profile not found' },
        };
      }
      // Use the timezone sent from the client so that events are filtered by the correct timezone's day
      const timezone = args.query.timezone;
      const day = dayjs.tz(args.query.date, timezone);
      const schedule = await getSchedule(profile, day);
      return {
        status: 200,
        body: schedule,
      };
    },
  },
  milestones: {
    getMilestones: async (args) => {
      const milestones = await getMilestones(args.query.goalId, args.query.userId, args.query.view)
      return {
        status: 200,
        body: milestones,
      };
    },
  },
}));
