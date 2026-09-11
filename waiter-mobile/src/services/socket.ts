import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from './apiClient';

class MobileSignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private isConnecting = false;

  public async startConnection(tenantId: string, outletId: string, token?: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }
    if (this.isConnecting) return;
    this.isConnecting = true;

    const hubUrl = API_BASE_URL.replace(/\/api$/, '') + '/hubs/order';

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || '',
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Reattach listeners
    this.listeners.forEach((callbacks, eventName) => {
      callbacks.forEach((cb) => {
        this.hubConnection?.on(eventName, cb);
      });
    });

    try {
      await this.hubConnection.start();
      console.log('--> [Mobile SignalR] Connected to OrderHub');
      await this.hubConnection.invoke('JoinOutletGroup', tenantId, outletId);
    } catch (err) {
      console.warn('--> [Mobile SignalR] Connect error (will retry):', err);
    } finally {
      this.isConnecting = false;
    }
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  public on(eventName: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);

    if (this.hubConnection) {
      this.hubConnection.on(eventName, callback);
    }
  }

  public off(eventName: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.listeners.get(eventName)?.delete(callback);
      if (this.hubConnection) {
        this.hubConnection.off(eventName, callback);
      }
    } else {
      this.listeners.delete(eventName);
      if (this.hubConnection) {
        this.hubConnection.off(eventName);
      }
    }
  }
}

export const mobileSignalR = new MobileSignalRService();
