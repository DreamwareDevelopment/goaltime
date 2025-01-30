import { getTokenInfo, refreshTokenIfNeeded, TokenInfo } from '@/ui-components/hooks/supabase'

interface WebSocketClientOptions {
  onOpen: () => void
  onMessage: (event: MessageEvent) => void
  onError: (error: Event) => void
}

export class WebSocketClient {
  private tokenInfo: TokenInfo | null = null
  private socket: WebSocket | null = null
  private reconnectIntervalRef: number | null = null
  private reconnectOffset = 5000
  private connectionTimeout = 10000
  private options!: WebSocketClientOptions

  private static _instance: WebSocketClient
  public static getInstance() {
    if (!this._instance) {
      this._instance = new WebSocketClient()
    }
    return this._instance
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public async init() {
    if (!this.tokenInfo) {
      this.tokenInfo = await getTokenInfo()
    }
    return this
  }

  public async connect(options: WebSocketClientOptions) {
    if (!this.tokenInfo) {
      throw new Error('Invariant: Token info not initialized')
    }
    if (this.socket) {
      return;
    }
    this.tokenInfo = await refreshTokenIfNeeded(this.tokenInfo)
    console.log('Connecting to WebSocket...')
    const host = process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL
    if (!host) {
      throw new Error('NEXT_PUBLIC_WEBSOCKET_SERVER_URL is not set')
    }
    const url = `${host}/register?access_token=${this.tokenInfo.accessToken}`
    this.options = options

    this.socket = new WebSocket(url)
    this.socket.onmessage = options.onMessage
    this.socket.onclose = this.handleSocketClose.bind(this)
    await new Promise((resolve, reject) => {
      if (this.socket) {
        const handleOpen = () => {
          this.socket?.addEventListener('error', options.onError)
          this.socket?.removeEventListener('open', handleOpen);
          options.onOpen()
          resolve(void 0);
        };

        const handleError = (error: Event) => {
          this.socket?.removeEventListener('error', handleError);
          reject(error);
        };

        this.socket.addEventListener('open', handleOpen);
        this.socket.addEventListener('error', handleError);

        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timed out'));
          this.socket?.removeEventListener('open', handleOpen);
          this.socket?.removeEventListener('error', handleError);
        }, this.connectionTimeout);

        const cleanup = () => {
          clearTimeout(timeout);
          this.socket?.removeEventListener('open', handleOpen);
          this.socket?.removeEventListener('error', handleError);
        };

        this.socket.addEventListener('close', cleanup);
      } else {
        reject(new Error('WebSocket instance not initialized'));
      }
    });
  }

  private handleSocketClose(event: CloseEvent) {
    console.log('WebSocket connection closed:', event.reason)
    this.reconnect()
  }

  private reconnect() {
    if (this.reconnectIntervalRef) {
      console.log('Already reconnecting')
      return
    }
    if (!this.options) {
      throw new Error('WebSocket options not initialized')
    }
    
    const reconnectAttempt = async () => {
      this.socket = null;
      if (!this.reconnectIntervalRef) {
        throw new Error('Invariant: Reconnect timeout not initialized during reconnect')
      }
      console.log('Reconnecting...')
      try {
        await this.connect(this.options)
      } catch (error) {
        console.error('Failed to reconnect to WebSocket:', error)
      }
      clearInterval(this.reconnectIntervalRef)
      this.reconnectIntervalRef = null
    }

    this.reconnectIntervalRef = setInterval(reconnectAttempt, this.connectionTimeout + this.reconnectOffset) as unknown as number
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
}
