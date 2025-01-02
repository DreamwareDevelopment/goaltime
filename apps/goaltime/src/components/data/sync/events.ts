import { deserializeCalendarEvents, SyncEvent } from "@/shared/zod";
import { calendarStore } from "../proxies/calendar";

export function processSyncEvent(event: SyncEvent) {
  const { userId, calendarEvents, calendarEventsToDelete } = event;
  console.log(`Processing ${calendarEvents?.length} sync event(s) for ${userId}`);
  if (calendarEvents) {
    const deserializedCalendarEvents = deserializeCalendarEvents(calendarEvents);
    calendarStore.setCalendarEvents(deserializedCalendarEvents, calendarEventsToDelete ?? []);
  }
}
