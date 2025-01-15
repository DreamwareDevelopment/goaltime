import { inngest, InngestEvent } from "@/server-utils/inngest";
import { zep } from "@/server-utils/ai";
import { openai } from "@ai-sdk/openai";
import { getPrismaClient } from "@/server-utils/prisma";
import { randomUUID } from "crypto";
import { Session } from "@getzep/zep-cloud/api";
import { NotificationPayload, NotificationType } from "@/shared/utils";
import { generateText } from "ai";

enum Intent {
  RescheduleUpcomingEvent = "reschedule an upcoming event",
  InquireAboutEvents = "inquiry about one or more events, either upcoming or past",
  GiveAccountabilityUpdateOnLastEvent = "give accountability update on last event",
  ChangeSchedulingPreferencesForAGoal = "change scheduling preferences for a goal",
  AskForAdviceRegardingAGoal = "ask for advice regarding a goal",
  EndConversation = "end conversation",
  Other = "other",
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

async function shouldStartNewSession(sessionId: string, message: string, notification?: NotificationPayload<string>) {
  const classification = await zep.memory.classifySession(sessionId, {
    name: "chat-session-classification",
    classes: ["continue", "new"],
    persist: false,
    instruction: `Determine if the following message is a continuation of the last conversation or should be the start of a new conversation: {
      message: {
        content: ${message},
        role: ${notification ? "assistant" : "user"},
      }${notification ? `,
      metadata: {
        goal: ${notification.goal},
        event: ${notification.event},
      }` : ""}
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
        // If this notification is after the event, we need to get the last chat session
        const startNewSession = await shouldStartNewSession(userProfile.lastChatSessionId, message, notification);
        if (startNewSession) {
          logger.info(`Starting new chat session for user ${userId} for event ${notification.event}`);
          session = await zep.memory.addSession({
            sessionId: randomUUID(),
            userId,
          })
        } else {
          logger.info(`Continuing chat session for user ${userId} for event ${notification.event}`);
          session = await zep.memory.getSession(userProfile.lastChatSessionId);
        }
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
        Intent.RescheduleUpcomingEvent,
        Intent.InquireAboutEvents,
        Intent.GiveAccountabilityUpdateOnLastEvent,
        Intent.ChangeSchedulingPreferencesForAGoal,
        Intent.AskForAdviceRegardingAGoal,
        Intent.EndConversation,
        Intent.Other,
      ],
      persist: false,
      instruction,
    })
    return classification.class;
  })

  logger.info(`Session metadata:\n${JSON.stringify(session.metadata, null, 2)}`);
  switch (agentSelection) {
    case Intent.RescheduleUpcomingEvent:
      logger.info(`Rescheduling upcoming event for user ${userId}`);
      return `Rescheduling upcoming event`;
    case Intent.InquireAboutEvents:
      logger.info(`Inquiring about events for user ${userId}`);
      return `Inquiring about events`;
    case Intent.GiveAccountabilityUpdateOnLastEvent:
      logger.info(`Giving accountability update on last event for user ${userId}`);
      return `Giving accountability update on last event`;
    case Intent.ChangeSchedulingPreferencesForAGoal:
      logger.info(`Changing scheduling preferences for a goal for user ${userId}`);
      return `Changing scheduling preferences for a goal`;
    case Intent.AskForAdviceRegardingAGoal:
      logger.info(`Asking for advice regarding a goal for user ${userId}`);
      return `Asking for advice regarding a goal`;
    case Intent.EndConversation:
      logger.info(`Ending conversation for user ${userId}`);
      return `Ending conversation`;
    case Intent.Other:
      logger.info(`Other intent for user ${userId}`);
      return `Other intent`;
    default:
      logger.info(`Unknown intent for user ${userId}`);
      return `Not implemented`;
  }

  return `Reached the end of the chat function`;
});
