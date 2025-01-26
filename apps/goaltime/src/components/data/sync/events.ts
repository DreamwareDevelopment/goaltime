import { deserializeCalendarEvents, deserializeGoals, SyncEvent } from "@/shared/zod";
import { calendarStore } from "../proxies/calendar";
import { goalStore } from "../proxies/goals";
import { userStore } from "../proxies/user";

export function processSyncEvent(event: SyncEvent) {
  const { userId, calendarEvents, calendarEventsToDelete, goals, profile } = event;
  const eventCount = (calendarEvents?.length ?? 0) + (calendarEventsToDelete?.length ?? 0) + (goals?.length ?? 0);
  console.log(`Processing ${eventCount} sync event(s) for ${userId}`);
  if (profile) {
    userStore.setProfile(profile);
  }
  if (calendarEvents) {
    const deserializedCalendarEvents = deserializeCalendarEvents(calendarEvents);
    calendarStore.setCalendarEvents(deserializedCalendarEvents, calendarEventsToDelete ?? []);
  }
  if (goals) {
    const deserializedGoals = deserializeGoals(goals);
    goalStore.setGoals(deserializedGoals);
  }
}
