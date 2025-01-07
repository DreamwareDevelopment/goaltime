import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from "zod";
import { DATE_TIME_FORMAT, Interval } from '../../calendar/scheduling';
import { dayjs } from '@/shared/utils';
import { CalendarEvent, Priority } from '@prisma/client';
import { CalendarEventSchema } from '@/shared/zod';
import { Jsonify } from 'inngest/helpers/jsonify';

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
  freeIntervals: z.array(IntervalWithScoreSchema).describe('Free intervals outside of work hours'),
  freeWorkIntervals: z.array(IntervalWithScoreSchema).describe('Free intervals during work hours'),
});

export type GoalSchedulingInput = z.infer<typeof GoalSchedulingInputSchema>;

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
  goal: {
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
  freeIntervals: [
    { start: "2025-01-01 7:00", end: "2025-01-01 8:00", score: 0 },
    { start: "2025-01-01 18:00", end: "2025-01-01 22:30", score: -0.5 },
  ],
  freeWorkIntervals: [
    { start: "2025-01-01 10:00", end: "2025-01-01 11:00", score: 0.7 },
  ],
}
</example input>

Notes on the input:
- The free intervals both inside and outside of work hours contain "start" and "end" fields indicating the date and time in YYYY-MM-DD HH:mm format.
- The free intervals also contain a "score" field indicating the score of the interval for that goal. The higher the score, the more likely the user is to complete the goal during that interval.
- You should use the score to help you determine which intervals to schedule the goal in, avoiding the ones with negative scores.
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
    maxSteps: 10,
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
          freeIntervals: z.array(IntervalWithScoreSchema).describe('The free intervals outside of work hours sorted by score descending'),
          freeWorkIntervals: z.array(IntervalWithScoreSchema).describe('The free intervals during work hours sorted by score descending'),
        }),
        execute: async ({ goal, schedule, freeIntervals, freeWorkIntervals }) => {
          return validateSchedule(goal, schedule, freeIntervals, freeWorkIntervals);
        },
      }),
    }
  });

  return response.toolCalls[0].args.schedule;
}

function validateSchedule(goal: ScheduleableGoal, schedule: Interval<string>[], freeIntervals: IntervalWithScore<string>[], freeWorkIntervals: IntervalWithScore<string>[]) {
  const errors: string[] = [];

  console.log('validating schedule for goal', goal);
  console.log('validating schedule', schedule);
  console.log('freeIntervals', freeIntervals);
  console.log('freeWorkIntervals', freeWorkIntervals);
  let totalTime = 0;
  const dayLookup = new Map<string, Interval<string>[]>();
  for (let i = 0; i < schedule.length; i++) {
    const interval = schedule[i];
    const start = dayjs(interval.start);
    const day = start.format('YYYY-MM-DD');
    if (!dayLookup.has(day)) {
      dayLookup.set(day, []);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    dayLookup.get(day)!.push(interval);
    const end = dayjs(interval.end);
    const duration = end.diff(start, 'minute');
    if (duration < goal.minimumTime) {
      errors.push(`Interval ${interval.start} - ${interval.end} is less than the minimum time ${goal.minimumTime} minutes`);
    } else if (duration > goal.maximumTime) {
      errors.push(`Interval ${interval.start} - ${interval.end} is greater than the maximum time ${goal.maximumTime} minutes`);
    }
    totalTime += duration;
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

  const priorityMultiplier = goal.priority === Priority.High ? 0.025 : goal.priority === Priority.Medium ? 0.075 : 0.15;
  const remainingCommitmentMinutes = goal.remainingCommitment * 60;
  console.log(`Remaining commitment: ${remainingCommitmentMinutes} minutes`);
  const priorityGracePeriod = remainingCommitmentMinutes * priorityMultiplier;
  console.log(`Priority grace period: ${priorityGracePeriod} minutes`);
  if (totalTime > remainingCommitmentMinutes) {
    errors.push(`Scheduled interval total time ${totalTime} minutes is ${totalTime - remainingCommitmentMinutes} minutes greater than the remaining commitment ${remainingCommitmentMinutes} minutes`);
  } else if (totalTime < remainingCommitmentMinutes - priorityGracePeriod) {
    errors.push(`Scheduled interval total time ${totalTime} minutes is ${remainingCommitmentMinutes - totalTime} minutes less than the remaining commitment ${remainingCommitmentMinutes} minutes`);
  }

  if (!goal.allowMultiplePerDay) {
    for (const day of dayLookup.keys()) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const intervals = dayLookup.get(day)!;
      if (intervals.length > 1) {
        errors.push(`Multiple intervals scheduled for day ${day}: ${intervals.map(interval => `${interval.start} - ${interval.end}`).join(', ')} which is not allowed for this goal`);
      }
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

interface ScoringResult {
  interval: IntervalWithScore<string>;
  explanation: string;
}

export interface TypedIntervalWithScore<T> extends IntervalWithScore<T> {
  type: 'work' | 'free';
}

export interface WakeUpOrSleepEvent<T> {
  type: 'wakeUp' | 'sleep';
  start: T;
}

export interface ExternalEvent<T> extends Interval<T> {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  location?: string;
  allDay?: T;
}

export interface GoalEvent<T> {
  goalId: string;
  title: string;
  start: T;
  end: T;
}

type ScheduleEvent<T> = ExternalEvent<T> | TypedIntervalWithScore<T> | WakeUpOrSleepEvent<T> | GoalEvent<T>;

function isExternalEvent<T>(event: ScheduleEvent<T>): event is ExternalEvent<T> {
  return 'id' in event;
}

function isWakeUpOrSleepEvent<T>(event: ScheduleEvent<T>): event is WakeUpOrSleepEvent<T> {
  return 'type' in event && (event.type === 'wakeUp' || event.type === 'sleep');
}

function isGoalEvent<T>(event: ScheduleEvent<T>): event is GoalEvent<T> {
  return 'goalId' in event;
}

export async function scoreIntervals(
  instructions: string,
  goal: ScheduleableGoal,
  freeIntervals: TypedIntervalWithScore<dayjs.Dayjs>[],
  freeWorkIntervals: TypedIntervalWithScore<dayjs.Dayjs>[],
  wakeUpOrSleepEvents: WakeUpOrSleepEvent<string>[],
  externalEvents: Jsonify<CalendarEvent>[],
  goalEvents: GoalEvent<dayjs.Dayjs>[],
): Promise<{
  scoredFreeWorkIntervals: ScoringResult[];
  scoredFreeIntervals: ScoringResult[];
}> {
  const scoredFreeWorkIntervals: ScoringResult[] = [];
  const scoredFreeIntervals: ScoringResult[] = [];
  if (freeIntervals.length === 0 && freeWorkIntervals.length === 0) {
    console.log('No free intervals to score');
    return {
      scoredFreeWorkIntervals,
      scoredFreeIntervals,
    };
  }

  const sortableWakeUpOrSleepEvents: WakeUpOrSleepEvent<dayjs.Dayjs>[] = wakeUpOrSleepEvents.map(event => ({
    ...event,
    start: dayjs(event.start),
  }));

  const allDayEvents: ExternalEvent<dayjs.Dayjs>[] = [];
  const sortableEvents: ExternalEvent<dayjs.Dayjs>[] = []
  for (const event of externalEvents) {
    if (event.allDay) {
      const allDay = dayjs(event.allDay);
      allDayEvents.push({
        title: event.title,
        subtitle: event.subtitle ?? undefined,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        start: allDay.startOf('day'),
        end: allDay.endOf('day'),
        id: event.id,
      });
    } else {
      sortableEvents.push({
        title: event.title,
        subtitle: event.subtitle ?? undefined,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        start: dayjs(event.startTime!),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        end: dayjs(event.endTime!),
        id: event.id,
      });
    }
  }

  const sortedEvents: ScheduleEvent<dayjs.Dayjs>[] = [
    ...sortableWakeUpOrSleepEvents,
    ...sortableEvents,
    ...goalEvents,
    ...freeIntervals,
    ...freeWorkIntervals,
  ].sort((a, b) => a.start.diff(b.start));
  if (sortedEvents.length <= 2) {
    console.log('Not enough events to score');
    return {
      scoredFreeWorkIntervals: freeWorkIntervals.map(interval => ({
        interval: {
          start: interval.start.format(DATE_TIME_FORMAT),
          end: interval.end.format(DATE_TIME_FORMAT),
          score: interval.score,
        },
        explanation: 'Not enough events to score',
      })),
      scoredFreeIntervals: freeIntervals.map(interval => ({
        interval: {
          start: interval.start.format(DATE_TIME_FORMAT),
          end: interval.end.format(DATE_TIME_FORMAT),
          score: interval.score,
        },
        explanation: 'Not enough events to score',
      })),
    };
  }

  const sortedStringEvents: ScheduleEvent<string>[] = sortedEvents.map(event => (isWakeUpOrSleepEvent(event) ? {
    ...event,
    start: event.start.format(DATE_TIME_FORMAT),
  } : isExternalEvent(event) ? {
    ...event,
    start: event.start.format(DATE_TIME_FORMAT),
    end: event.end.format(DATE_TIME_FORMAT),
    allDay: undefined,
  } : {
    ...event,
    start: event.start.format(DATE_TIME_FORMAT),
    end: event.end.format(DATE_TIME_FORMAT),
  }));

  const intervalsWithExplanations: Array<{ interval: TypedIntervalWithScore<string>; explanation: string }> = [];
  for (let i = 1; i < sortedStringEvents.length - 1; i++) {
    const current = sortedStringEvents[i];
    if (isExternalEvent(current) || isWakeUpOrSleepEvent(current) || isGoalEvent(current)) {
      continue;
    }
    const previous = sortedStringEvents[i - 1];
    const next = sortedStringEvents[i + 1];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const allDayEventsToday = allDayEvents.filter(event => dayjs(event.allDay!).isSame(current.start, 'day')).map(event => ({
      ...event,
      start: event.start.format(DATE_TIME_FORMAT),
      end: event.end.format(DATE_TIME_FORMAT),
    })) as ExternalEvent<string>[];
    const scoredIntervals = await scoreInterval(instructions, goal, current, previous, next, allDayEventsToday);
    intervalsWithExplanations.push(...scoredIntervals);
    for (const interval of scoredIntervals) {
      if (interval.interval.type === 'work') {
        scoredFreeWorkIntervals.push(interval);
      } else {
        scoredFreeIntervals.push(interval);
      }
    }
  }

  console.log('scoredFreeWorkIntervals count', scoredFreeWorkIntervals.length);
  console.log('scoredFreeIntervals count', scoredFreeIntervals.length);
  return {
    scoredFreeWorkIntervals,
    scoredFreeIntervals,
  };
}

const getScoringSystemPrompt = (instructions: string) => `
You are a scheduling assistant for a busy professional, you handle all of their scheduling needs.

You are to consider a current interval and the previous and next events to determine the score of the current interval.
The score should be between -1 and 1.
The previous and next events are provided to help you understand the context of the current interval. These may be wake up or sleep events, calendar events, or free/work intervals.
You are also given an array of any all day events that occur on the day of the current interval to help you understand the context of the current interval indicated by the "allDayEvents" field.

Some example inputs:

<example input>
{
  allDayEvents: [],
  goal: {
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
  previous: {
    start: "2025-01-01 7:00",
    type: "wakeUp",
  },
  current: {
    start: "2025-01-01 7:00",
    end: "2025-01-01 8:00",
    type: "free",
    score: 0,
  },
  next: {
    start: "2025-01-01 8:00",
    end: "2025-01-01 17:00",
    type: "work",
    score: 0,
  },
}
</example input>
<example input>
{
  allDayEvents: [],
  goal: {
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
  previous: {
    goalId: "<goal-id>",
    title: "Exercise Regularly",
    start: "2025-01-01 16:00",
    end: "2025-01-01 17:00",
  },
  current: {
    start: "2025-01-01 17:00",
    end: "2025-01-01 18:00",
    type: "free",
    score: 0,
  },
  next: {
    id: "<event-id>",
    title: "Meeting with John",
    startTime: "2025-01-01 18:00",
    endTime: "2025-01-01 19:00",
  }
}
</example input>

Here are some guidelines for scoring:

- The intervals have a "type" field indicating whether they are free or work intervals, do not drop this information.
- All intervals use the same YYYY-MM-DD HH:mm format for the "start" and "end" fields.
- Given intervals all start with a score of 0.
- If the current interval is during work hours and the goal cannot be done during work hours as shown by the "canDoDuringWork" field, it should get a score of -1.
- If the current interval is outside of work hours and the goal can only be done during work hours as shown by the "canDoDuringWork" field, it should get a lower score, but not necessarily negative.
- If the current interval is a good time to complete the goal, it should get a positive score.
- If the current interval is a bad time to complete the goal, it should get a negative score.
- If you don't have enough information to make a judgement, you should return a score of 0.
- If the interval may have a portion that seems like a bad time, please split it into two intervals and score them separately.

${instructions}

Remember your reasoning when scoring, explanations for each scored interval should be returned at the end of the scoring process in the "explanations" field. Only explain if you have reasons other than the interval being outside of the goal's preferred times or the goal not being allowed during work hours.

Return the scored intervals in the "intervals" field using the answer tool.
`

async function scoreInterval(
  instructions: string,
  goal: ScheduleableGoal,
  current: TypedIntervalWithScore<string>,
  previous: ScheduleEvent<string>,
  next: ScheduleEvent<string>,
  allDayEvents: ExternalEvent<string>[],
): Promise<Array<{ interval: TypedIntervalWithScore<string>; explanation: string }>> {
  const response = await generateText({
    model: openai('gpt-4o'),
    messages: [
      { role: 'system', content: getScoringSystemPrompt(instructions) },
      { role: 'user', content: JSON.stringify({ goal, current, previous, next, allDayEvents }) },
    ],
    maxSteps: 10,
    toolChoice: 'required',
    tools: {
      answer: tool({
        description: 'A tool for providing the final answer.',
        parameters: z.object({
          intervalsWithExplanations: z.array(z.object({
            interval: TypedIntervalWithScoreSchema.describe('The interval that was scored'),
            explanation: z.string().describe('The explanation of the scoring for the interval'),
          })).describe('An explanation of the scoring for each interval'),
        }),
      }),
      splitInterval: tool({
        description: 'A tool for splitting an interval into two intervals',
        parameters: z.object({
          interval: IntervalSchema.describe('The interval to split'),
          splitAt: z.string().describe('The time to split the interval at in YYYY-MM-DD HH:mm format'),
        }),
        execute: async ({ interval, splitAt }) => {
          // console.log(`splitting interval ${interval.start} - ${interval.end} at ${splitAt}`);
          const splitAtDayjs = dayjs(splitAt);
          return [
            { start: interval.start, end: splitAtDayjs.format(DATE_TIME_FORMAT) },
            { start: splitAtDayjs.format(DATE_TIME_FORMAT), end: interval.end },
          ];
        },
      }),
    },
  });
  const answerCall = response.toolCalls.find(call => call.toolName === 'answer');
  if (!answerCall) {
    throw new Error('No answer call found');
  }
  return answerCall.args.intervalsWithExplanations;
}

const goalScoringInstructionsPrompt = `
You are assisting a scheduling assistant for a busy professional with a well rounded lifestyle albeit with their own quirks.
The scheduling assistant is tasked with scoring potential scheduling intervals for goal related activities given the user's schedule.
The schedule the scheduling assistant is using consists of either free intervals, work intervals, wake up / sleep events, or external calendar events from the user's calendar.
The calendar events also have "title" and "description" fields which the scheduling assistant should use to help determine the score of the interval.
These events should be used to infer the user's location / situation and whether or not accomplishing the goal at the current interval is practical / appropriate.

The scheduling assistant should consider the following when scoring an interval:

1. The goal's title and description to understand the nature of the activity.
2. The previous and next events to determine if the user might be busy or in transit during the current interval.
3. The duration of the previous and next events, as the user may need buffer time before or after those events.
4. The location of the previous and next events, as the user may need travel time between locations.
5. The type of the previous and next events (e.g., work, personal, exercise) to understand the user's potential state of mind or physical condition.
6. Any additional context provided in the title or description of the previous and next events.

You should also consider telling the scheduling assistant how to spread out the goal activity sessions if it seems necessary for the user to have some rest or buffer time between sessions.
For example, if the goal is a physical activity like exercise, you should consider if the user is likely to exercise during the current interval given their sleep and work schedule, and if they have had enough time to rest.

You are speaking directly to the scheduling assistant, so use "you" instead of "the scheduling assistant".
`

export async function getGoalScoringInstructions(goal: ScheduleableGoal): Promise<string> {
  const response = await generateText({
    model: openai('gpt-4o'),
    messages: [{ role: 'system', content: goalScoringInstructionsPrompt }, { role: 'user', content: JSON.stringify({
      title: goal.title,
      description: goal.description,
      preferredTimes: goal.preferredTimes,
      allowMultiplePerDay: goal.allowMultiplePerDay,
      canDoDuringWork: goal.canDoDuringWork,
      minimumTime: goal.minimumTime,
      maximumTime: goal.maximumTime,
    })}],
  });
  return response.text;
}
