import { openai } from "@ai-sdk/openai";
import { CalendarEvent, Goal, UserProfile } from "@prisma/client";
import { dayjs, DATE_TIME_FORMAT } from "@/shared/utils";

import { CoreMessage, generateText } from "ai";
import { Jsonify } from "inngest/helpers/jsonify";
import { Logger } from "inngest/middleware/logger";
import z from "zod";

import { getPrismaClient } from "../../prisma/client";
import { buildMessages, formatEvent, formatGoal, zep } from "../lib";
import { formatUser } from "../lib/user";

async function updateAccountability(
  logger: Logger,
  sessionId: string,
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
  completed: number
): Promise<{ goal: Jsonify<Goal>, event: Jsonify<CalendarEvent> }> {
  logger.info(`Updating accountability for goal ${goal.id} with ${completed} minutes completed`);
  const prisma = await getPrismaClient();
  const hoursCompleted = goal.completed + (completed / 60);
  await prisma.$transaction(async (tx) => {
    await tx.goal.update({
      where: {
        id: goal.id,
        userId: profile.userId,
      },
      data: {
        completed: hoursCompleted,
      },
    });
    await tx.calendarEvent.update({
      where: {
        id: event.id,
      },
      data: {
        completed: event.completed + completed, // Event completed is in minutes
      },
    });
  });
  goal.completed = hoursCompleted;
  event.completed = event.completed + completed;
  await zep.memory.updateSession(sessionId, {
    metadata: {
      goal,
      event,
    },
  });
  return { goal, event };
}

async function completedGoal(
  logger: Logger,
  messages: CoreMessage[],
  profile: UserProfile,
  goal: Jsonify<Goal>,
): Promise<string> {
  logger.info(`Goal "${goal.title}" completed`);
  const systemPrompt = `{
    "role": "You are an accountability agent that congratulates the user for completing a goal.",
    "user": ${formatUser(profile)},
    "goal": ${formatGoal(goal)},
  }`
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
  });
  return response.text;
}

async function completedEvent(
  logger: Logger,
  messages: CoreMessage[],
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
): Promise<string> {
  logger.info(`Goal ${goal.id} completed extra`);
  const systemPrompt = `{
    "role": "You are an accountability agent that congratulates the user for completing an event.",
    "tone": "Congratulatory, but not overly so",
    "user": ${formatUser(profile)},
    "goal": ${formatGoal(goal)},
    "event": ${formatEvent(event)},
    "completed": "${event.duration} mins",
    "target": "${event.duration} mins",
  }`
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
  });
  return response.text;
}

async function completedSome(
  logger: Logger,
  messages: CoreMessage[],
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
  completed: number,
): Promise<string> {
  logger.info(`Goal ${goal.id} completed extra`);
  const systemPrompt = `{
    "role": "You are an accountability agent that recognizes the user for completing some of an event and encourages them to do better next time.",
    "user": ${formatUser(profile)},
    "goal": ${formatGoal(goal)},
    "event": ${formatEvent(event)},
    "completed": "${completed} mins",
    "target": "${event.duration} mins",
  }`
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
  });
  return response.text;
}

async function notCompleted(
  logger: Logger,
  messages: CoreMessage[],
  profile: UserProfile,
  goal: Jsonify<Goal>,
  event: Jsonify<CalendarEvent>,
): Promise<string> {
  logger.info(`Goal ${goal.id} not completed`);
  const systemPrompt = `{
    "role": "You are an accountability agent that informs the user that they did not complete an event and encourages them to do better next time.",
    "user": ${formatUser(profile)},
    "goal": ${formatGoal(goal)},
    "event": ${formatEvent(event)},
    "target": "${event.duration} mins",
  }`
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
  });
  return response.text;
}

export async function accountabilityUpdateAgent(logger: Logger, profile: UserProfile, sessionId: string): Promise<{ response: string, goal: Jsonify<Goal> }> {
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
  let event = session.metadata.event as Jsonify<CalendarEvent>;
  if (!event.duration) {
    throw new Error("Event duration not found");
  }
  if (!session.metadata.goal) {
    throw new Error("Session goal not found");
  }
  let goal = session.metadata.goal as Jsonify<Goal>;
  logger.info(`Session goal: ${goal.title}\n${dayjs(event.startTime).format(DATE_TIME_FORMAT)} - ${dayjs(event.endTime).format(DATE_TIME_FORMAT)}`);


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
  const completed = response.toolCalls[0].args.answer;
  ({ goal, event } = await updateAccountability(logger, sessionId, profile, goal, event, completed));
  const chatMessages = messages.slice(1);
  let userResponse = '';
  if (completed <= 0) {
    userResponse = await notCompleted(logger, chatMessages, profile, goal, event);
    return { response: userResponse, goal };
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (goal.completed >= (goal.commitment ?? goal.estimate!)) {
    userResponse = await completedGoal(logger, chatMessages, profile, goal);
    return { response: userResponse, goal };
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (event.completed >= event.duration!) {
    userResponse = await completedEvent(logger, chatMessages, profile, goal, event);
    return { response: userResponse, goal };
  }
  userResponse = await completedSome(logger, chatMessages, profile, goal, event, completed);
  return { response: userResponse, goal };
}
