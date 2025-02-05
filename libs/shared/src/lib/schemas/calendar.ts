import { CalendarProvider } from "@prisma/client";
import z from "zod";

const providerEnum = z.enum([CalendarProvider.goaltime, CalendarProvider.google])

export const CalendarEventSchema = z.object({
  goalId: z.string().nullable().default(null),
  color: z.string(),
  title: z.string()
    .min(1, { message: "Title is required" })
    .max(100, { message: "Title must be less than 100 characters" })
    .default(""),
  provider: providerEnum.default(providerEnum.Enum.goaltime),
  userId: z.string(),
  description: z.string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional().nullable().default(null),
  startTime: z.date(),
  endTime: z.date(),
  allDay: z.date().optional().nullable().default(null),
  timezone: z.string().default('America/Los_Angeles'),
});

export type CalendarEventInput = z.infer<typeof CalendarEventSchema>;

export const LLMEventSchema = z.object({
  title: z.string().describe("The title of the event"),
  description: z.string().nullable().describe("The description of the event"),
  duration: z.number().describe("The duration of the event in minutes"),
  startTime: z.string().describe("The start time of the event"),
  endTime: z.string().describe("The end time of the event"),
});

export type LLMEvent = z.infer<typeof LLMEventSchema>;

export const CalendarLinkEventSchema = z.object({
  id: z.string().describe("The id of the event to link"),
  goalId: z.string().nullable().describe("The goal id to link the event to"),
  linkFutureEvents: z.boolean().describe("Whether to link future events to the goal"),
});

export type CalendarLinkEventInput = z.infer<typeof CalendarLinkEventSchema>;
