import * as signalR from '@microsoft/signalr';
import type { NotificationItem } from '@/types/notification.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001';

class NotificationSignalRService {
  private connection: signalR.HubConnection | null = null;
  private onNotificationCallbacks: ((item: NotificationItem) => void)[] = [];
  private onUnreadCountCallbacks: ((count: number) => void)[] = [];
  private isStarting = false;

  public async start(): Promise<void> {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) return;
    if (this.isStarting) return;

    this.isStarting = true;

    try {
      if (this.connection) {
        try {
          await this.connection.stop();
        } catch {
          // Ignore
        }
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/hubs/notifications`, {
          accessTokenFactory: () => localStorage.getItem('access_token') || '',
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.on('ReceiveNotification', (notification: NotificationItem) => {
        this.onNotificationCallbacks.forEach((cb) => {
          try {
            cb(notification);
          } catch (e) {
            console.error('Error handling notification callback:', e);
          }
        });
      });

      this.connection.on('UnreadCountUpdated', (count: number) => {
        this.onUnreadCountCallbacks.forEach((cb) => {
          try {
            cb(count);
          } catch (e) {
            console.error('Error handling unread count callback:', e);
          }
        });
      });

      await this.connection.start();
    } catch (err) {
      console.warn('Notification SignalR connection error:', err);
    } finally {
      this.isStarting = false;
    }
  }

  public onNotification(cb: (item: NotificationItem) => void): () => void {
    this.onNotificationCallbacks.push(cb);
    return () => {
      this.onNotificationCallbacks = this.onNotificationCallbacks.filter((c) => c !== cb);
    };
  }

  public onUnreadCount(cb: (count: number) => void): () => void {
    this.onUnreadCountCallbacks.push(cb);
    return () => {
      this.onUnreadCountCallbacks = this.onUnreadCountCallbacks.filter((c) => c !== cb);
    };
  }

  public async stop(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // Ignore
      }
      this.connection = null;
    }
    this.isStarting = false;
  }
}

export const notificationSignalR = new NotificationSignalRService();
export default notificationSignalR;
