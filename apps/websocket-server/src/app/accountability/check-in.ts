// import { Logger } from "inngest/middleware/logger";

import { getPrismaClient } from "@/server-utils/prisma";
import { inngestConsumer, InngestEvent } from "@/server-utils/inngest";
import { sendSMS } from "@/server-utils/ai";
import { NotificationDestination, NotificationPayload } from "@/shared/utils";
import { chat } from "./chat";

// TODO: Remove this function, I think we can just use the chat function inside the accountability loop
export const checkIn = inngestConsumer.createFunction(
  {
    id: 'check-in',
    retries: 1,
  },
  [{
    event: InngestEvent.CheckIn,
  }],
  async ({ step, event, logger }) => {
    logger.info(`Checking in`);
    const events = event.data.data;
    if (!events.length) {
      logger.info(`No events found, skipping`);
      return;
    }
    const userIds = events.map((event) => event.settings.userId);
    const prisma = await getPrismaClient();
    // TODO: Might not have to get profiles here if Zep can resolve the user from the events
    const users = await prisma.userProfile.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });
    if (!users || !users.length) {
      throw new Error(`Users not found`);
    }
    const notificationLookup = events.reduce((acc, event) => {
      acc[event.settings.userId] = event;
      return acc;
    }, {} as Record<string, NotificationPayload<string>>);
    // TODO: Refactor this to use less step calls
    for (const user of users) {
      const notification = notificationLookup[user.userId];
      const settings = notification.settings;
      const message = await step.invoke('get-notification-message', {
        function: chat,
        data: {
          userId: user.userId,
          notification,
        },
      });
      await step.run(`check-in-${user.userId}`, async () => {
        switch (notification.destination) {
          case NotificationDestination.SMS:
            await sendSMS(settings.phone, message);
            break;
          default:
            logger.error(`Unsupported notification destination: ${notification.destination}`);
            break; // Don't throw and stop notifications for other users
        }
      });
    }
  },
);
