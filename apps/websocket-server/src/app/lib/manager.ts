import { WebSocket } from 'ws';

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
  }

  removeConnection(userId: string) {
    this.connections.delete(userId);
  }

  getConnection(userId: string) {
    return this.connections.get(userId);
  }
}
