import { inngestConsumer, InngestEvent } from "@/server-utils/inngest";
import { ConnectionManager } from "./manager";

export const syncToClient = inngestConsumer.createFunction({
  id: 'sync-to-client',
  concurrency: [{
    // virtual concurrency queue for this function,
    // only one sync per user at a time
    scope: "fn",
    key: "event.data.userId",
    limit: 1,
  }],
  retries: 2,
}, {
  event: InngestEvent.SyncToClient,
}, async ({ event, step }) => {
  const { userId } = event.data;
  let connection = ConnectionManager.getInstance().getConnection(userId);
  if (connection) {
    await step.run(`sync-to-client-${userId}`, async () => {
      await new Promise((resolve, reject) => {
        connection = ConnectionManager.getInstance().getConnection(userId);
        if (!connection) {
          console.error(`Connection closed by user ${userId}`);
          return;
        }
        connection.send(JSON.stringify(event.data), (error) => {
          if (error) {
            console.error(error);
            reject(error);
          }
          resolve(void 0);
        });
      });
    });
  }
});
