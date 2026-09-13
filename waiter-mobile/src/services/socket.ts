import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from './apiClient';

class MobileSignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private isConnecting = false;
  private currentTenantId: string | null = null;
  private currentOutletId: string | null = null;
  private currentToken: string | null = null;

  public async startConnection(tenantId: string, outletId: string, token?: string): Promise<void> {
    if (!tenantId || !outletId) {
      console.warn('--> [Mobile SignalR] Cannot start connection without tenantId and outletId');
      return;
    }

    // If already connected with identical tenant/outlet/token, nothing to do
    if (
      this.hubConnection &&
      this.hubConnection.state === signalR.HubConnectionState.Connected &&
      this.currentTenantId === tenantId &&
      this.currentOutletId === outletId &&
      this.currentToken === (token || null)
    ) {
      return;
    }

    // If already connected with different tenant/outlet/token, stop first
    if (this.hubConnection) {
      this.stopConnection();
    }

    if (this.isConnecting) return;
    this.isConnecting = true;
    this.currentTenantId = tenantId;
    this.currentOutletId = outletId;
    this.currentToken = token || null;

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

    // Auto rejoin outlet group on reconnect
    this.hubConnection.onreconnected(async () => {
      console.log('--> [Mobile SignalR] Reconnected. Rejoining outlet group:', tenantId, outletId);
      try {
        await this.hubConnection?.invoke('JoinOutletGroup', tenantId, outletId);
      } catch (err) {
        console.warn('--> [Mobile SignalR] Rejoin group error:', err);
      }
    });

    try {
      await this.hubConnection.start();
      console.log('--> [Mobile SignalR] Connected to OrderHub for outlet:', outletId);
      await this.hubConnection.invoke('JoinOutletGroup', tenantId, outletId);
    } catch (err) {
      console.warn('--> [Mobile SignalR] Connect error (will retry automatically):', err);
    } finally {
      this.isConnecting = false;
    }
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      try {
        this.hubConnection.stop();
      } catch (e) {
        console.warn('--> [Mobile SignalR] Error stopping connection:', e);
      }
      this.hubConnection = null;
    }
    this.currentTenantId = null;
    this.currentOutletId = null;
    this.currentToken = null;
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
