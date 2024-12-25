import { getSchedulingData } from "libs/server-utils/src/queries/calendar";
import { inngest, InngestEvent } from "../client";

export const scheduleGoalEvents = inngest.createFunction(
  {
    id: "schedule-goal-events",
    concurrency: [{
      scope: "fn",
      key: "event.data.userId",
      limit: 1,
    }],
    debounce: {
      key: "event.data.userId",
      period: '5m',
    },
    retries: 3,
  },
  [{
    event: InngestEvent.ScheduleGoalEvents,
  }],
  async ({ step, event }) => {
    const { userId } = event.data;
    const { goals, profile, schedule, start, end } = await step.run('get-scheduling-data', async () => {
      return await getSchedulingData(userId);
    });
  }
)
