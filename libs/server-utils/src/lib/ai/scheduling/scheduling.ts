import { generateText, tool } from 'ai';
import { Logger } from 'inngest/middleware/logger';
import { openai } from '@ai-sdk/openai';
import z from 'zod';

import {
  dayjs,
  ExternalEvent,
  GoalEvent,
  Interval,
  IntervalWithScore,
  isExternalEvent,
  isGoalEvent,
  isWakeUpOrSleepEvent,
  ScheduleEvent,
  serializeEvent,
  TypedIntervalWithScore,
  WakeUpOrSleepEvent,
} from '@/shared/utils';
import { IntervalsWithExplanationsSchema, MinimalScheduleableGoal, ScheduleableGoal } from '@/shared/zod';

import { DATE_TIME_FORMAT } from '../../inngest';

export function validateSchedule(goal: ScheduleableGoal, schedule: Interval<string>[], freeIntervals: IntervalWithScore<string>[], freeWorkIntervals: IntervalWithScore<string>[]) {
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
    if (duration < goal.minimumDuration) {
      errors.push(`Interval ${interval.start} - ${interval.end} is less than the minimum duration ${goal.minimumDuration} minutes`);
    } else if (duration > goal.maximumDuration) {
      errors.push(`Interval ${interval.start} - ${interval.end} is greater than the maximum duration ${goal.maximumDuration} minutes`);
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

  const remainingCommitmentMinutes = goal.remainingCommitment * 60;
  console.log(`Remaining commitment: ${remainingCommitmentMinutes} minutes`);
  if (totalTime > remainingCommitmentMinutes) {
    errors.push(`Scheduled interval total time ${totalTime} minutes is ${totalTime - remainingCommitmentMinutes} minutes greater than the remaining commitment ${remainingCommitmentMinutes} minutes`);
  } else if (totalTime < remainingCommitmentMinutes) {
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

interface ScoringResult {
  interval: IntervalWithScore<string>;
  explanation: string;
}

export async function scoreIntervals(
  logger: Logger,
  instructions: string,
  goal: MinimalScheduleableGoal,
  freeIntervals: TypedIntervalWithScore<dayjs.Dayjs>[],
  freeWorkIntervals: TypedIntervalWithScore<dayjs.Dayjs>[],
  wakeUpOrSleepEvents: WakeUpOrSleepEvent<string>[],
  externalEvents: ExternalEvent<string>[],
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
      allDayEvents.push(serializeEvent(event));
    } else {
      sortableEvents.push(serializeEvent(event));
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

  // logger.info(`Sorted string events: ${sortedStringEvents.map(event => `${event.start} - ${(event as any).end ?? ''}`).join(', ')}`);

  for (let i = 1; i < sortedStringEvents.length; i++) {
    const current = sortedStringEvents[i];
    if (isExternalEvent(current) || isWakeUpOrSleepEvent(current) || isGoalEvent(current)) {
      continue;
    }
    const previous = sortedStringEvents[i - 1];
    const next = i === sortedStringEvents.length - 1 ? null : sortedStringEvents[i + 1];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const allDayEventsToday = allDayEvents.filter(event => dayjs(event.allDay!).isSame(current.start, 'day')).map(event => ({
      ...event,
      start: event.start.format(DATE_TIME_FORMAT),
      end: event.end.format(DATE_TIME_FORMAT),
    })) as ExternalEvent<string>[];
    // logger.info(`Scoring interval ${current.start} - ${current.end}`);
    const scoredIntervals = await scoreInterval(instructions, goal, current, previous, next, allDayEventsToday);
    for (const interval of scoredIntervals) {
      if (interval.interval.type === 'work') {
        scoredFreeWorkIntervals.push(interval);
      } else {
        scoredFreeIntervals.push(interval);
      }
    }
  }

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
    title: "Work on the project",
    description: "Work on the project for my company",
    allowMultiplePerDay: false,
    canDoDuringWork: true,
    minimumDuration: 90, // 90 minutes
    maximumDuration: 120, // 120 minutes
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
    allowMultiplePerDay: false,
    canDoDuringWork: false,
    minimumDuration: 10, // 10 minutes
    maximumDuration: 20, // 20 minutes
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
- If the current interval is a good time to complete the goal, it should get a positive score.
- If the current interval is a bad time to complete the goal, it should get a negative score.
- If you don't have enough information to make a judgement, you should return a score of 0.

Here are some additional guidelines to consider:

${instructions}

Remember your reasoning when scoring, explanations for each scored interval should be returned at the end of the scoring process in the "explanations" field. Only explain if you have reasons other than the interval being outside of the goal's preferred times or the goal not being allowed during work hours.

Return the scored intervals in the "intervals" field using the answer tool.
`

async function scoreInterval(
  instructions: string,
  goal: MinimalScheduleableGoal,
  current: TypedIntervalWithScore<string>,
  previous: ScheduleEvent<string>,
  next: ScheduleEvent<string> | null,
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
          intervalsWithExplanations: IntervalsWithExplanationsSchema,
        }),
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
2. Whether the goal allows multiple sessions in a day.
3. The nature of the previous and next events to determine if the user might be busy or in transit or in an inappropriate setting during the current interval.
4. The type of the previous and next events (e.g., work, personal, exercise) to understand the user's potential state of mind or physical condition.
5. The location of the previous and next events, as the user may need travel time between locations.
6. Any additional context provided in the title or description of the previous and next events.

You are given the calendar events and names of previously scheduled goal events to help you advice the scheduling assistant on what to look out for regarding scheduling the given goal in context of the other events.
For example, if there are events like "Flight to New York" or "Exercise Regularly" in the schedule, you should inform the scheduling assistant to be aware of the user's situation during and between those events.

You are speaking directly to the scheduling assistant, so use "you" instead of "the scheduling assistant".
This is a one time immediate operation, so don't tell the scheduling assistant to look out for changes in the future.
`

export async function getGoalScoringInstructions(
  goal: MinimalScheduleableGoal,
  previouslyScheduledGoalEvents: string[],
  calendarEvents: ExternalEvent<string>[],
): Promise<string> {
  const response = await generateText({
    model: openai('gpt-4o'),
    messages: [{ role: 'system', content: goalScoringInstructionsPrompt }, { role: 'user', content: JSON.stringify({
      currentGoal: {
        title: goal.title,
        description: goal.description,
        allowMultiplePerDay: goal.allowMultiplePerDay,
      },
      calendarEvents,
      previouslyScheduledGoalEvents,
    })}],
  });
  return response.text;
}
