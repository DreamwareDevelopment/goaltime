import { serve } from "inngest/next";
import { checkIn, inngest, postEvent, preEvent, syncCalendars, syncGoogleCalendar } from "@/server-utils/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncGoogleCalendar, syncCalendars, checkIn, preEvent, postEvent],
});
