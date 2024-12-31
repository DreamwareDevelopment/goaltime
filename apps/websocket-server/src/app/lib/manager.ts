import { WebSocket } from 'ws';

// TODO: This should be backed by redis when we scale out
// Also, with redis, we would be able to detect if the user is online
// before sending them a sync event that we pay for even if they are offline
// Last point about scaling, we should keep this service simple so we can migrate to Go
export class ConnectionManager {
  private static instance: ConnectionManager;
  private connections: Map<string, WebSocket> = new Map();

  static getInstance() {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  addConnection(userId: string, socket: WebSocket) {
    this.connections.set(userId, socket);
    console.log(`Current number of connections: ${this.connections.size}`)
  }

  removeConnection(userId: string) {
    this.connections.delete(userId);
    console.log(`Current number of connections: ${this.connections.size}`)
  }

  getConnection(userId: string) {
    return this.connections.get(userId);
  }
}
