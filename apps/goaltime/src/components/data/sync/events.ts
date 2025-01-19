import { deserializeCalendarEvents, deserializeGoals, SyncEvent } from "@/shared/zod";
import { calendarStore } from "../proxies/calendar";
import { goalStore } from "../proxies/goals";

export function processSyncEvent(event: SyncEvent) {
  const { userId, calendarEvents, calendarEventsToDelete, goals } = event;
  const eventCount = (calendarEvents?.length ?? 0) + (calendarEventsToDelete?.length ?? 0) + (goals?.length ?? 0);
  console.log(`Processing ${eventCount} sync event(s) for ${userId}`);
  if (calendarEvents) {
    const deserializedCalendarEvents = deserializeCalendarEvents(calendarEvents);
    calendarStore.setCalendarEvents(deserializedCalendarEvents, calendarEventsToDelete ?? []);
  }
  if (goals) {
    const deserializedGoals = deserializeGoals(goals);
    goalStore.setGoals(deserializedGoals);
  }
}
