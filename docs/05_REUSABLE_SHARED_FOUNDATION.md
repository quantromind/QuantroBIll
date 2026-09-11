# 🧩 Reusable Shared Foundation & Calculation Engine

> **Document Version:** 1.0.0  
> **Key Focus:** Write Once, Use Everywhere — Shared Billing Math Engine, TypeScript Contracts, Reusable UI Components, and SignalR Event Definitions.

---

## 1. Why a Shared Foundation Matters

Because QuantroBill is accessed across **Web POS**, **Tauri Desktop**, and **React Native Mobile**, copying and pasting calculations (like GST or discounts) leads to calculation drift and tax non-compliance.

We organize shared logic into a decoupled module (`shared/` or `packages/shared`):

```
petbharkhao/
├── client/                     # Web / Desktop POS (React 19)
├── mobile/                     # Waiter Handheld (React Native)
└── shared/                     # Reusable across Web, Desktop & Mobile
    ├── calculations/
    │   └── billingEngine.ts    # 100% pure math: Subtotals, GST, Discounts, Round-off
    ├── types/
    │   └── index.ts            # Common data types & API DTOs
    ├── constants/
    │   ├── events.ts           # SignalR event strings
    │   └── enums.ts            # OrderStatus, PaymentMode, Roles
    └── utils/
        ├── currency.ts         # ₹ Indian Rupee formatting (e.g. ₹1,240.00)
        └── dateTime.ts         # Time-ago, shift times, KOT prep timer
```

---

## 2. Shared Core Calculation Engine (`billingEngine.ts`)

This pure TypeScript function calculates exact totals without side-effects, perfectly adhering to Indian restaurant GST rules.

```typescript
// shared/calculations/billingEngine.ts

export interface LineItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  itemDiscount?: number;
}

export interface BillCalculationInput {
  items: LineItem[];
  discountType?: 'FLAT' | 'PERCENTAGE' | 'NONE';
  discountValue?: number;
  isGstApplicable?: boolean;
  cgstRate?: number;       // Default: 0.025 (2.5%)
  sgstRate?: number;       // Default: 0.025 (2.5%)
  serviceChargeRate?: number; // e.g. 0.05 (5%) or 0
  deliveryCharges?: number;
  packagingCharges?: number;
}

export interface BillCalculationOutput {
  subTotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  serviceChargeAmount: number;
  deliveryCharges: number;
  packagingCharges: number;
  grossTotal: number;
  roundOff: number;
  finalPayableAmount: number;
}

export function calculateBill(input: BillCalculationInput): BillCalculationOutput {
  const {
    items,
    discountType = 'NONE',
    discountValue = 0,
    isGstApplicable = true,
    cgstRate = 0.025,
    sgstRate = 0.025,
    serviceChargeRate = 0,
    deliveryCharges = 0,
    packagingCharges = 0,
  } = input;

  // 1. Calculate Subtotal
  const subTotal = items.reduce((acc, item) => {
    const itemTotal = (item.unitPrice * item.quantity) - (item.itemDiscount || 0);
    return acc + Math.max(0, itemTotal);
  }, 0);

  // 2. Calculate Bill-Level Discount
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = (subTotal * Math.min(100, Math.max(0, discountValue))) / 100;
  } else if (discountType === 'FLAT') {
    discountAmount = Math.min(subTotal, Math.max(0, discountValue));
  }

  // 3. Taxable Amount (Post-discount)
  const taxableAmount = Math.max(0, subTotal - discountAmount);

  // 4. GST Taxes (2.5% CGST + 2.5% SGST on restaurant services)
  const cgstAmount = isGstApplicable ? +(taxableAmount * cgstRate).toFixed(2) : 0;
  const sgstAmount = isGstApplicable ? +(taxableAmount * sgstRate).toFixed(2) : 0;
  const totalGst = +(cgstAmount + sgstAmount).toFixed(2);

  // 5. Service Charge (if applicable)
  const serviceChargeAmount = +(taxableAmount * serviceChargeRate).toFixed(2);

  // 6. Gross Total
  const grossTotal = taxableAmount + totalGst + serviceChargeAmount + deliveryCharges + packagingCharges;

  // 7. Standard Indian Rupee Round-off
  const finalPayableAmount = Math.round(grossTotal);
  const roundOff = +(finalPayableAmount - grossTotal).toFixed(2);

  return {
    subTotal: +subTotal.toFixed(2),
    discountAmount: +discountAmount.toFixed(2),
    taxableAmount: +taxableAmount.toFixed(2),
    cgstAmount,
    sgstAmount,
    totalGst,
    serviceChargeAmount,
    deliveryCharges,
    packagingCharges,
    grossTotal: +grossTotal.toFixed(2),
    roundOff,
    finalPayableAmount,
  };
}
```

---

## 3. Shared Enums & SignalR Events

```typescript
// shared/constants/events.ts
export const SIGNALR_EVENTS = {
  // Order Updates
  RECEIVE_ORDER_UPDATE: 'ReceiveOrderUpdate',
  ORDER_STATUS_CHANGED: 'OrderStatusChanged',
  ORDER_COOKED_ALERT: 'OrderCookedAlert',

  // Tables
  TABLE_STATUS_CHANGED: 'TableStatusChanged',
  TABLE_VACATED: 'TableVacated',

  // Kitchen Display
  KDS_ITEM_BUMPED: 'KdsItemBumped',

  // Menu Availability
  ITEM_86_TOGGLE: 'ItemAvailabilityChanged',
} as const;

// shared/constants/enums.ts
export enum OrderStatus {
  Draft = 0,
  KotCreated = 1,
  InPreparation = 2,
  ReadyForPickup = 3,
  Served = 4,
  BillPrinted = 5,
  Settled = 6,
  Cancelled = 7,
}

export enum OrderType {
  DineIn = 1,
  Takeaway = 2,
  Delivery = 3,
  Aggregator = 4,
}

export enum PaymentMode {
  Cash = 'Cash',
  Card = 'Card',
  UPI = 'UPI',
  Due = 'Due',
  Split = 'Split',
  Complimentary = 'Complimentary',
}
```

---

## 4. Reusable UI Components Pattern

The following UI components are designed to be plug-and-play across views:
* **`ToggleSwitch`**: Already extracted in [`client/src/components/ToggleSwitch.tsx`](file:///e:/Saas%20Projects/petbharkhao%20(2)/petbharkhao/client/src/components/ToggleSwitch.tsx).
* **`StatusBadge`**: Displays consistent badge styles for `Occupied`, `Vacant`, `Ready`, `Paid`.
* **`Modal`**: Base accessible dialog with backdrop blur, keyboard ESC close, and slide-in animations.
* **`NumberPad`**: On-screen touch keypad for fast cashier number entry without hardware keyboards.
