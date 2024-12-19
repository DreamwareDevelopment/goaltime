import { createNextHandler } from '@ts-rest/serverless/next';

import { baseContract } from '@/shared/contracts';
import { dayjs } from '@/shared/utils';
import { getProfile, getSanitizedUser } from '@/server-utils/queries/user';
import { getSchedule } from '@/server-utils/queries/calendar';
import { getMilestones } from '@/server-utils/queries/milestones';

const handler = createNextHandler(baseContract, {
  calendar: {
    getSchedule: async (args) => {
      const user = await getSanitizedUser();
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
      const schedule = await getSchedule(user.id, day, timezone);
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
}, {
  jsonQuery: true,
  responseValidation: true,
  handlerType: 'app-router',
},);

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
};
