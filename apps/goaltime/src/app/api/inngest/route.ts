import { serve } from "inngest/next";
import { checkIn, inngest, postEvent, preEvent, scheduleGoalEvents, syncCalendars, syncGoogleCalendar } from "@/server-utils/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scheduleGoalEvents, syncGoogleCalendar, syncCalendars, checkIn, preEvent, postEvent],
});
