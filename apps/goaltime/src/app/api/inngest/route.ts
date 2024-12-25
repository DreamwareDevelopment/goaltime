import { serve } from "inngest/next";
import { checkIn, inngest, postEvent, preEvent, syncGoogleCalendar } from "@/server-utils/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncGoogleCalendar, checkIn, preEvent, postEvent],
});
