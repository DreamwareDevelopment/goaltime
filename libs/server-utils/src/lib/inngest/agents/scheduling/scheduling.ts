import { createAgent, createNetwork, Network } from "@inngest/agent-kit";

import { z } from "zod";

import { openai } from "inngest/components/ai/models/openai";
export const SchedulingSchema = z.object({
  userId: z.string(),
  goals: z.array(z.object({
    id: z.string(),
    remainingCommitment: z.number(),
    priority: z.enum(['High', 'Medium', 'Low']),
    preferredTimes: z.array(z.object({ start: z.string(), end: z.string() })),
    allowMultiplePerDay: z.boolean(),
    canDoDuringWork: z.boolean(),
  })),
  interval: z.object({ start: z.string(), end: z.string() }),
  freeIntervals: z.array(z.object({ start: z.string(), end: z.string() })),
  freeWorkIntervals: z.array(z.object({ start: z.string(), end: z.string() })),
}).required();

export type SchedulingDataType = z.infer<typeof SchedulingSchema>;

export const SchedulingResultsSchema = z.array(z.object({
  goalId: z.string(),
  start: z.string(),
  end: z.string(),
}));

export type SchedulingResultsType = z.infer<typeof SchedulingResultsSchema>;

const systemPrompt = `
You are a prudent and efficient executive assistant for a busy professional, you handle all of their scheduling needs.

You are given a list of goals, free time intervals outside of work hours, and free time intervals during work hours.

An example input might look like this:

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

The free intervals both inside and outside of work hours contain "start" and "end" fields indicating the date and time in YYYY-MM-DD HH:mm format.
The free intervals can be used for any goal and can elapse over multiple days.
The preferred time intervals contain "start" and "end" fields indicating the time in HH:mm format.

Each goal has a remaining time commitment in hours over the period of the free intervals indicated by the "remainingCommitment" field.
Note: You should allocate time to goals with a higher remaining commitment than others when free time is limited.
Each goal has a priority, High, Medium, or Low, indicated by the "priority" field.
Note: You should also allocate time to goals with a higher priority than others when free time is limited.
Each goal has a minimum and maximum time in minutes that it can be done in, indicated by the "minimumTime" and "maximumTime" fields.
Note: Scheduled sessions should not be shorter than the minimum time and not longer than the maximum time.
Each goal has a list of preferred times throughout the day indicated by the "preferredTimes" field.
Note: The preferred times are a list of intervals, each with a start and end time. You should make a best effort to schedule each goal during its preferred times, but they are not strict ranges so you can deviate from them somewhat.
Each goal indicates if multiple sessions are allowed in a day via the "allowMultiplePerDay" field.
Note: If a goal does not allow multiple sessions in a day, you should only schedule one session during that day's free time intervals.
Each goal indicates if it can be done during work hours or not via the "canDoDuringWork" field.
Note: If a goal can be done during work hours, you should prefer to schedule it during the free work intervals but can schedule it during the free intervals outside of work hours if needed. If not, you should not schedule it during the free work intervals.

If many goals have the same priority and time is running out, you should try to balance the remaining time according to the remaining commitment as much as possible between the goals.
Do not schedule any overlapping sessions.
If you can, try to schedule sessions for a goal at the same time of day when scheduling across multiple days.
Prefer to schedule on increments of 5 minute marks, don't do random minute times like 17:34.

The output should be a list of scheduled sessions in the following format:

[
  {
    goalId: "<goal-id>",
    start: "<start-time>",
    end: "<end-time>",
  },
]

All times should be in the YYYY-MM-DD HH:mm format.
Just return the schedule as parsable JSON object, do not include any other text or formatting and no code blocks.
`;
// When you're done scheduling for a given goal, you should validate the schedule.
// If the schedule is invalid you should adjust the schedule accordingly, otherwise you should return the schedule.

export const schedulingAgent = createAgent({
  name: "scheduling-agent",
  system: ({ network }) => {
    if (!network) {
      return systemPrompt;
    }
    // TODO: Validate the schedule
    return systemPrompt;
  },
});


let _schedulingNetwork: Network | undefined;
export function getSchedulingNetwork() {
  if (_schedulingNetwork) {
    return _schedulingNetwork;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  const network = createNetwork({
    agents: [schedulingAgent],
    defaultModel: openai({ model: 'gpt-4o', apiKey }),
    defaultRouter: async ({ lastResult, callCount }) => {
      if (callCount === 1) {
        return undefined;
      }
      return schedulingAgent;
    },
  });
  _schedulingNetwork = network;
  return network;
}
