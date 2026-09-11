# 🍽️ QuantroBill POS — Complete Petpooja-Equivalent Product Requirements Document (PRD)

> **Document Version:** 1.0.0  
> **Target Audience:** Solo Full-Stack Developer & AI Agent Pair Programming  
> **Platform Goal:** Enterprise-grade Multi-Tenant Restaurant POS, Billing, Table, KDS, Mobile Waiter App & Management Ecosystem.

---

## 1. Executive Summary & Product Vision

QuantroBill is a full-featured, multi-tenant restaurant management SaaS engineered to match the capabilities of enterprise restaurant systems like **Petpooja** and **Restosoft**. The system powers high-volume dine-in restaurants, quick-service restaurants (QSR), cafes, bars, and cloud kitchens.

### The 3-Tier Login Architecture
QuantroBill separates responsibilities into **3 distinct, dedicated portals**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 QUANTROBILL ECOSYSTEM                                  │
├──────────────────────────┬──────────────────────────────┬──────────────────────────────┤
│  LEVEL 1: SUPERADMIN     │  LEVEL 2: RESTAURANT OWNER   │  LEVEL 3: RESTAURANT STAFF   │
│  (SaaS Platform Owner)   │  (Admin / Cafe Owner Portal) │  (Daily Operational Staff)   │
├──────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ • Route: `/superadmin`   │ • Route: `/admin` or `/owner`│ • Route: `/login` & Mobile   │
│ • Onboard new restaurants│ • Executive Live Dashboard   │ • Cashier Billing Desk       │
│ • Subscription Plans     │ • Sales, Profit & Expenses   │ • Waiter Mobile App (RN)     │
│ • Feature Toggles per res│ • Recipe (BOM) & Inventory   │ • Kitchen Screen (KDS) OR    │
│ • Global SaaS Telemetry  │ • Staff Accounts & Perms     │ • Kitchen Thermal Printer    │
└──────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

### Key Tenets
1. **Zero Downtime / Real-Time Sync:** When a waiter punches an order on a mobile phone, the POS screen, kitchen display (KDS) / kitchen printer, and floor layout update in under **100 milliseconds** via WebSockets (SignalR).
2. **Dual Kitchen Execution (Screen or Printer):** Full support for paperless Kitchen Display System (KDS), traditional 80mm Kitchen Thermal Printers, or hybrid (both simultaneously).
3. **Dedicated Restaurant Owner Dashboard:** Complete visibility into live dining tables, running sales, employee permission matrix, inventory ingredients, and recipe costing.

---

## 2. Comprehensive Module-by-Module Requirements

```
                       ┌──────────────────────────────┐
                       │     QuantroBill Ecosystem    │
                       └──────────────┬───────────────┘
                                      │
        ┌───────────────────┬─────────┴─────────┬───────────────────┐
        ▼                   ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Web/Desktop   │   │ React Native  │   │ Kitchen KDS   │   │ SuperAdmin    │
│ Cashier POS   │   │ Waiter Mobile │   │ Chef Screen   │   │ SaaS Portal   │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │                   │
        └───────────────────┼───────────────────┘                   │
                            ▼                                       ▼
                   ┌─────────────────┐                     ┌─────────────────┐
                   │ ASP.NET Core 8  │◄────────────────────┤ SuperAdmin API  │
                   │ + SignalR Hub   │                     │ Tenant Billing  │
                   └────────┬────────┘                     └─────────────────┘
                            ▼
                   ┌─────────────────┐
                   │  MongoDB Atlas  │
                   └─────────────────┘
```

---

### Module 1: POS Billing & Order Management (Heart of the Restaurant)

#### 1.1 Order Types
* **Dine-In:** Table selection, guest count (covers), captain assignment, running KOTs, item additions, bill print, payment settlement, and automatic table vacancy.
* **Takeaway / Counter Sale:** Quick punch, customer name/phone prompt, immediate KOT + token generation, direct payment.
* **Direct Delivery:** Customer address lookup, delivery partner assignment, delivery fee calculation, live delivery status tracking (Dispatched, Delivered).
* **Online Aggregators (Zomato / Swiggy Mock integration):** Incoming online order queue, auto-accept or manual accept toggle, custom aggregator packaging charge, food prep timer.

#### 1.2 KOT (Kitchen Order Ticket) Operations
* **Multi-KOT per Table:** A dine-in table can have KOT-1 (Starters), KOT-2 (Main Course), KOT-3 (Beverages/Desserts).
* **Item Modifiers & Notes:** "Less Spicy", "No Onion No Garlic", "Extra Cheese (₹30)", "Ice on side".
* **KOT Transfer / Item Cancellation:** Reason prompt required for audit (e.g., "Guest changed mind", "Item out of stock"). Cashier/Manager approval required.
* **KOT Reprint:** Ability to reprint previous KOTs with a distinct **[REPRINT]** watermark to avoid duplicate kitchen preparation.

#### 1.3 Billing & Settlement Features
* **Split Billing:**
  - *Equal Split:* Split total ₹1,200 into 3 parts (₹400 each).
  - *Item-wise Split:* Guest A pays for Pizza, Guest B pays for Pasta & Drinks.
* **Table Shifting & Table Merging:**
  - Shift Table 4 to Table 9 (all open KOTs transfer seamlessly).
  - Merge Table 2 & Table 3 into a single combined party bill.
* **Multi-Payment Modes:** Cash, Credit/Debit Card, UPI (dynamic QR generation), Store Credit / Due Book, Split payment (e.g. ₹500 Cash + ₹700 UPI).
* **Taxation (Indian GST Compliance):**
  - CGST (2.5%) + SGST (2.5%) for standalone restaurant (5% total).
  - Inter-state IGST (5%) support.
  - Composition Scheme toggle (0% tax collection with statutory disclaimers).
  - Configurable Service Charge (optional 5% or 10% with one-click guest opt-out).
* **Discounts & Complimentary:**
  - Flat amount discount (₹100 off).
  - Percentage discount (10% off).
  - Preset coupon codes.
  - Complimentary item / NC (Non-Chargeable) billing with mandatory manager remarks for tax audit.
* **Round-off:** Automatic standard round-off to the nearest rupee (e.g. ₹425.40 -> ₹425.00).

---

### Module 2: Interactive Table Management & Floor Plan

#### 2.1 Visual Floor Plan
* **Section-wise Layouts:** Ground Floor, AC Hall, Rooftop Terrace, Patio/Outdoor, Family Section, Bar Counter.
* **Table Card Indicators:**
  - **Color Coded Status:**
    - 🟢 Green: Vacant / Available
    - 🔴 Red: Occupied with active order
    - 🟡 Yellow: Bill Printed (Waiting for guest to pay)
    - 🔵 Blue: Reserved
    - 🟣 Purple: Cleaning / Sanitizing
  - **Live Table Metrics:** Seated covers, running order value, order timer (`28m ago`), active KOT count, bill number.
* **Quick Actions on Table:**
  - Single tap to open Running Order / Add Items.
  - "Print Bill" button directly from table card.
  - "Vacate / Clear Table" button.
  - "Change Waiter / Captain".

---

### Module 3: Kitchen Display System (KDS) & Kitchen Printer Routing

#### 3.1 Kitchen Display Screen (Paperless Kitchen)
* Full-screen responsive view designed for 15"-32" tablets or HDMI TV displays in the kitchen.
* **Card-based KOT Display:**
  - Order Number, Table Number / Order Type, Waiter Name, Time Elapsed counter.
  - Color-coded urgency alerts:
    - 🟢 Green: < 10 minutes elapsed
    - 🟠 Amber: 10 - 20 minutes elapsed
    - 🔴 Flashing Red: > 20 minutes elapsed (Cooking delayed)
* **Item-level Cook Status:** Chefs can tap individual items to mark "In Progress" or "Cooked".
* **KOT Bump / Dismiss:** When all items are ready, chef taps "Order Ready", triggering a notification sound and sending a push alert to the waiter's phone.

#### 3.2 Kitchen Station Routing (Multi-Kitchen Support)
* Route items to specific kitchen stations:
  - Tandoor Section -> Tandoor Printer / Screen
  - Chinese Section -> Chinese Printer / Screen
  - Bar / Mocktails -> Bar Counter Printer
  - Main Pantry / Dessert -> Dessert Printer

---

### Module 4: Menu, Recipe Costing & Inventory Management

#### 4.1 Menu Engineering
* Hierarchical hierarchy: `Category` -> `Subcategory` -> `MenuItem` -> `Variants` & `Addon Groups`.
* **Variants:** Size (Regular, Large), Portion (Half, Full), Crust (Thin, Cheese Burst).
* **Addon Groups:**
  - Minimum & Maximum selection rules (e.g., choose min 1, max 3 toppings).
  - Free addons vs Paid addons.
* **Item Badging:** Veg (🟢 green square), Non-Veg (🔴 red square), Egg (🟡 yellow square), Vegan, Chef's Special, Spicy level (🌶️🌶️).
* **Live "86" / Item Out-of-Stock Toggle:** One-click toggle to disable items on all POS counters and waiter devices instantly.

#### 4.2 Raw Ingredients & Inventory Management (As per Restosoft / Petpooja specs)
* **Inventory Sub-Modules & Tabs:**
  1. **Ingredients Catalog:**
     - Stock Item ID & Item Name (e.g. `Thums Up 250ml`, `Soda 250ml`, `Water 1 Ltr`, `Milk`, `Paneer`, `Chicken`).
     - Recipe UOM (Unit of Measure): Piece (Pc), Kilogram (Kg), Gram (g), Liter (L), Milliliter (ml).
     - Par Stock (Safety buffer quantity e.g. `1000 - Pieces (Pc)`).
     - Actions: Edit Par Stock, Inspect History, Delete.
  2. **Load Stock (GRN / Purchases):** Record vendor invoices, purchase quantity, and landing costs.
  3. **Stock Issue:** Transfer ingredients from main store to kitchen stations (Chinese, Tandoor, Bar).
  4. **Self Made / Semi-Finished Goods:** In-house prepared gravies, pizza dough, syrups.
  5. **Stock Available & Re-order Alerts:** Real-time physical inventory count with warning pills when stock < Par stock.
  6. **Stock Inspection & Physical Audit:** Variance comparison between theoretical consumption and physical count.
  7. **Transactions Ledger:** Complete audit trail of every stock in, out, and wastage transaction.

#### 4.3 Recipe Management & Bill of Materials (BOM)
* Map raw ingredients to finished menu dishes:
  - *Example 1:* 1 Chicken Dum Biryani = 200g Basmati Rice + 250g Chicken + 30g Ghee + 5g Spices + 1 Foil Container.
  - *Example 2:* 1 Fresh Lime Soda = 1 Soda 250ml + 1 Lemon + 20g Sugar Syrup.
* **Automatic Stock Depletion:** Whenever a KOT is created, system automatically deducts corresponding ingredients in the background.

---

### Module 5: Dual Kitchen Routing (Kitchen Display Screen OR Kitchen Thermal Printer)

Restaurants operate differently based on their setup. QuantroBill supports **3 flexible kitchen modes**:
1. **Paperless Kitchen Screen (KDS):**
   - 15"-32" touch monitor or Android tablet mounted in the kitchen.
   - Live order cards, elapsed time counter, audio chimes, and tap to mark "Cooked / Ready".
2. **Traditional Kitchen Thermal Printer (LAN / USB):**
   - High-speed 80mm ESC/POS thermal printer (Epson, TVS, NGX) spitting out paper KOT tickets directly at the cooking station.
   - Automatic paper cut and loud buzzer alert.
3. **Hybrid Mode (Both Active):**
   - Chef sees the order on the KDS monitor AND a physical paper KOT is printed for the runner/cook.

### Module 5: Cash Register, Day Closing & Shifts

#### 5.1 Shift Register (Cash Drawer Management)
* **Opening Float:** Cashier enters opening balance (e.g. ₹3,000 for change) when starting shift.
* **Cash In / Cash Out (Petty Cash):**
  - Log expenses paid from register (e.g. ₹200 for emergency dairy purchase, ₹100 for cleaning supplies).
* **Day Closing (X-Report & Z-Report):**
  - **X-Report (Mid-day Audit):** Current expected cash vs actual cash without closing shift.
  - **Z-Report (End-of-Day Closure):** Final settlement summary: Total Cash, Card, UPI, Discounts, Taxes, Voids.
  - Calculation of Cash Variance: `Over` or `Short` amount recorded against the cashier's user ID.

---

### Module 6: CRM, Loyalty & Customer Profiles

* **Quick Customer Lookup:** Type 10-digit mobile number during billing to fetch name, email, past visits, lifetime spend, and favorite items.
* **Loyalty Points System:** Earn 1 point for every ₹100 spent; redeem points on future bills (1 point = ₹1).
* **Credit Ledger / Khata Book:** Allow trusted corporate customers or regular guests to maintain a due balance with repayment tracking.

---

### Module 7: Reports & Analytics (Actionable Insights)

* **Sales Summaries:** Daily, Weekly, Monthly sales graphs, Gross vs Net sales.
* **Top Selling Items:** Menu engineering matrix (Star items, Plowhorses, Puzzles, Dogs).
* **Payment Mode Breakdown:** Pie chart of UPI vs Cash vs Card vs Due.
* **Hourly Sales Heatmap:** Identify peak rush hours to optimize staff scheduling.
* **Discount & Cancellation Audit:** Detailed list of all bills with discounts or cancelled KOTs with staff names and remarks to prevent fraud.

---

## 3. Level 2 Login: Restaurant Owner / Admin Executive Portal

> [!NOTE]
> Designed to match enterprise back-office software (**Restosoft** and **Petpooja Owner Dashboard**). The Restaurant Owner/Admin uses this dedicated portal (`/owner/dashboard` or `/admin`) to monitor operations, staff, revenue, and inventory without getting bogged down in cashier touch screens.

### 3.1 Executive Real-Time Operations Dashboard (As per Screenshot 1 & 2)
* **Header Controls & Multi-Dimension Filtering:**
  - Cashier Selector: View sales and transactions for `All Cashiers` or filter by individual biller.
  - Date Range Picker (e.g., `Today`, `Yesterday`, `Custom Date Range`).
  - Time Window Filter: Filter from `00:00` to `23:59` with an `Apply Time` button.
* **Live Tables Breakdown Matrix:**
  - Real-time tabs: **Dine Fine**, **Custom Tables**, **Take Away**, **Home Delivery**.
  - Interactive table chips displaying Table Number and Running Order Amount (e.g. `RM3 ₹1890`, `RM6 ₹1404`, `RM4 ₹446`, `RM9 ₹646`, `RM15 ₹975`).
* **Live Running Orders KPI Bar:**
  - **Running Dine-In:** Active live order count (e.g., 12 orders) and revenue (₹19,756).
  - **Running Parcel (Takeaway):** Active takeaway queue count & total.
  - **Running Delivery:** Active dispatches (e.g., 1 delivery, ₹1,139).
  - **Running Overall:** Aggregated active orders (e.g., 13 orders, ₹20,895).

---

### 3.2 Employee Login & Granular Access Permission Manager (As per Screenshot 3)
* **Staff Directory with Real-time Presence:**
  - Left panel listing all restaurant staff: Waiters, Cashiers, Captains, Kitchen Chefs.
  - Presence status badge: 🟢 `Active Now` (currently logged in) vs 🔴 `Logged Out X time ago`.
* **Staff Credential & Section Assignment:**
  - Fields: `Menu Code`, `User Name`, `User Contact Number`, `Password`.
  - Allowed Section Access: Multi-select sections (e.g. `FINE DINE - 23 tables`, `TAKE AWAY - 5 counters`, `HOME DELIVERY - 10 zones`).
* **Visual Permission Toggle Matrix (15 Modular Capabilities):**
  - Owner can toggle green checkmark (Allowed) or red cross (Blocked) for each employee across:
    1. **Orders** (General order punching)
    2. **Fine Dine** (Full dine-in table access)
    3. **QSR** (Express counter sale)
    4. **Food Court** (Token based orders)
    5. **Restro Bar** (Alcohol / Bar menu access)
    6. **Recents** (View past bills)
    7. **Bakery / Pastry**
    8. **Sales History** (Historical bill lookup)
    9. **Reports** (Day sales & profit audit)
    10. **Expenses** (Petty cash in/out entry)
    11. **Inventory** (Stock check and raw material usage)
    12. **Kitchen** (KDS / Kitchen order screen access)
    13. **Menu** (Price editing & 86 out-of-stock toggles)
    14. **Settings** (Receipt printer & tax config)
    15. **Help & Support**

---

### 3.3 Customer Khata Book & CRM (As per Screenshot 2)
* **Guest-Visit Customers:** Lifetime visit count, total revenue generated, favorite dishes.
* **Credit Customers (Due / Khata Book):** List of trusted guests with outstanding credit balances, repayment ledger, and WhatsApp reminder triggers.

---

## 4. Level 1 Login: Dedicated SuperAdmin SaaS Portal Requirements

> [!IMPORTANT]
> The SuperAdmin portal **MUST be completely isolated** from the regular restaurant staff login page. It has its own route (`/superadmin/login`), unique JWT token claims (`role: "SuperAdmin"`), and dedicated database views.

### SuperAdmin Core Capabilities
1. **Tenant (Restaurant) Onboarding & Management:**
   - Create new Restaurant Tenants (Restaurant Name, Owner Name, Phone, Email, GSTIN, Address).
   - Multi-Outlet Support: Create branch outlets under a tenant (e.g. "Main Branch", "Express Counter 2").
2. **Subscription & Licensing Engine:**
   - Define plans: **Starter** (1 POS, no KDS), **Professional** (3 POS, 2 KDS, Waiter App), **Enterprise** (Unlimited POS, Multi-branch, Custom reports).
   - Manage license validity (e.g., 365-day subscription).
   - Hard lock / Soft lock: Automatically display an expiration banner or block billing if subscription expires.
3. **Feature Flagging per Tenant:**
   - Toggle features on/off per restaurant: `EnableKDS`, `EnableOnlineAggregators`, `EnableRecipeInventory`, `EnableLoyaltyPoints`.
4. **Global Platform Telemetry:**
   - Total registered restaurants, active restaurants today, total bills processed across the platform, Monthly Recurring Revenue (MRR).

---

## 4. Hardware Integration Requirements (Thermal Printing)

* **ESC/POS Command Support:** Generate raw ESC/POS binary data for 3-inch (80mm) and 2-inch (58mm) thermal receipt printers.
* **Connectivity Modes:**
  - **Network / LAN (TCP/IP):** Connect directly to printer IP address (e.g., `192.168.1.200:9100`) for high-speed kitchen KOT printing.
  - **USB / Virtual COM:** Direct desktop printing via Tauri/Electron or Web Serial API.
  - **Bluetooth:** Handheld mobile thermal printer printing from the Waiter Mobile App.
* **Cash Drawer Kick:** Send pulse command (`ESC p 0 25 250`) on cash settlement to automatically pop open the cash drawer.
