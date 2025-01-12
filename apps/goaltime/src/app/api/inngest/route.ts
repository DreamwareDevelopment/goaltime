import { serve } from "inngest/next";
import { inngest, scheduleGoalEvents, syncCalendars, syncGoogleCalendar } from "@/server-utils/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scheduleGoalEvents, syncGoogleCalendar, syncCalendars],
});
