import z from "zod";

export const CalendarEventSchema = z.object({
  title: z.string()
    .min(1, { message: "Title is required" })
    .max(100, { message: "Title must be less than 100 characters" })
    .default(""),
  description: z.string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional().nullable().default(null),
  startTime: z.date(),
  endTime: z.date(),
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
