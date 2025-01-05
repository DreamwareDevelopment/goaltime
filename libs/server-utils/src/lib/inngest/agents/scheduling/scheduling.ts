import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from "zod";
import { Interval } from '../../calendar/scheduling';
import { dayjs } from '@/shared/utils';
import { CalendarEvent } from '@prisma/client';
import { CalendarEventSchema } from '@/shared/zod';
import { Jsonify } from 'inngest/helpers/jsonify';

export const IntervalSchema = z.object({
  start: z.string().describe('The start time of the interval in YYYY-MM-DD HH:mm format'),
  end: z.string().describe('The end time of the interval in YYYY-MM-DD HH:mm format'),
});

export const WakeUpOrSleepEventSchema = z.object({
  type: z.enum(['wakeUp', 'sleep']),
  start: z.string().describe('The time to wake up or sleep on a given day in YYYY-MM-DD HH:mm format'),
});

export const ScheduleableGoalSchema = z.object({
  id: z.string().describe('The unique identifier for the goal'),
  title: z.string().describe('The title of the goal'),
  description: z.string().describe('The description of the goal'),
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
  wakeUpOrSleepEvents: z.array(WakeUpOrSleepEventSchema).describe(`The times to wake up or sleep over the course of the free intervals' days`),
});

export type GoalSchedulingInput = z.infer<typeof GoalSchedulingInputSchema> & {
  externalEvents: Jsonify<CalendarEvent>[];
};

export const ScheduleInputDataSchema = z.object({
  goals: z.array(ScheduleableGoalSchema),
  schedule: z.array(CalendarEventSchema),
  freeIntervals: z.array(IntervalSchema),
  freeWorkIntervals: z.array(IntervalSchema),
  wakeUpOrSleepEvents: z.array(WakeUpOrSleepEventSchema),
}).required();

export type ScheduleInputData = z.infer<typeof ScheduleInputDataSchema>;

const systemPrompt = `
You are a scheduling assistant for a busy professional, you handle all of their scheduling needs.

You are given a goal as well as free time intervals outside of work hours and free time intervals during work hours.
An example input might look like this:

<example input>
{
  userId: "<user-id>",
  goals: [
    {
      id: "<goal-id>",
      title: "Meditate more often",
      description: "Meditation is a great way to clear your mind and focus on the present moment.",
      remainingCommitment: 1.5,
      priority: "High",
      preferredTimes: [
        { start: "5:00", end: "8:00" },
        { start: "20:00", end: "23:00" },
      ],
      allowMultiplePerDay: false,
      canDoDuringWork: false,
    },
  ],
  freeIntervals: [
    { start: "2025-01-01 7:00", end: "2025-01-01 8:00" },
    { start: "2025-01-01 18:00", end: "2025-01-01 22:30" },
  ],
  freeWorkIntervals: [
    { start: "2025-01-01 10:00", end: "2025-01-01 11:00" },
  ],
}
</example input>

Notes on the input:
- The free intervals both inside and outside of work hours contain "start" and "end" fields indicating the date and time in YYYY-MM-DD HH:mm format.
- The free intervals can elapse over multiple days.
- The preferred time intervals contain "start" and "end" fields indicating the time in HH:mm format.
- Each goal has a remaining time commitment in hours over the period of the free intervals indicated by the "remainingCommitment" field.
- Each goal has a list of preferred times throughout the day indicated by the "preferredTimes" field.
- Each goal indicates if multiple sessions are allowed in a day via the "allowMultiplePerDay" field.
- Each goal indicates if it can be done during work hours via the "canDoDuringWork" field.

Here are some guidelines for scheduling:

- Do not schedule any intervals that are outside of the free intervals.
- Do not schedule any overlapping intervals.
- Try to distribute sessions evenly amongst the days of the free intervals, so don't greedily schedule all sessions on the first day.
- If you can, try to schedule sessions for the goal at the same time of day when scheduling across multiple days.
- Make your best judgement to determine if rest days are appropriate for the given goal if it is a physical activity.
- You should make a best effort to schedule sessions for the goal during its preferred times, but they are not strict ranges so you can deviate from them somewhat.
- If the goal can be done during work hours, you should prefer to schedule it during the free work intervals but can schedule it during the free intervals outside of work hours if needed.
- If the goal can't be done during work hours, you should only schedule it during the free intervals outside of work hours.
- If the goal does not allow multiple sessions in a day, you should only schedule one session during that day's free intervals including the free work intervals.
- Prefer to schedule on increments of 5 minute marks, don't do random minute times like 17:34.

When you're done scheduling for a given goal, you should validate the schedule.
If the schedule is invalid you should adjust the schedule accordingly, otherwise you should return the answer.
`;

export async function scheduleGoal(data: GoalSchedulingInput): Promise<Interval<string>[]> {
  const response = await generateText({
    model: openai('gpt-4o'),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(data) },
    ],
    toolChoice: 'required',
    tools: {
      answer: tool({
        description: 'A tool for providing the final answer.',
        parameters: z.object({
          schedule: z.array(IntervalSchema).describe('The schedule for the goal'),
        }),
        // no execute function - invoking it will terminate the agent
      }),
      validateSchedule: tool({
        description: 'A tool for validating the schedule',
        parameters: z.object({
          goal: ScheduleableGoalSchema.describe('The goal to schedule'),
          schedule: z.array(IntervalSchema).describe('The schedule for the goal'),
          freeIntervals: z.array(IntervalSchema).describe('The free intervals outside of work hours'),
          freeWorkIntervals: z.array(IntervalSchema).describe('The free intervals during work hours'),
        }),
        execute: async ({ goal, schedule, freeIntervals, freeWorkIntervals }) => {
          return validateSchedule(goal, schedule, freeIntervals, freeWorkIntervals);
        },
      }),
    }
  });

  return response.toolCalls[0].args.schedule;
}

function validateSchedule(goal: ScheduleableGoal, schedule: Interval<string>[], freeIntervals: Interval<string>[], freeWorkIntervals: Interval<string>[]) {
  const errors: string[] = [];

  console.log('goal', goal);
  console.log('validating schedule', schedule);
  console.log('freeIntervals', freeIntervals);
  console.log('freeWorkIntervals', freeWorkIntervals);
  for (let i = 0; i < schedule.length; i++) {
    const interval = schedule[i];
    const start = dayjs(interval.start);
    const end = dayjs(interval.end);
    let partialOverlap = freeIntervals.find(freeInterval => {
      const freeStart = dayjs(freeInterval.start);
      const freeEnd = dayjs(freeInterval.end);
      return (start.isBefore(freeStart) && end.isAfter(freeStart)) || (start.isBefore(freeEnd) && end.isAfter(freeEnd));
    });
    if (partialOverlap) {
      errors.push(`Interval ${interval.start} - ${interval.end} exceeds free interval ${partialOverlap.start} - ${partialOverlap.end}`);
      continue;
    }
    partialOverlap = freeWorkIntervals.find(freeInterval => {
      const freeStart = dayjs(freeInterval.start);
      const freeEnd = dayjs(freeInterval.end);
      return (start.isBefore(freeStart) && end.isAfter(freeStart)) || (start.isBefore(freeEnd) && end.isAfter(freeEnd));
    });
    if (partialOverlap) {
      errors.push(`Interval ${interval.start} - ${interval.end} exceeds free work interval ${partialOverlap.start} - ${partialOverlap.end}`);
      continue;
    }
    if (!goal.canDoDuringWork) {
      const duringWork = freeWorkIntervals.find(freeInterval => {
        const freeStart = dayjs(freeInterval.start);
        const freeEnd = dayjs(freeInterval.end);
        return start.isBefore(freeEnd) && end.isAfter(freeStart);
      });
      if (duringWork) {
        errors.push(`Interval ${interval.start} - ${interval.end} is during work hours`);
        continue;
      }
    }
    const overlap = schedule.find((otherInterval, j) => {
      if (i === j) return false;
      const otherStart = dayjs(otherInterval.start);
      const otherEnd = dayjs(otherInterval.end);
      return start.subtract(1, 'second').isBefore(otherEnd) && end.add(1, 'second').isAfter(otherStart);
    });
    if (overlap) {
      errors.push(`Scheduled interval ${interval.start} - ${interval.end} overlaps with scheduled interval ${overlap.start} - ${overlap.end}`);
    }
  }

  console.log('Schedule validation errors', errors);
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors,
  };
}


interface IntervalWithScore<T> extends Interval<T> {
  score: number;
}

interface TypedIntervalWithScore<T> extends IntervalWithScore<T> {
  type: 'work' | 'free';
}

export interface WakeUpOrSleepEvent<T> {
  type: 'wakeUp' | 'sleep';
  start: T;
}

type SortableCalendarEvent = CalendarEvent & Interval<dayjs.Dayjs>;

type ScheduleEvent = CalendarEvent | Interval<dayjs.Dayjs> | WakeUpOrSleepEvent<dayjs.Dayjs>;

function isCalendarEvent(event: ScheduleEvent): event is CalendarEvent {
  return 'id' in event;
}

function neutralScore<T>(interval: Interval<T>): IntervalWithScore<T> {
  return {
    ...interval,
    score: 0,
  };
}

/*
export async function scoreIntervals(
  profile: UserProfile,
  wakeUpOrSleepEvents: WakeUpOrSleepEvent<string>[],
  events: CalendarEvent[],
  goals: ScheduleableGoal[],
  freeIntervals: Interval<string>[],
  freeWorkIntervals: Interval<string>[],
): Promise<{
  scoredFreeWorkIntervals: IntervalWithScore<dayjs.Dayjs>[];
  scoredFreeIntervals: IntervalWithScore<dayjs.Dayjs>[];
}> {
  const scoredFreeWorkIntervals: IntervalWithScore<dayjs.Dayjs>[] = [];
  const scoredFreeIntervals: IntervalWithScore<dayjs.Dayjs>[] = [];
  if (freeIntervals.length === 0 && freeWorkIntervals.length === 0) {
    return {
      scoredFreeWorkIntervals,
      scoredFreeIntervals,
    };
  }

  const allDayEvents: CalendarEvent[] = [];
  const sortableEvents: SortableCalendarEvent[] = []
  for (const event of events) {
    if (event.allDay) {
      allDayEvents.push(event);
    } else {
      sortableEvents.push({
        ...event,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        start: dayjs(event.startTime!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        end: dayjs(event.endTime!),
      });
    }
  }
  const sortedEvents: ScheduleEvent[] = [...sortableEvents, ...freeIntervals, ...freeWorkIntervals].sort((a, b) => a.start.diff(b.start));
  if (sortedEvents.length <= 1) {
    return {
      scoredFreeWorkIntervals: freeIntervals.map(neutralScore),
      scoredFreeIntervals: freeWorkIntervals.map(neutralScore),
    };
  }
  let previous: ScheduleEvent | WakeUpOrSleepEvent | null =
  let next: ScheduleEvent | WakeUpOrSleepEvent | null = sortedEvents[0];
  let current: ScheduleEvent | null = sortedEvents[1];
  while (current !== null) {
    const currentStart = current.start;
    const currentEnd = current.end;
  }

  return {
    scoredFreeWorkIntervals,
    scoredFreeIntervals,
  };
}
*/