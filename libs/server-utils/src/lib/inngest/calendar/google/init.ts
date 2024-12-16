import { inngest, InngestEvent } from "../../client";

export const initGoogleCalendar = inngest.createFunction(
  {
    id: 'google-calendar-init',
    concurrency: 0,
  },
  {
    event: InngestEvent.GoogleCalendarInit,
  },
  async ({ step, event }) => {
    const googleAuth = event.data;
    console.log(googleAuth);
    await step.sleep("TODO", "2s");
  }
);
