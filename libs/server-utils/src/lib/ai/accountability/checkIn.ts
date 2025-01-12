// import { Logger } from "inngest/middleware/logger";

import { getPrismaClient } from "../../prisma/client";
import { inngest, InngestEvent } from "../../inngest";
import { sendSMS } from "../tools/sendMessage";
import { NotificationDestination, NotificationPayload } from "@/shared/utils";

export const checkIn = inngest.createFunction(
  {
    id: 'check-in',
    concurrency: [{
      // global concurrency queue for this function,
      // limit to 5 concurrent syncs as per the free tier quota
      scope: "fn",
      key: "checkIn",
      limit: 5,
    }],
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
    for (const user of users) {
      const notification = notificationLookup[user.userId];
      const settings = notification.settings;
      const event = notification.event;
      await step.run(`check-in-${user.userId}`, async () => {
        switch (notification.destination) {
          case NotificationDestination.SMS:
            await sendSMS(settings.phone, `It's ${settings.textBefore} minutes until ${event.title}, are you ready?`);
            break;
          default:
            logger.error(`Unsupported notification destination: ${notification.destination}`);
            break; // Don't throw and stop notifications for other users
        }
      });
    }
  },
);
