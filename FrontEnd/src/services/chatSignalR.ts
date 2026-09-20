import * as signalR from '@microsoft/signalr'
import type { ChatMessageDto } from './chatService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001'

class ChatSignalRService {
  private connection: signalR.HubConnection | null = null
  private isConnecting = false

  public getConnection(): signalR.HubConnection | null {
    return this.connection
  }

  public async startConnection(): Promise<void> {
    const token = localStorage.getItem('access_token')
    if (!token) return

    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return
    }

    if (this.isConnecting) return

    this.isConnecting = true

    try {
      if (!this.connection) {
        this.connection = new signalR.HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/hubs/chat`, {
            accessTokenFactory: () => localStorage.getItem('access_token') || '',
            skipNegotiation: false,
            transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
          .configureLogging(signalR.LogLevel.Information)
          .build()
      }

      if (this.connection.state === signalR.HubConnectionState.Disconnected) {
        await this.connection.start()
        console.log('[SignalR Chat] Connected successfully!')
      }
    } catch (err) {
      console.error('[SignalR Chat] Connection error:', err)
    } finally {
      this.isConnecting = false
    }
  }

  public async stopConnection(): Promise<void> {
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      try {
        await this.connection.stop()
        console.log('[SignalR Chat] Disconnected')
      } catch (err) {
        console.error('[SignalR Chat] Stop error:', err)
      }
    }
    this.connection = null
  }

  public isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }

  public async joinRoom(roomId: number): Promise<void> {
    if (!this.isConnected()) {
      await this.startConnection()
    }
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('JoinRoom', roomId)
        console.log(`[SignalR Chat] Joined room ${roomId}`)
      } catch (err) {
        console.warn(`[SignalR Chat] JoinRoom ${roomId} failed:`, err)
      }
    }
  }

  public async joinRooms(roomIds: number[]): Promise<void> {
    if (!this.isConnected()) {
      await this.startConnection()
    }
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return
    for (const id of roomIds) {
      if (id) {
        await this.joinRoom(id)
      }
    }
  }

  public async leaveRoom(roomId: number): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('LeaveRoom', roomId)
      } catch (err) {
        console.warn(`[SignalR Chat] LeaveRoom ${roomId} failed:`, err)
      }
    }
  }

  public onReconnected(handler: (connectionId?: string) => void): () => void {
    if (!this.connection) return () => {}
    this.connection.onreconnected(handler)
    return () => {}
  }

  public async sendTyping(roomId: number, isTyping: boolean): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('SendTyping', roomId, isTyping)
      } catch (err) {
        console.warn(`[SignalR Chat] SendTyping failed:`, err)
      }
    }
  }

  // Event handlers
  public onReceiveMessage(handler: (message: ChatMessageDto) => void): () => void {
    if (!this.connection) return () => {}
    this.connection.on('ReceiveMessage', handler)
    return () => this.connection?.off('ReceiveMessage', handler)
  }

  public onMessageRead(handler: (roomId: number, userId: number, readAt: string) => void): () => void {
    if (!this.connection) return () => {}
    this.connection.on('MessageRead', handler)
    return () => this.connection?.off('MessageRead', handler)
  }

  public onMessageReacted(handler: (roomId: number, messageId: number, userId: number, emoji: string) => void): () => void {
    if (!this.connection) return () => {}
    this.connection.on('MessageReacted', handler)
    return () => this.connection?.off('MessageReacted', handler)
  }

  public onUserTyping(handler: (roomId: number, userId: number, isTyping: boolean) => void): () => void {
    if (!this.connection) return () => {}
    this.connection.on('UserTyping', handler)
    return () => this.connection?.off('UserTyping', handler)
  }

  public onMessageEdited(handler: (message: ChatMessageDto) => void): () => void {
    if (!this.connection) return () => {}
    this.connection.on('MessageEdited', handler)
    this.connection.on('MessageUpdated', handler)
    return () => {
      this.connection?.off('MessageEdited', handler)
      this.connection?.off('MessageUpdated', handler)
    }
  }

  public onMessageDeleted(handler: (roomId: number, messageId: number) => void): () => void {
    if (!this.connection) return () => {}
    this.connection.on('MessageDeleted', handler)
    return () => this.connection?.off('MessageDeleted', handler)
  }
}

export const chatSignalR = new ChatSignalRService()
export default chatSignalR
