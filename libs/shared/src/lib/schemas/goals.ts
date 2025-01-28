import z from "zod";
import { isValidHexColor } from "../utils";
import { Goal } from "@prisma/client";

// Enums
export const PriorityEnum = z.enum(["High", "Medium", "Low"]);
export const PreferredTimesEnum = z.enum(["Early Morning", "Morning", "Midday", "Afternoon", "Evening", "Night", "Late Night"]);
export type PreferredTimesEnumType = z.infer<typeof PreferredTimesEnum>;
export const MilestoneViewEnum = z.enum(["daily", "lifetime"]);

// Milestone Schema
export const MilestoneSchema = z.object({
  id: z.string().uuid().optional(),
  goalId: z.string().uuid(),
  userId: z.string().uuid(),
  text: z.string().min(1, { message: "Text is required" }),
  completed: z.boolean().default(false),
  view: MilestoneViewEnum,
});
export type MilestoneInput = z.infer<typeof MilestoneSchema>

export const MAX_NOTIFICATION_EVENT_OFFSET = 60;

// NotificationSettings Schema
export const NotificationSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  phone: z.string().regex(/^\+\d{1,2}\d{10}$/, {
    message: 'Please provide a valid phone number',
  }),
  pushBefore: z.number().int().min(0).max(MAX_NOTIFICATION_EVENT_OFFSET).optional().nullable().default(null),
  pushAfter: z.number().int().min(0).max(MAX_NOTIFICATION_EVENT_OFFSET).optional().nullable().default(null),
  textBefore: z.number().int().min(0).max(MAX_NOTIFICATION_EVENT_OFFSET).optional().nullable().default(10),
  textAfter: z.number().int().min(0).max(MAX_NOTIFICATION_EVENT_OFFSET).optional().nullable().default(2),
  textCheckIn: z.boolean().default(false),
  phoneBefore: z.number().int().min(0).max(MAX_NOTIFICATION_EVENT_OFFSET).optional().nullable().default(null),
  phoneAfter: z.number().int().min(0).max(MAX_NOTIFICATION_EVENT_OFFSET).optional().nullable().default(null),
});
export type NotificationSettingsInput = z.infer<typeof NotificationSettingsSchema>

export const PreferredTimesDaysSchema = z.object({
  Everyday: PreferredTimesEnum.array().default([]).optional(),
  Weekdays: PreferredTimesEnum.array().default([]).optional(),
  Weekends: PreferredTimesEnum.array().default([]).optional(),
  Monday: PreferredTimesEnum.array().default([]),
  Tuesday: PreferredTimesEnum.array().default([]),
  Wednesday: PreferredTimesEnum.array().default([]),
  Thursday: PreferredTimesEnum.array().default([]),
  Friday: PreferredTimesEnum.array().default([]),
  Saturday: PreferredTimesEnum.array().default([]),
  Sunday: PreferredTimesEnum.array().default([]),
})

export type PreferredTimesDays = z.infer<typeof PreferredTimesDaysSchema>

export function getGoalPreferredTimes(goal: Goal): PreferredTimesDays {
  const parsed = PreferredTimesDaysSchema.parse(goal.preferredTimes)
  parsed.Everyday = [...parsed.Monday]
  parsed.Weekdays = [...parsed.Monday]
  parsed.Weekends = [...parsed.Saturday]
  return parsed
}

// Goal Schema
export const GoalSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  title: z.string()
    .min(1, { message: "Title is required" })
    .max(100, { message: "Title must be less than 100 characters" })
    .default(""),
  description: z.string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional().nullable().default(null),
  estimate: z.number()
    .positive()
    .min(1.0, { message: "Estimate must be at least 1 hour" })
    .optional()
    .nullable()
    .default(null),
  deadline: z.date().optional().nullable().default(null),
  commitment: z.number()
    .positive()
    .min(1.0, { message: "Commitment must be at least 1 hour" })
    .max(100.0, { message: "That's a lot of hours, try breaking it up into component goals." })
    .optional()
    .nullable()
    .default(null),
  completed: z.number()
    .min(0.0, { message: "Completed must be at least 0 hours" })
    .max(100.0, { message: "Completed must be less than 100 hours" })
    .default(0.0),
  priority: PriorityEnum.default("Medium"),
  preferredTimes: PreferredTimesDaysSchema.describe("The preferred times of the goal."),
  breakDuration: z.number().int().min(10, "Break duration must be at least 10 minutes").optional().nullable().default(null),
  minimumDuration: z.number().int().min(10, "Minimum duration must be at least 10 minutes").default(30),
  maximumDuration: z.number().int().min(10, "Maximum duration must be at least 10 minutes").max(1000, "Maximum duration must be less than 1000 minutes").default(120),
  allowMultiplePerDay: z.boolean().default(true),
  canDoDuringWork: z.boolean().default(false),
  color: z.string().refine((color) => isValidHexColor(color), { message: "Invalid color" }),
  notifications: NotificationSettingsSchema,
  updatedAt: z.date().default(new Date()),
});
export type GoalInput = z.infer<typeof GoalSchema>

export const LLMGoalSchema = z.object({
  id: z.string().describe("The id of the goal."),
  title: z.string().describe("The title of the goal."),
  description: z.string().describe("A description of the goal."),
  deadline: z.string().describe("The deadline of the goal.").nullable(),
  commitment: z.number().describe("The hours per week committed to the goal.").nullable(),
  preferredTimes: PreferredTimesDaysSchema.describe("The preferred times of the goal.").nullable(),
  minimumDuration: z.number().describe("The minimum duration in minutes that the user should spend on the goal.").nullable(),
  maximumDuration: z.number().describe("The maximum duration in minutes that the user should spend on the goal.").nullable(),
});

export type LLMGoal = z.infer<typeof LLMGoalSchema>;
