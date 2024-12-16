import { serve } from "inngest/next";
import { inngest, initGoogleCalendar } from "@/server-utils/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [initGoogleCalendar],
});
