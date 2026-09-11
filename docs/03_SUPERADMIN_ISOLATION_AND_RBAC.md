# 🛡️ 3-Tier Login Architecture & Role-Based Access Control (RBAC)

> **Document Version:** 1.1.0  
> **Key Focus:** Strict Architectural Isolation of 3 Distinct Login Portals: SuperAdmin, Restaurant Owner/Admin, and Restaurant Staff (Cashier, Waiter, Chef).

---

## 1. The 3-Tier Login Hierarchy

QuantroBill enforces a strict **3-Tier Login Separation** to prevent security leaks and keep user experiences customized for each role:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 QUANTROBILL 3-TIER LOGIN SYSTEM                                  │
├──────────────────────────────┬──────────────────────────────────┬────────────────────────────────┤
│ 1. SUPERADMIN PORTAL         │ 2. RESTAURANT OWNER / ADMIN      │ 3. RESTAURANT OPERATIONAL STAFF│
│ (SaaS Platform Headquarters) │ (Owner / General Manager Desk)   │ (Cashier, Waiter, Chef, Rider) │
├──────────────────────────────┼──────────────────────────────────┼────────────────────────────────┤
│ • URL: `/superadmin/login`   │ • URL: `/owner/login`            │ • URL: `/login` (POS Web)      │
│ • Identity: Platform Owner   │ • Identity: Restaurant Owner     │ • Device: Waiter Mobile App    │
│ • Scope: All SaaS Tenants    │ • Scope: Their Restaurant/Outlets│ • Scope: Active Shift Ops      │
│ • Capabilities:              │ • Capabilities:                  │ • Capabilities:                │
│   - Onboard new Restaurants  │   - Executive Operations Monitor │   - High-Speed Touch Billing   │
│   - Subscription & Licenses  │   - Live Tables & Running Sales  │   - Waiter Table Punching (RN) │
│   - Feature Flagging         │   - Employee Accounts & Perms    │   - Kitchen KDS Screen &       │
│   - Global Revenue Telemetry │   - Recipe Costing & Inventory   │     Kitchen Thermal Printer    │
│                              │   - Sales, Expenses & P&L        │   - Cash Drawer Register       │
└──────────────────────────────┴──────────────────────────────────┴────────────────────────────────┘
```

---

## 2. Dedicated Route & Layout Separation

The frontend router splits into **three distinct guard boundaries**:

```tsx
// client/src/App.tsx (3-Tier Isolated Router Hierarchy)

<Routes>
  {/* ========================================================= */}
  {/* 1. RESTAURANT OPERATIONAL STAFF (Cashiers, Waiters, Chefs) */}
  {/* ========================================================= */}
  <Route path="/login" element={<StaffLogin />} />
  <Route element={<StaffPrivateRoute><AppLayout /></StaffPrivateRoute>}>
    <Route path="/billing" element={<Billing />} />
    <Route path="/tables" element={<TableManager />} />
    <Route path="/kds" element={<KDS />} />
    <Route path="/online-orders" element={<OnlineOrders />} />
    <Route path="/receipt-settings" element={<ReceiptSettings />} />
  </Route>

  {/* ========================================================= */}
  {/* 2. RESTAURANT OWNER / ADMIN BACK-OFFICE (Executive Desk)   */}
  {/* ========================================================= */}
  <Route path="/owner/login" element={<OwnerLogin />} />
  <Route element={<OwnerPrivateRoute><OwnerLayout /></OwnerPrivateRoute>}>
    <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
    <Route path="/owner/dashboard" element={<OwnerDashboard />} />          {/* Screenshot 1 & 2 */}
    <Route path="/owner/employees" element={<EmployeeAccessManager />} />   {/* Screenshot 3 */}
    <Route path="/owner/inventory" element={<InventoryManager />} />        {/* Screenshot 4 */}
    <Route path="/owner/recipes" element={<RecipeBOMManager />} />
    <Route path="/owner/finance" element={<FinanceReports />} />
    <Route path="/owner/customers" element={<CustomerKhataManager />} />
  </Route>

  {/* ========================================================= */}
  {/* 3. SAAS PLATFORM SUPERADMIN (Completely Isolated Portal)   */}
  {/* ========================================================= */}
  <Route path="/superadmin/login" element={<SuperAdminLogin />} />
  <Route element={<SuperAdminPrivateRoute><SuperAdminLayout /></SuperAdminPrivateRoute>}>
    <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
    <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
    <Route path="/superadmin/tenants" element={<TenantOnboardingManager />} />
    <Route path="/superadmin/subscriptions" element={<SubscriptionLicenseManager />} />
    <Route path="/superadmin/features" element={<FeatureFlagManager />} />
    <Route path="/superadmin/telemetry" element={<GlobalTelemetry />} />
  </Route>
</Routes>
```

### 2.2 Dedicated SuperAdmin Login Endpoint

In ASP.NET Core:
* Regular staff logins go to `POST /api/auth/login` (checks username/password against the tenant's user table).
* SuperAdmin logins go to `POST /api/auth/superadmin-login` (verifies against the platform's root admin credentials).
* **JWT Claims Distinction:**
  - Standard User Token: `{ sub: "usr_102", tenantId: "rest_001", outletId: "out_01", role: "Cashier" }`
  - SuperAdmin Token: `{ sub: "sa_root", isSuperAdmin: true, role: "SuperAdmin" }` (No `tenantId` restriction).

---

## 3. SuperAdmin SaaS Modules

### 3.1 Tenant (Restaurant) Lifecycle Management
* **Create New Restaurant:**
  - Business Legal Name & Brand Name
  - Owner Name, Primary Contact Phone & Email
  - GSTIN (India GST compliance number)
  - Default Currency (INR ₹, USD $, etc.)
  - Auto-generation of initial Admin Account & temporary password.
* **Status Management:**
  - 🟢 **Active:** Normal operation.
  - 🟡 **Trial:** 14-day free trial with watermarked receipts.
  - 🟠 **Suspended (Payment Due):** Shows grace period countdown banner on POS.
  - 🔴 **Locked (Terminated):** Blocks POS login and displays contact sales modal.

### 3.2 Subscription & License Engine
* **Plan Tiers:**
  | Plan Name | Max Outlets | Waiter App | KDS Screens | Advanced Inventory | Price (Annual) |
  | :--- | :---: | :---: | :---: | :---: | :--- |
  | **Starter QSR** | 1 | ❌ | ❌ | Basic | ₹12,000 / year |
  | **Pro Dine-In** | 2 | ✅ (Up to 5) | ✅ (2 screens) | ✅ Full BOM | ₹24,000 / year |
  | **Enterprise** | Unlimited | Unlimited | Unlimited | Multi-warehouse | Custom |
* **License Key & Expiration Logic:**
  - Middleware checks `Tenant.SubscriptionExpiresAt`.
  - If `DateTime.UtcNow > SubscriptionExpiresAt`, non-exempt APIs return `402 Payment Required`.

### 3.3 Feature Flagging (Per Restaurant Toggles)
Allows SuperAdmin to selectively activate modules based on what the restaurant purchased:
- `EnableKDS`: true/false
- `EnableOnlineAggregatorSync`: true/false (Zomato/Swiggy integration)
- `EnableWaiterMobileApp`: true/false
- `EnableRecipeCosting`: true/false
- `EnableKhataBookCredit`: true/false

---

## 4. Granular Restaurant Staff RBAC Matrix

To prevent pilferage, unauthorized discounts, and cash theft, a high-volume restaurant enforces strict role-based barriers.

### 4.1 Staff Roles Breakdown

1. **Owner / Tenant Admin:** Has complete authority over their restaurant, menu pricing, raw ingredient costs, profit reports, and staff PINs.
2. **Branch / Outlet Manager:** Runs daily operations, approves discounts, voids bills, manages table shifts, and audits shift registers.
3. **Cashier / Biller:** Punches orders, collects payments, generates bills, manages cash drawer float, and executes day closing.
4. **Captain / Head Waiter:** Assigns tables to waiters, punches orders, modifies KOTs, and requests bill printing.
5. **Waiter:** Punches running orders on mobile app, views item availability, and receives "Order Cooked" alerts from kitchen.
6. **Kitchen Chef:** Views orders on KDS screen, updates prep status, and marks orders "Ready".
7. **Delivery Rider:** Views assigned delivery addresses and marks orders "Delivered".

---

### 4.2 Comprehensive Permissions Matrix

| Functional Capability | SuperAdmin | Owner | Manager | Cashier | Captain | Waiter | Chef |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SaaS Provisioning & Tenant Billing** | 🟢 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Gross Profit & Net Margins** | 🟢 | 🟢 | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Edit Menu Items & Prices** | ❌ | 🟢 | 🟡 (View Only) | ❌ | ❌ | ❌ | ❌ |
| **Mark Item "86" (Out of Stock)** | ❌ | 🟢 | 🟢 | 🟢 | 🟢 | ❌ | 🟢 |
| **Punch Orders (Dine-in / Takeaway)** | ❌ | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | ❌ |
| **Apply Standard Preset Discount (<10%)**| ❌ | 🟢 | 🟢 | 🟢 | ❌ | ❌ | ❌ |
| **Apply Custom Discount (>10% or NC)** | ❌ | 🟢 | 🟢 (PIN req.)| 🔴 (PIN req.)| ❌ | ❌ | ❌ |
| **Void / Cancel Punched KOT Items** | ❌ | 🟢 | 🟢 (With reason)| 🔴 (Mgr PIN)| ❌ | ❌ | ❌ |
| **Split / Merge Tables** | ❌ | 🟢 | 🟢 | 🟢 | 🟢 | ❌ | ❌ |
| **Print Final Tax Invoice** | ❌ | 🟢 | 🟢 | 🟢 | 🟡 (Req print)| ❌ | ❌ |
| **Settle Bill (Cash / Card / UPI)** | ❌ | 🟢 | 🟢 | 🟢 | ❌ | ❌ | ❌ |
| **Kitchen KDS (Bump / Ready)** | ❌ | 🟢 | 🟢 | ❌ | ❌ | ❌ | 🟢 |
| **Open / Close Shift Register (Z-Report)**| ❌ | 🟢 | 🟢 | 🟢 | ❌ | ❌ | ❌ |
| **View Customer Phone & CRM History** | ❌ | 🟢 | 🟢 | 🟢 | 🟡 (Name only)| ❌ | ❌ |

---

## 5. Manager PIN Authorization Flow (For Cashier Voids & Discounts)

In high-speed restaurant POS operations, cashiers should not have blanket permission to cancel items or give large discounts. When a cashier attempts a restricted action:

```tsx
// Frontend Interceptor Flow for Sensitive Operations:
async function handleVoidItem(orderId: string, itemId: string) {
  if (currentUser.role === 'Cashier') {
    // 1. Trigger Pop-up Modal asking for Manager PIN
    const managerPin = await promptManagerPinModal({
      action: "VOID_ITEM",
      description: "Cancelling Paneer Butter Masala (₹240)",
    });
    
    // 2. Pass PIN in Request Header
    await apiClient.post(`/orders/${orderId}/items/${itemId}/void`, {
      reason: "Customer changed mind",
      managerPin: managerPin
    });
  } else {
    // Direct execution for Manager or Owner
    await apiClient.post(`/orders/${orderId}/items/${itemId}/void`, { reason });
  }
}
```
