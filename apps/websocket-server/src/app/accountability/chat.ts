import { inngest, InngestEvent } from "@/server-utils/inngest";
import { zep } from "@/server-utils/ai";
import { openai } from "@ai-sdk/openai";
import { getPrismaClient } from "@/server-utils/prisma";
import { randomUUID } from "crypto";
import { Session } from "@getzep/zep-cloud/api";
import { NotificationPayload, NotificationType } from "@/shared/utils";
import { CoreMessage, generateText } from "ai";

enum Intent {
  AccountabilityUpdate = "Give accountability update on an event.",
  AlterGoal = "Change scheduling preferences for a goal.",
  EndConversation = "End conversation.",
  InquireAboutGoals = "Answer questions about one or more goals.",
  InquireAboutEvents = "Answer questions about one or more events, either upcoming or past.",
  NeedsHelp = "Give help on how to use this agent.",
  RescheduleEvent = "Reschedule an upcoming event.",
}

export const WELCOME_MESSAGE = `Looks like you're new here. I'm GoalTime AI, your personal accountability assistant to keep you on track to hit all your goals. Please create an account at https://goaltime.ai`;

async function generateMessage(notification: NotificationPayload<string>) {
  const { goal, event } = notification;
  let prompt: string;
  if (notification.type === NotificationType.Before) {
    prompt = `You are a helpful scheduling assistant. There is an event coming up.
    Event: ${event}
    Minutes before event: ${goal}
    Return a message informing them how long they have until the event.
    `;
  } else {
    prompt = `You are a helpful scheduling assistant. The user has just finished an event.
    Event: ${event.title}
    Return a message asking them how it went and if they spent the entire time on the event.
    `;
  }
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
  })
  return response.text;
}

async function getHelpMessage(session: Session) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const memory = await zep.memory.get(session.sessionId!);
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
  const messagesToSend: CoreMessage[] = []
  messagesToSend.push({
    role: "system",
    content: systemPrompt,
  })
  if (messages) {
    for (const message of messages) {
      if (message.role === "user" || message.role === "assistant") {
        messagesToSend.push({
          role: message.role,
          content: message.content,
        })
      }
    }
  }
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

async function shouldStartNewSession(sessionId: string, message: string) {
  // TODO: Just use AI SDK to classify this along with the history
  const classification = await zep.memory.classifySession(sessionId, {
    name: "chat-session-classification",
    classes: ["relevant", "new"],
    persist: true,
    instruction: `
    {
      role: "You are to determine if the following message is relevant to the existing conversation or should be the start of a new conversation.",
      message: {
        content: ${message},
        role: "user",
      }
    }`,
  })
  return classification.class === "new";
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
  let message = event.data.message;
  const { userId, notification } = event.data;
  logger.info(`Processing chat for user ${userId} with message "${message}" and notification:\n${JSON.stringify(notification, null, 2)}`);
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
  
    let session: Session;
    if (notification) {
      // If there is a notification, we need to generate a message to send to the user
      message = await generateMessage(notification);
      if (notification.type === NotificationType.Before || !userProfile.lastChatSessionId) {
        // If this notification is before the event or there is no last chat session, we need to create a new one
        session = await zep.memory.addSession({
          sessionId: randomUUID(),
          userId,
          metadata: {
            goal: notification.goal,
            event: notification.event,
          },
        })
      } else {
        logger.info(`Continuing chat session for user ${userId} for event ${notification.event}`);
        session = await zep.memory.getSession(userProfile.lastChatSessionId);
      }
      if (!session || !session.sessionId) {
        logger.error(`Failed to retrieve chat session for user ${userId}`);
        return `We couldn't find your chat session. Please try again later.`;
      }
      await zep.memory.add(session.sessionId, {
        messages: [{
          role: "assistant",
          content: message,
          roleType: "assistant",
        }],
      })
      await updateUserProfile(userId, session.sessionId);
      return message;
    }
    if (!message) {
      throw new Error("Message is required when there is no notification");
    }
    // This is a chat message from the user, not a notification
    if (!userProfile.lastChatSessionId) {
      // Create a new session
      const sessionId = randomUUID();
      session = await zep.memory.addSession({
        sessionId,
        userId,
      })
    } else {
      const startNewSession = await shouldStartNewSession(userProfile.lastChatSessionId, message);
      if (startNewSession) {
        logger.info(`Starting new chat session for user ${userId} for message ${message}`);
        session = await zep.memory.addSession({
          sessionId: randomUUID(),
          userId,
        })
      } else {
        logger.info(`Continuing chat session for user ${userId} for message ${message}`);
        session = await zep.memory.getSession(userProfile.lastChatSessionId);
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
    await updateUserProfile(userId, session.sessionId);
    return { session };
  });
  if (typeof sessionResponse === "string") {
    return sessionResponse;
  }
  const { session } = sessionResponse;
  if (!session.sessionId) {
    throw new Error("Failed to retrieve or create chat session");
  }

  const agentSelection = await step.run("select-agent", async () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const memory = await zep.memory.get(session.sessionId!)
    logger.info(`Context:\n${JSON.stringify(memory.context, null, 2)}`);
    const instruction = `Select the agent that should respond given the context`;
    logger.info(`Selecting agent for user ${userId} with instruction:\n${instruction}`);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const classification = await zep.memory.classifySession(session.sessionId!, {
      name: "intent",
      classes: [
        Intent.AccountabilityUpdate,
        Intent.AlterGoal,
        Intent.EndConversation,
        Intent.InquireAboutEvents,
        Intent.InquireAboutGoals,
        Intent.NeedsHelp,
        Intent.RescheduleEvent,
      ],
      persist: false,
      instruction,
    })
    return classification.class;
  })

  logger.info(`Session metadata:\n${JSON.stringify(session.metadata, null, 2)}`);
  let response: string;
  switch (agentSelection) {
    case Intent.AccountabilityUpdate:
      logger.info(`Giving accountability update for user ${userId}`);
      response = `Giving accountability update`;
      break;
    case Intent.AlterGoal:
      logger.info(`Changing a goal for user ${userId}`);
      response = `Changing a goal`;
      break;
    case Intent.InquireAboutEvents:
      logger.info(`Inquiring about events for user ${userId}`);
      response = `Inquiring about events`;
      break;
    case Intent.InquireAboutGoals:
      logger.info(`Asking for advice regarding a goal for user ${userId}`);
      response = `Asking for advice regarding a goal`;
      break;
    case Intent.EndConversation:
      logger.info(`Ending conversation for user ${userId}`);
      response = `Ending conversation`;
      break;
    case Intent.NeedsHelp:
      logger.info(`User ${userId} needs help using this agent`);
      response = await getHelpMessage(session);
      break;
    case Intent.RescheduleEvent:
      logger.info(`Rescheduling upcoming event for user ${userId}`);
      response = `Rescheduling upcoming event`;
      break;
    default:
      logger.info(`Unknown intent for user ${userId}`);
      response = `Not implemented`;
      break;
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
