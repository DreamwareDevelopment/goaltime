import { openai } from "@ai-sdk/openai";
import { Session } from "@getzep/zep-cloud/api";
import { CalendarEvent, Goal, UserProfile } from "@prisma/client";

import { generateText } from "ai";
import { Jsonify } from "inngest/helpers/jsonify";
import { Logger } from "inngest/middleware/logger";
import z from "zod";

import { getPrismaClient } from "../../prisma/client";
import { buildMessages, formatEvent, zep } from "../lib";

async function updateAccountability(
  logger: Logger,
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
  completed: number
): Promise<number> {
  logger.info(`Updating accountability for goal ${goal.id} with ${completed} minutes completed`);
  const prisma = await getPrismaClient();
  await prisma.$transaction(async (tx) => {
    await tx.goal.update({
      where: {
        id: goal.id,
        userId: profile.userId,
      },
      data: {
        completed: goal.completed + completed,
      },
    });
    await tx.calendarEvent.update({
      where: {
        id: event.id,
      },
      data: {
        completed: event.completed + completed,
      },
    });
  });
  return goal.completed + completed;
}

async function completedGoal(
  logger: Logger,
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
  session: Session,
): Promise<string> {
  logger.info(`Goal ${goal.id} completed`);
  return "success";
}

async function completedExtra(
  logger: Logger,
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
  session: Session,
): Promise<string> {
  logger.info(`Goal ${goal.id} completed extra`);
  return "success";
}

async function completedAll(
  logger: Logger,
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
  session: Session,
): Promise<string> {
  logger.info(`Goal ${goal.id} completed all`);
  return "success";
}

async function completedSome(
  logger: Logger,
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
  session: Session,
): Promise<string> {
  logger.info(`Goal ${goal.id} partially completed`);
  return "success";
}

async function notCompleted(
  logger: Logger,
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
  session: Session,
): Promise<string> {
  logger.info(`Goal ${goal.id} not completed`);
  return "success";
}

export async function accountabilityAgent(logger: Logger, profile: UserProfile, sessionId: string): Promise<string> {
  const session = await zep.memory.getSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }
  if (!session.metadata) {
    throw new Error("Session metadata not found");
  }
  if (!session.metadata.event) {
    throw new Error("Session event not found");
  }
  if (!session.metadata.goal) {
    throw new Error("Session goal not found");
  }

  const event = session.metadata.event as Jsonify<CalendarEvent>;
  if (!event.duration) {
    throw new Error("Event duration not found");
  }

  const systemPrompt = `{
    "role": "You are an accountability agent that determines how much time, if any, the user has completed given the latest message.",
    "event": ${formatEvent(event)},
  }`
  const memory = await zep.memory.get(sessionId);
  const messages = buildMessages(systemPrompt, memory.messages);
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages,
    toolChoice: "required",
    tools: {
      answer: {
        name: "answer",
        description: "Return the number of minutes the user has completed",
        parameters: z.object({
          answer: z.number().describe("The number of minutes the user has completed"),
        }),
      },
    },
  });
  const goal = session.metadata.goal as Jsonify<Goal>;
  const completed = response.toolCalls[0].args.answer;
  const totalCompleted = await updateAccountability(logger, profile, goal, event, completed);
  if (completed <= 0) {
    return await notCompleted(logger, profile, goal, event, session);
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (totalCompleted >= (goal.commitment ?? goal.estimate!)) {
    return await completedGoal(logger, profile, goal, event, session);
  }
  if (completed > event.duration) {
    return await completedExtra(logger, profile, goal, event, session);
  }
  if (completed === event.duration) {
    return await completedAll(logger, profile, goal, event, session);
  }
  return await completedSome(logger, profile, goal, event, session);
}
