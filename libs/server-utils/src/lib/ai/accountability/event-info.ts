import { openai } from "@ai-sdk/openai";
import { dayjs, Interval } from "@/shared/utils";
import { CalendarEvent, UserProfile } from "@prisma/client";

import { generateText } from "ai";
import { Logger } from "inngest/middleware/logger";
import z from "zod";

import { DATE_TIME_FORMAT } from "../../inngest";
import { getPrismaClient } from "../../prisma/client";
import { buildMessages, formatEvents, zep } from "../lib";

async function getEventsTimeframe(sessionId: string): Promise<Interval> {
  const instruction = `You are to determine if the user is asking for information about event(s) in the past or future.`;
  const classes = [
    "Past event(s)",
    "Future event(s)",
  ];
  const classification = await zep.memory.classifySession(sessionId, {
    name: "event-information",
    classes,
    instruction,
  })
  const now = dayjs();
  if (classification.class === "Past event(s)") {
    return {
      start: now.subtract(7, "days").toDate(),
      end: now.toDate(),
    };
  }
  return {
    start: now.toDate(),
    end: now.add(7, "days").toDate(),
  };
}

async function getEvents(userId: string, timeframe: Interval): Promise<CalendarEvent[]> {
  const prisma = await getPrismaClient(userId);
  const events = await prisma.calendarEvent.findMany({
    where: {
      userId,
      goalId: {
        not: null,
      },
      OR: [
        {
          startTime: {
            gte: timeframe.start,
            lte: timeframe.end,
          },
        },
        {
          endTime: {
            gte: timeframe.start,
            lte: timeframe.end,
          },
        },
      ],
    },
  });
  return events;
}

export async function eventInformationAgent(logger: Logger, profile: UserProfile, sessionId: string): Promise<string> {
  const now = dayjs.tz(new Date(), profile.timezone);
  const eventTimeframe = await getEventsTimeframe(sessionId);
  const events = await getEvents(profile.userId, eventTimeframe);
  logger.info(`Timeframe:\n\tStart: ${eventTimeframe.start}\n\tEnd: ${eventTimeframe.end}`);
  logger.info(`Events: ${formatEvents(events)}`);
  // TODO: Figure out if they are asking for future or past events
  const systemPrompt = `{
    "role": "You are to answer questions about the user's events.",
    "now": "${now.format(DATE_TIME_FORMAT)}",
    "events": ${formatEvents(events)},
    "timezone": "${profile.timezone}",
    "instructions": "You are given a list of events sorted by start time within the time frame the user is asking about. All events are in the same timezone as the user.
    Answer the user's question about the event(s) they are referencing. You may use only one tool call to get the information you need and one to answer the user's question.",
    "constraints": [
      "You are to respond in 1600 characters or less.",
      "You are to respond in a colloquial and concise manner befitting an sms conversation.",
      "Don't mention the time frame or the current time in your response.",
    ]
  }`;
  logger.info(`System prompt: ${systemPrompt}`);
  const memory = await zep.memory.get(sessionId);
  const messagesToSend = buildMessages(systemPrompt, memory.messages);
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: messagesToSend,
    toolChoice: "required",
    maxSteps: 2,
    tools: {
      answer: {
        description: "Answer the user's question about the event(s) they are referencing.",
        parameters: z.object({
          answer: z.string().describe("The answer to the user's question."),
        }),
      },
      getTimeBetweenEvents: {
        description: "Get the time between two events.",
        parameters: z.object({
          timeA: z.string().describe("Time A."),
          timeB: z.string().describe("Time B."),
        }),
        execute: async (args) => {
          const timeA = dayjs(args.timeA);
          const timeB = dayjs(args.timeB);
          return `${Math.abs(timeA.diff(timeB, "minutes"))} mins`;
        },
      },
    },
  })
  const answer = response.toolCalls.find((call) => call.toolName === "answer")?.args.answer;
  if (!answer) {
    throw new Error("No answer provided");
  }
  return answer;
}
