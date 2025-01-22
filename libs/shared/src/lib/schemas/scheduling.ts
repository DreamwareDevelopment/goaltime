import z from "zod";

export const IntervalSchema = z.object({
  start: z.string().describe('The start time of the interval in YYYY-MM-DD HH:mm format'),
  end: z.string().describe('The end time of the interval in YYYY-MM-DD HH:mm format'),
});

export const IntervalWithScoreSchema = IntervalSchema.extend({
  score: z.number().describe('The score of the interval'),
});

export const TypedIntervalWithScoreSchema = IntervalWithScoreSchema.extend({
  type: z.enum(['free', 'work']).describe('The type of the interval'),
});

export const IntervalWithExplanationsSchema = z.object({
  interval: TypedIntervalWithScoreSchema.describe('The interval that was scored'),
  explanation: z.string().describe('The explanation of the scoring for the interval'),
})

export const IntervalsWithExplanationsSchema = z.array(IntervalWithExplanationsSchema).describe('A list of intervals with explanations as to why they were scored as they were')

export const WakeUpOrSleepEventSchema = z.object({
  type: z.enum(['wakeUp', 'sleep']),
  start: z.string().describe('The time to wake up or sleep on a given day in YYYY-MM-DD HH:mm format'),
});

export const MinimalScheduleableGoalSchema = z.object({
  title: z.string().describe('The title of the goal'),
  description: z.string().describe('The description of the goal'),
  allowMultiplePerDay: z.boolean().describe('If the goal allows multiple sessions in a day'),
  canDoDuringWork: z.boolean().describe('If the goal can also be done during work hours'),
  minimumDuration: z.number().describe('The minimum duration in minutes that the goal can be scheduled for'),
  maximumDuration: z.number().describe('The maximum duration in minutes that the goal can be scheduled for'),
});

export type MinimalScheduleableGoal = z.infer<typeof MinimalScheduleableGoalSchema>;

export const SerializedIntervalDaysSchema = z.object({
  Everyday: IntervalSchema.array(),
  Weekdays: IntervalSchema.array(),
  Weekends: IntervalSchema.array(),
  Monday: IntervalSchema.array(),
  Tuesday: IntervalSchema.array(),
  Wednesday: IntervalSchema.array(),
  Thursday: IntervalSchema.array(),
  Friday: IntervalSchema.array(),
  Saturday: IntervalSchema.array(),
  Sunday: IntervalSchema.array(),
})

export const ScheduleableGoalSchema = MinimalScheduleableGoalSchema.extend({
  id: z.string().describe('The unique identifier for the goal'),
  remainingCommitment: z.number().describe('The remaining time commitment in hours to be scheduled over the period of the free intervals'),
  breakDuration: z.number().optional().nullable().default(null).describe('The duration of the break in minutes'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the goal'),
  preferredTimes: SerializedIntervalDaysSchema.describe('The preferred times for the goal'),
})

export type ScheduleableGoal = z.infer<typeof ScheduleableGoalSchema>;

export const ScheduleInputDataSchema = z.object({
  goals: z.array(ScheduleableGoalSchema),
  freeIntervals: z.array(IntervalSchema),
  freeWorkIntervals: z.array(IntervalSchema),
  wakeUpOrSleepEvents: z.array(WakeUpOrSleepEventSchema),
}).required();

export type ScheduleInputData = z.infer<typeof ScheduleInputDataSchema>;
