import z from "zod";

// Enums
export const PriorityEnum = z.enum(["High", "Medium", "Low"]);
export const PreferredTimesEnum = z.enum(["Early Morning", "Morning", "Midday", "Afternoon", "Evening", "Night"]);
export const MilestoneViewEnum = z.enum(["daily", "lifetime"]);

// Milestone Schema
export const MilestoneSchema = z.object({
  text: z.string(),
  completed: z.boolean().default(false),
  view: MilestoneViewEnum,
  goalId: z.string().uuid(),
  updatedAt: z.date(),
});

// NotificationSettings Schema
export const NotificationSettingsSchema = z.object({
  goalId: z.string().uuid(),
  pushBefore: z.string().duration().optional(),
  pushAfter: z.string().duration().optional(),
  pushCheckIn: z.boolean().default(false),
  textBefore: z.string().duration().optional(),
  textAfter: z.string().duration().optional(),
  textCheckIn: z.boolean().default(false),
  phoneBefore: z.string().duration().optional(),
  phoneAfter: z.string().duration().optional(),
});

// Goal Schema
export const GoalSchema = z.object({
  title: z.string().max(100, { message: "Title must be less than 100 characters" }),
  description: z.string().max(1000, { message: "Description must be less than 1000 characters" }).optional(),
  commitment: z.number().positive().max(100, { message: "That's a lot of hours, try breaking it up into component goals." }),
  completed: z.number().positive().default(0.0),
  priority: PriorityEnum.default("Medium"),
  preferredTimes: z.array(PreferredTimesEnum).default([]),
  color: z.string(),
  milestones: z.array(MilestoneSchema).default([]),
  notifications: NotificationSettingsSchema,
  updatedAt: z.date().default(new Date()),
  userId: z.string().uuid(),
});
