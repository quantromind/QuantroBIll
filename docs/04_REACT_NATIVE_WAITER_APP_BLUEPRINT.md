# 📱 React Native Waiter & Captain Handheld App Blueprint

> **Document Version:** 1.0.0  
> **Key Focus:** Fast Order Taking at Tables, Instant Floor Plan Sync, Modifiers & Addons, Real-time KOT Dispatching & Desktop POS Synchronization.

---

## 1. Handheld Waiter App Vision & Device Requirements

Waiters and Captains use smartphones or rugged Android handheld POS devices (e.g., Sunmi, iMin) on the restaurant floor. Speed is paramount: a waiter must be able to select a table, punch 4 items with custom notes, and send the KOT to the kitchen in **under 15 seconds**.

### Core Requirements
1. **Zero-Lag UI:** Big touch targets for one-handed operation during peak restaurant rush.
2. **Instant Sync with Desktop POS:** When an order is punched on mobile:
   - Desktop POS turns table red immediately.
   - Kitchen KDS screen receives the ticket.
   - Kitchen thermal printer spits out the physical KOT.
3. **Sound & Haptic Feedback:** Physical vibration and distinct audio chime on order confirmation so the waiter doesn't have to second-guess if the kitchen received the order.
4. **Offline Resilience:** If Wi-Fi signal drops in the corner of the dining hall, the app stores the order locally and replays it the moment the device reconnects.

---

## 2. React Native Project Folder Structure

```
waiter-app/
├── package.json
├── app.json (Expo SDK 52 / React Native CLI)
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios instance configured with JWT & Tenant headers
│   │   └── endpoints.ts           # Order, Table, Menu, and Staff API calls
│   ├── services/
│   │   ├── signalrService.ts      # Real-time WebSocket connection to ASP.NET Core
│   │   ├── soundService.ts        # Chimes for KOT sent / Order Ready notifications
│   │   └── offlineQueue.ts        # Local order caching (MMKV / AsyncStorage)
│   ├── store/
│   │   ├── authStore.ts           # Waiter PIN login state & assigned outlet
│   │   ├── tableStore.ts          # Floor layout, active occupied tables
│   │   ├── menuStore.ts           # Cached categories, items, and addon groups
│   │   └── activeCartStore.ts     # Current running cart for the selected table
│   ├── components/
│   │   ├── TableTile.tsx          # Card with table number, covers, and timer
│   │   ├── MenuItemRow.tsx        # Item row with Veg/Non-Veg icon and quick +/-
│   │   ├── ModifierModal.tsx      # Addon selector & kitchen cooking notes
│   │   └── StatusBadge.tsx        # Visual occupancy indicators
│   ├── screens/
│   │   ├── LoginScreen.tsx        # 4-Digit Quick Staff PIN Login Pad
│   │   ├── FloorPlanScreen.tsx    # Visual grid of all tables with section tabs
│   │   ├── OrderPunchScreen.tsx   # Fast category scroller, item list, and search
│   │   ├── CartReviewScreen.tsx   # Review new items + previous KOTs for table
│   │   └── KitchenAlertsScreen.tsx# Notifications when chef marks food "Ready"
│   └── types/
│       └── index.ts               # Shared TypeScript models (Order, Table, Item)
```

---

## 3. Real-Time Synchronization Engine on Mobile

### 3.1 SignalR Connection Lifecycle in React Native

Using `@microsoft/signalr` on React Native:

```typescript
// src/services/signalrService.ts
import * as signalR from '@microsoft/signalr';
import { useTableStore } from '../store/tableStore';
import { playSound } from './soundService';

let hubConnection: signalR.HubConnection | null = null;

export const initializeSignalR = async (tenantId: string, outletId: string, token: string) => {
  if (hubConnection) return;

  hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(`http://192.168.1.100:5000/hubs/order?access_token=${token}`, {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .build();

  // Listen for real-time updates pushed from Desktop POS or Kitchen KDS
  hubConnection.on('ReceiveOrderUpdate', (order) => {
    useTableStore.getState().syncOrderToTable(order);
  });

  hubConnection.on('TableStatusChanged', (data) => {
    useTableStore.getState().updateTableStatus(data.tableNumber, data.isOccupied);
  });

  hubConnection.on('OrderReadyNotification', (data) => {
    // Notify waiter that food for their table is ready for pickup!
    playSound('order_ready_chime.mp3');
  });

  await hubConnection.start();
  // Join the restaurant's active outlet room
  await hubConnection.invoke('JoinOutletGroup', tenantId, outletId);
};
```

---

## 4. Step-by-Step Order Taking Workflow

```mermaid
flowchart TD
    A[Waiter Logs In via 4-Digit PIN] --> B[Visual Floor Plan Screen]
    B --> C{Select Table}
    C -->|Table Vacant (Green)| D[Open Fresh Order Cart]
    C -->|Table Occupied (Red)| E[Open Running Order & Previous KOTs]
    
    D --> F[Search Items / Filter by Category]
    E --> F
    
    F --> G[Tap Item -> Add Quantity]
    G --> H{Requires Customization?}
    H -->|Yes| I[Open Modifier Modal: 'Less Spicy', 'Extra Mayo']
    H -->|No| J[Item Added to Pending KOT Cart]
    I --> J
    
    J --> K[Tap 'Fire KOT' Button]
    K --> L[Vibration + Audio Chime on Phone]
    L --> M[POST /api/orders to ASP.NET Core]
    
    M --> N[SignalR Broadcasts to Desktop POS & Kitchen KDS]
    N --> O[Kitchen KDS chimes & Displays New Order]
    N --> P[Desktop POS Table turns Red & Updates Total]
```

---

## 5. Offline Queue Handling on Handheld Devices

When a waiter walks into a Wi-Fi blind spot (e.g. basement dining or outdoor patio):

```typescript
// src/services/offlineQueue.ts
import { apiClient } from '../api/client';
import NetInfo from '@react-native-community/netinfo';
import { storage } from './mmkvStorage';

export async function submitOrder(orderPayload: any) {
  const state = await NetInfo.fetch();

  if (!state.isConnected) {
    // 1. Save order to offline pending queue
    const pendingOrders = JSON.parse(storage.getString('pending_orders') || '[]');
    pendingOrders.push({ ...orderPayload, offlineTimestamp: Date.now() });
    storage.set('pending_orders', JSON.stringify(pendingOrders));

    // 2. Optimistically update local UI
    return { success: true, isOffline: true, message: 'Saved offline. Will sync on reconnect.' };
  }

  // 3. Online: Send directly to API
  return await apiClient.post('/orders', orderPayload);
}

// Background reconnect listener
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    flushPendingOrders();
  }
});
```
