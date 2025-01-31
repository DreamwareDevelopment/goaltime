import { LLMGoal, LLMGoalSchema } from "@/shared/zod";
import { Logger } from "inngest/middleware/logger";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

import { getPrismaClient } from "../../prisma/client";
import { buildMessages, formatGoals, zep } from "../lib";
import z from "zod";

async function getGoals(logger: Logger, userId: string, sessionId: string): Promise<LLMGoal[]> {
  const prisma = await getPrismaClient(userId);
  const goals = await prisma.goal.findMany({
    where: {
      userId,
    },
  });
  const relevantGoals: LLMGoal[] = [];
  const memory = await zep.memory.get(sessionId);
  const systemPrompt = JSON.stringify({
    role: "You are to determine if the user is asking for advice about a goal that they already have.",
    context: JSON.stringify(memory.context, null, 2),
    goals: formatGoals(goals),
  }, null, 2);
  const messagesToSend = buildMessages(systemPrompt, memory.messages);
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: messagesToSend,
    toolChoice: "required",
    tools: {
      answer: {
        description: "Give the goal(s) that the user is referencing.",
        parameters: z.object({
          answer: z.array(LLMGoalSchema).nullable().optional(),
        }),
      },
    },
  })
  for (const g of response.toolCalls[0].args.answer ?? []) {
    logger.info(`Relevant goal: ${JSON.stringify(g, null, 2)}`);
    relevantGoals.push(g);
  }
  return relevantGoals;
}

export async function goalInformationAgent(logger: Logger, userId: string, sessionId: string): Promise<string> {
  const goals = await getGoals(logger, userId, sessionId);
  if (goals.length === 0) {
    return "I couldn't find any relevant goals for you. Please create a goal first.";
  }
  const systemPrompt = `{
    "role": "You are to assist the user with their goal(s).
    You should respond to each goal individually as colloquially as possible.
    Only give the user what they asked for. Do not over-explain or advise them on any thing other than what they asked for.",
    "capabilities": [
      "Help the user understand what their goal means for their life.",
      "Suggest realistic ways to achieve their goal steadily over time.",
      "Suggest best practices related to their goal.",
      "Give relevant examples of how others have achieved similar goals.",
      "Recommend tools or resources that can help them achieve their goal.",
      "Provide motivational quotes or stories to inspire them.",
      "Offer tips on how to stay consistent and motivated.",
      "Encourage self-reflection and goal-setting.",
      "Provide emotional support and encouragement.",
    ],
    "constraints": [
      "Respond in 1600 characters or less.",
      "Answers should be appropriate for sms conversations.",
    ],
    "goals": ${JSON.stringify(goals, null, 2)},
  }`;
  const memory = await zep.memory.get(sessionId);
  const messagesToSend = buildMessages(systemPrompt, memory.messages);
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: messagesToSend,
  })
  return response.text;
}
