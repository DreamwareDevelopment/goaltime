import { EventSchemas, Inngest } from "inngest";
import { GoogleAuth } from "@/shared/models";

export enum InngestEvent {
  GoogleCalendarInit = "calendar/google/init",
}

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "goaltime",
  schemas: new EventSchemas().fromRecord<{
    [InngestEvent.GoogleCalendarInit]: {
      data: GoogleAuth;
    };
  }>()
});
