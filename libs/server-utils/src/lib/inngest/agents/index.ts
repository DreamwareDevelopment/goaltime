import { CalendarEvent, Goal } from "@prisma/client";

export * from "./accountability";

export interface AccountabilityEvent {
  userId: string;
  event: CalendarEvent;
  goal: Goal;
}
