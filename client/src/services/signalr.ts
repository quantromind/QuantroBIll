import * as signalR from '@microsoft/signalr';
import { getBaseApiUrl } from './api';

class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  public async startConnection(tenantId: string, outletId: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = localStorage.getItem('quantrobill_access_token') || localStorage.getItem('petbharke_access_token');
    const hubUrl = getBaseApiUrl().replace(/\/api$/, '') + '/hubs/order';

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || '',
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Re-attach all listeners
    this.listeners.forEach((callbacks, eventName) => {
      callbacks.forEach((cb) => {
        this.hubConnection?.on(eventName, cb);
      });
    });

    try {
      await this.hubConnection.start();
      console.log('--> [SignalR] Connected to QuantroBill OrderHub');
      await this.hubConnection.invoke('JoinOutletGroup', tenantId, outletId);
      await this.hubConnection.invoke('JoinKitchenGroup', tenantId, outletId);
    } catch (err) {
      console.warn('--> [SignalR] Connection error (retrying in background):', err);
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

export const signalRService = new SignalRService();
