import { CalendarEvent, Goal } from "@prisma/client";

export * from "./accountability";
export * from "./tools/sendMessage";

export interface AccountabilityEvent {
  userId: string;
  event: CalendarEvent;
  goal: Goal;
}
