// import { Logger } from "inngest/middleware/logger";

import { getPrismaClient } from "../../prisma/client";
import { inngest, InngestEvent } from "../../inngest";
import { sendSMS } from "../tools/sendMessage";

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
    await step.run('check-in', async () => {
      logger.info(`Sending SMS to ${users.map((user) => user.name).join(', ')}`);
      await sendSMS(`+17379772512`, `Check in for ${users.map((user) => user.name).join(', ')}`);
    });
  },
);
