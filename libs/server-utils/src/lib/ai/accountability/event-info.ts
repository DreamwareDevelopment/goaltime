import { openai } from "@ai-sdk/openai";
import { dayjs, DATE_TIME_FORMAT, Interval } from "@/shared/utils";
import { CalendarEvent, UserProfile } from "@prisma/client";

import { generateText } from "ai";
import { Logger } from "inngest/middleware/logger";

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
    orderBy: {
      startTime: "asc",
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
    Answer the user's question about the event(s) they are referencing.",
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
  })
  return response.text;
}
