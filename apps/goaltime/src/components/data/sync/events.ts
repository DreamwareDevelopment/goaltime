import { deserializeCalendarEvents, deserializeGoals, deserializeUserProfile, SyncEvent } from "@/shared/zod";
import { calendarStore } from "../proxies/calendar";
import { goalStore } from "../proxies/goals";
import { userStore } from "../proxies/user";
import { UserProfile } from "@prisma/client";
import { Jsonify } from "inngest/helpers/jsonify";

export function processSyncEvent(event: SyncEvent) {
  const { userId, calendarEvents, calendarEventsToDelete, goals, profile } = event;
  const eventCount = (calendarEvents?.length ?? 0) + (calendarEventsToDelete?.length ?? 0) + (goals?.length ?? 0);
  console.log(`Processing ${eventCount} sync event(s) for ${userId}`);
  if (profile) {
    userStore.setProfile(deserializeUserProfile(profile as Jsonify<UserProfile>));
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
