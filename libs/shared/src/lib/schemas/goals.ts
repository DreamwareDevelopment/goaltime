import z from "zod";
import { isValidHexColor } from "../utils";
import { Goal, NotificationSettings } from "../../../type_gen/.prisma/client";

// Enums
export const PriorityEnum = z.enum(["High", "Medium", "Low"]);
export const PreferredTimesEnum = z.enum(["Early Morning", "Morning", "Midday", "Afternoon", "Evening", "Night"]);
export const MilestoneViewEnum = z.enum(["daily", "lifetime"]);

// Milestone Schema
export const MilestoneSchema = z.object({
  goalId: z.string().uuid(),
  userId: z.string().uuid(),
  text: z.string(),
  completed: z.boolean().default(false),
  view: MilestoneViewEnum,
  updatedAt: z.date(),
});
export type MilestoneInput = z.infer<typeof MilestoneSchema>
export const MilestoneInputWithIdSchema = MilestoneSchema.extend({ id: z.string().uuid(), goalId: z.string().uuid() });
export type MilestoneInputWithId = z.infer<typeof MilestoneInputWithIdSchema>;

// NotificationSettings Schema
export const NotificationSettingsSchema = z.object({
  userId: z.string().uuid(),
  pushBefore: z.number().int().min(0).optional().nullable().default(0),
  pushAfter: z.number().int().min(0).optional().nullable().default(2),
  textBefore: z.number().int().min(0).optional().nullable().default(null),
  textAfter: z.number().int().min(0).optional().nullable().default(null),
  textCheckIn: z.boolean().default(true),
  phoneBefore: z.number().int().min(0).optional().nullable().default(20),
  phoneAfter: z.number().int().min(0).optional().nullable().default(null),
});
export type NotificationSettingsInput = z.infer<typeof NotificationSettingsSchema>
export const NotificationSettingsInputWithIdSchema = NotificationSettingsSchema.extend({ id: z.string().uuid(), goalId: z.string().uuid() });
export type NotificationSettingsInputWithId = z.infer<typeof NotificationSettingsInputWithIdSchema>;

// Goal Schema
export const GoalSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  title: z.string()
    .min(1.0, { message: "Title is required" })
    .max(100.0, { message: "Title must be less than 100 characters" })
    .default(""),
  description: z.string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional().nullable().default(null),
  commitment: z.number()
    .positive()
    .min(1.0, { message: "Commitment must be at least 1 hour" })
    .max(100.0, { message: "That's a lot of hours, try breaking it up into component goals." })
    .default(1.0),
  completed: z.number()
    .min(0.0, { message: "Completed must be at least 0 hours" })
    .max(100.0, { message: "Completed must be less than 100 hours" })
    .default(0.0),
  priority: PriorityEnum.default("Medium"),
  preferredTimes: z.array(PreferredTimesEnum)
    .default([])
    .refine((times) => times.length > 0, { message: "Select at least one preferred time" }),
  canDoDuringWork: z.boolean().default(false),
  color: z.string().refine((color) => isValidHexColor(color), { message: "Invalid color" }),
  notifications: NotificationSettingsSchema,
  updatedAt: z.date().default(new Date()),
});
export type GoalInput = z.infer<typeof GoalSchema>

export function newGoalFromDb(goal: Goal, notifications: NotificationSettings): GoalInput {
  return {
    ...goal,
    preferredTimes: goal.preferredTimes && Array.isArray(goal.preferredTimes) ? goal.preferredTimes as Array<z.infer<typeof PreferredTimesEnum>> : [],
    notifications,
  };
}
