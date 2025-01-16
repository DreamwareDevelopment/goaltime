import { openai } from "@ai-sdk/openai";
import { Session } from "@getzep/zep-cloud/api";
import { generateText } from "ai";
import { randomUUID } from "crypto";
import { Logger } from "inngest/middleware/logger";
import z from "zod";

import { Goal, UserProfile } from "@prisma/client";
import { buildMessages, zep, zepMessagesToCoreMessages } from "@/server-utils/ai";
import { inngest, InngestEvent } from "@/server-utils/inngest";
import { getPrismaClient } from "@/server-utils/prisma";
import { dayjs, NotificationPayload, NotificationType } from "@/shared/utils";
import { LLMGoal, LLMGoalSchema } from "@/shared/zod";

enum ConversationCategory {
  Information = "Asking for help or information",
  Action = "Asking for an action to be taken",
  Other = "Other",
}

enum InformationIntent {
  NeedsHelp = "Give help on how to use this agent.",
  InquireAboutGoals = "Answer questions about one or more goals.",
  InquireAboutEvents = "Answer questions about one or more events, either upcoming or past.",
}

enum ActionIntent {
  AccountabilityUpdate = "Give accountability update on an event.",
  AlterGoal = "Change scheduling preferences for a goal.",
  RescheduleEvent = "Reschedule an upcoming event.",
}

type ActionConversationIntent = {
  type: ConversationCategory.Action;
  intent: ActionIntent;
}

type InformationConversationIntent = {
  type: ConversationCategory.Information;
  intent: InformationIntent;
}

type OtherConversationIntent = {
  type: ConversationCategory.Other;
  intent: string;
}

type ConversationIntent = ActionConversationIntent | InformationConversationIntent | OtherConversationIntent;

export const WELCOME_MESSAGE = `Looks like you're new here. I'm GoalTime AI, your personal accountability assistant to keep you on track to hit all your goals. Please create an account at https://goaltime.ai`;

async function generateNotificationMessage(notification: NotificationPayload<string>) {
  const { goal, event } = notification;
  let prompt: string;
  if (notification.type === NotificationType.Before) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const minutesUntilEvent = dayjs(event.startTime!).diff(dayjs(), "minutes");
    prompt = `{
      "role": "You are a scheduling assistant. There is an event coming up.",
      "relatedGoal": ${JSON.stringify(goal, null, 2)},
      "event": ${JSON.stringify(event, null, 2)},
      "minutesUntilEvent": ${minutesUntilEvent},
      "tone": "colloquial, concise, encouraging",
      "format": "sms",
      "return": "A message informing them how long they have until the event.",
    }`;
  } else {
    prompt = `{
      "role": "You are a scheduling assistant. The user has just finished an event.",
      "event": ${JSON.stringify(event, null, 2)},
      "tone": "colloquial, concise, accountable",
      "format": "sms",
      "return": "A message asking them how it went and if they spent the entire time on the event.",
    }`;
  }
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
  })
  return response.text;
}

async function getHelpMessage(sessionId: string) {
  const memory = await zep.memory.get(sessionId);
  const messages = memory.messages;
  const systemPrompt = `{
    role: "You are to help the user understand how to use this agent. 
    Tell them the relevant capabilities of this agent or just the one relevant to them.
    You are to respond to the user in a friendly and helpful manner with concise answers befitting an sms conversation.",
    capabilities: [
      "give accountability update on an event",
      "change scheduling preferences for a goal",
      "end conversation",
      "inquiry about one or more goals",
      "inquiry about one or more events, either upcoming or past",
      "reschedule an upcoming event",
    ],
    context: "${JSON.stringify(memory.context, null, 2)}"
  }`;
  const messagesToSend = buildMessages(systemPrompt, messages);
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: messagesToSend,
  })
  return response.text;
}

async function updateUserProfile(userId: string, sessionId: string) {
  const prisma = await getPrismaClient(userId);
  await prisma.userProfile.update({
    where: {
      userId,
    },
    data: {
      lastChatSessionId: sessionId,
    },
  })
}

async function shouldStartNewSession(logger: Logger, sessionId: string, message: string) {
  const memory = await zep.memory.get(sessionId);
  const systemPrompt = `{
    "role": "You are to determine if a given message is a relevant continuation of the following conversation",
    "conversation": ${JSON.stringify(zepMessagesToCoreMessages(memory.messages), null, 2)},
    "return": "new" | "relevant"
  }`;
  const messagesToSend = buildMessages(systemPrompt, [{
    role: "user",
    content: message,
    roleType: "user",
  }]);
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: messagesToSend,
  })
  logger.info(`Response: ${response.text}`);
  return response.text === "new";
}

function formatGoal(goal: Goal): string {
  return JSON.stringify({
    title: goal.title,
    description: goal.description,
    deadline: goal.deadline,
    commitment: goal.commitment ? `${goal.commitment} hrs/wk` : null,
    preferredTimes: goal.preferredTimes,
    minimumDuration: `${goal.minimumDuration} mins`,
    maximumDuration: `${goal.maximumDuration} mins`,
  }, null, 2)
}

function formatGoals(goals: Goal[]): string {
  return JSON.stringify(goals.map(formatGoal), null, 2)
}

async function getGoals(logger: Logger, userId: string, sessionId: string): Promise<LLMGoal[]> {
  const prisma = await getPrismaClient(userId);
  const goals = await prisma.goal.findMany({
    where: {
      userId,
    },
  });
  const relevantGoals: LLMGoal[] = [];
  const memory = await zep.memory.get(sessionId);
  const systemPrompt = `{
    "role": "You are to determine if the user is asking for advice about a goal that they already have.",
    "context": ${JSON.stringify(memory.context, null, 2)},
    "goals": ${formatGoals(goals)},
  }`;
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

async function goalAdvice(logger: Logger, userId: string, sessionId: string): Promise<string> {
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

async function getDirectResponse(logger: Logger, userId: string, sessionId: string): Promise<string> {
  const memory = await zep.memory.get(sessionId);
  const systemPrompt = `{
    "role": "You are to respond to the user in a colloquial and concise manner befitting an sms conversation.",
    "return": "A response to the user's message.",
  }`;
  const messagesToSend = buildMessages(systemPrompt, memory.messages);
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: messagesToSend,
  })
  return response.text;
}

async function handleNotification(logger: Logger, profile: UserProfile, notification: NotificationPayload<string>) {
  let session: Session;
  logger.info(`Generating notification message for user ${profile.userId} with notification:\n${JSON.stringify(notification, null, 2)}`);
  const message = await generateNotificationMessage(notification);
  logger.info(`Generated notification message for user ${profile.userId}: ${message}`);
  if (notification.type === NotificationType.Before || !profile.lastChatSessionId) {
    // If this notification is before the event or there is no last chat session, we need to create a new one
    session = await zep.memory.addSession({
      sessionId: randomUUID(),
      userId: profile.userId,
      metadata: {
        goal: notification.goal,
        event: notification.event,
      },
    })
  } else {
    logger.info(`Continuing chat session for user ${profile.userId} for event ${notification.event}`);
    session = await zep.memory.getSession(profile.lastChatSessionId);
  }
  if (!session || !session.sessionId) {
    logger.error(`Failed to retrieve chat session for user ${profile.userId}`);
    throw new Error(`We couldn't find your chat session. Please try again later.`);
  }
  await zep.memory.add(session.sessionId, {
    messages: [{
      role: "assistant",
      content: message,
      roleType: "assistant",
    }],
  })
  await updateUserProfile(profile.userId, session.sessionId);
  return message;
}

async function getUpdatedSession(logger: Logger, profile: UserProfile, message: string): Promise<{ session: Session }> {
  let session: Session;
  if (!profile.lastChatSessionId) {
    // Create a new session
    const sessionId = randomUUID();
    session = await zep.memory.addSession({
      sessionId,
      userId: profile.userId,
    })
  } else {
    const startNewSession = await shouldStartNewSession(logger, profile.lastChatSessionId, message);
    if (startNewSession) {
      logger.info(`Starting new chat session for user ${profile.userId} for message ${message}`);
      session = await zep.memory.addSession({
        sessionId: randomUUID(),
        userId: profile.userId,
      })
    } else {
      logger.info(`Continuing chat session for user ${profile.userId} for message ${message}`);
      session = await zep.memory.getSession(profile.lastChatSessionId);
    }
  }
  if (!session.sessionId) {
    throw new Error(`Failed to retrieve or create chat session: ${message}`);
  }
  await zep.memory.add(session.sessionId, {
    messages: [{
      role: "user",
      content: message,
      roleType: "user",
    }],
  })
  await updateUserProfile(profile.userId, session.sessionId);
  return { session };
}

export const chat = inngest.createFunction({
  id: 'chat',
  concurrency: [{
    // One loop per user
    scope: "fn",
    key: "event.data.userId",
    limit: 1,
  }],
  retries: 0,
}, {
  event: InngestEvent.Chat,
}, async ({ event, logger, step }) => {
  const { userId, notification } = event.data;
  const prisma = await getPrismaClient(userId);
  const sessionResponse = await step.run("get-chat-session", async () => {
    const userProfile = await prisma.userProfile.findUnique({
      where: {
        userId,
      },
    });
    if (!userProfile) {
      return WELCOME_MESSAGE;
    }
    if (notification) {
      // If there is a notification, we need to generate a message to send to the user
      return await handleNotification(logger, userProfile, notification);
    }

    const message = event.data.message;
    logger.info(`Processing chat for user ${userId} with message "${message}"`);
    if (!message) {
      throw new Error("Message is required when there is no notification");
    }

    // This is a chat message from the user, not a notification
    return await getUpdatedSession(logger, userProfile, message);
  });

  if (typeof sessionResponse === "string") {
    return sessionResponse;
  }
  const { session } = sessionResponse;
  if (!session?.sessionId) {
    throw new Error("Failed to retrieve or create chat session");
  }
  const sessionId = session.sessionId;

  const agentSelection = await step.run("select-agent", async () => {
    let instruction = `Categorize the latest intent of the conversation for the user.`;
    logger.info(`Determining conversation category for user ${userId}`);
    let classes: string[] = [
      ConversationCategory.Information,
      ConversationCategory.Action,
      ConversationCategory.Other,
    ];

    const conversationClassification = await zep.memory.classifySession(sessionId, {
      name: "conversation-category",
      classes,
      persist: false,
      instruction,
    })
    logger.info(`Conversation category: "${conversationClassification.class}"`);

    logger.info(`Selecting agent for user ${userId}`);
    if (conversationClassification.class === ConversationCategory.Information) {
      instruction = `Select the agent that should provide the information given the context`;
      classes = [
        InformationIntent.NeedsHelp,
        InformationIntent.InquireAboutGoals,
        InformationIntent.InquireAboutEvents,
      ];
    } else if (conversationClassification.class === ConversationCategory.Action) {
      instruction = `Select the action that should be taken given the context`;
      classes = [
        ActionIntent.AccountabilityUpdate,
        ActionIntent.AlterGoal,
        ActionIntent.RescheduleEvent,
      ];
    } else {
      return { type: ConversationCategory.Other, intent: "" };
    }

    const intentClassification = await zep.memory.classifySession(sessionId, {
      name: "intent",
      classes,
      persist: false,
      instruction,
    })
    return { type: conversationClassification.class, intent: intentClassification.class };
  })


  const { type, intent } = agentSelection;
  let response: string;
  if (type === ConversationCategory.Information) {
    switch (intent) {
      case InformationIntent.NeedsHelp:
        logger.info(`User ${userId} needs help using this agent`);
        response = await step.ai.wrap("get-help", getHelpMessage, sessionId);
        break;
      case InformationIntent.InquireAboutGoals:
        logger.info(`Asking for advice regarding a goal for user ${userId}`);
        response = await step.ai.wrap("get-goal-advice", goalAdvice, logger, userId, sessionId);
        break;
      case InformationIntent.InquireAboutEvents:
        logger.info(`Asking for advice regarding an event for user ${userId}`);
        response = `Asking for advice regarding an event`;
        break;
    }
  } else if (type === ConversationCategory.Action) {
    switch (intent) {
      case ActionIntent.AccountabilityUpdate:
        logger.info(`Giving accountability update for user ${userId}`);
        response = `Giving accountability update`;
        break;
      case ActionIntent.AlterGoal:
        logger.info(`Changing a goal for user ${userId}`);
        response = `Changing a goal`;
        break;
      case ActionIntent.RescheduleEvent:
        logger.info(`Rescheduling upcoming event for user ${userId}`);
        response = `Rescheduling upcoming event`;
        break;
      default:
        logger.info(`Unknown intent for user ${userId}`);
        response = `Not implemented`;
        break;
    }
  } else {
    logger.info(`Unknown intent for user ${userId}`);
    response = await step.ai.wrap("direct-response", getDirectResponse, logger, userId, sessionId);
  }
  await step.run("store-response", async () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await zep.memory.add(session.sessionId!, {
      messages: [{
        role: "assistant",
        content: response,
        roleType: "assistant",
      }],
    })
  })
  return response;
});
