import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from "zod";
import { Interval } from '../../calendar/scheduling';

export const IntervalSchema = z.object({
  start: z.string().describe('The start time of the interval in YYYY-MM-DD HH:mm format'),
  end: z.string().describe('The end time of the interval in YYYY-MM-DD HH:mm format'),
});

export const ScheduleableGoalSchema = z.object({
  id: z.string().describe('The unique identifier for the goal'),
  remainingCommitment: z.number().describe('The remaining time commitment in hours to be scheduled over the period of the free intervals'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the goal'),
  preferredTimes: z.array(z.object({
    start: z.string().describe('The start time of the preferred time interval in HH:mm format'),
    end: z.string().describe('The end time of the preferred time interval in HH:mm format'),
  })).describe('The preferred times for the goal'),
  allowMultiplePerDay: z.boolean().describe('If the goal allows multiple sessions in a day'),
  canDoDuringWork: z.boolean().describe('If the goal can also be done during work hours'),
  minimumTime: z.number().describe('The minimum time in minutes that the goal can be scheduled for'),
  maximumTime: z.number().describe('The maximum time in minutes that the goal can be scheduled for'),
})

export type ScheduleableGoal = z.infer<typeof ScheduleableGoalSchema>;

export const GoalSchedulingInputSchema = z.object({
  goal: ScheduleableGoalSchema.describe('The goal to schedule'),
  freeIntervals: z.array(IntervalSchema).describe('Free intervals outside of work hours'),
  freeWorkIntervals: z.array(IntervalSchema).describe('Free intervals during work hours'),
});

export type GoalSchedulingInput = z.infer<typeof GoalSchedulingInputSchema>;

export const ScheduleInputDataSchema = z.object({
  goals: z.array(ScheduleableGoalSchema),
  interval: IntervalSchema,
  freeIntervals: z.array(IntervalSchema),
  freeWorkIntervals: z.array(IntervalSchema),
}).required();

export type ScheduleInputData = z.infer<typeof ScheduleInputDataSchema>;

const systemPrompt = `
You are a scheduling assistant for a busy professional, you handle all of their scheduling needs.

You are given a goal as described by the given schema, and free time intervals outside of work hours and during work hours.

Here are some guidelines for scheduling:

The free intervals can elapse over multiple days.
You should make a best effort to schedule each goal during its preferred times, but they are not strict ranges so you can deviate from them somewhat.
If a goal can be done during work hours, you should prefer to schedule it during the free work intervals but can schedule it during the free intervals outside of work hours if needed. If not, you should not schedule it during the free work intervals.
If a goal does not allow multiple sessions in a day, you should only schedule one session during that day's free intervals including the free work intervals.
Try to distribute sessions evenly across the days.
Make your best judgement to determine if rest days are appropriate for the given goal if it is a physical activity.
If you can, try to schedule sessions for a goal at the same time of day when scheduling across multiple days.
Prefer to schedule on increments of 5 minute marks, don't do random minute times like 17:34.
Do not schedule any intervals that overlap.
Do not schedule any intervals that are outside of the free intervals.
All output times should be in the YYYY-MM-DD HH:mm format.
`;
// When you're done scheduling for a given goal, you should validate the schedule.
// If the schedule is invalid you should adjust the schedule accordingly, otherwise you should return the schedule.

export async function scheduleGoal(data: GoalSchedulingInput): Promise<Interval<string>[]> {
  const response = await generateObject({
    model: openai('gpt-4o'),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(data) },
    ],
    schema: z.object({
      schedule: z.array(IntervalSchema).describe('The schedule for the goal'),
    }),
  });

  return response.object.schedule;
}
