# 🚀 Solo Developer Playbook: Building QuantroBill POS with AI Agent

> **Document Version:** 1.0.0  
> **Target Audience:** Solo Full-Stack Developer working with Antigravity / AI Agent  
> **Motto:** *"Divide, Conquer, Verify & Ship — One Module at a Time."*

---

## 1. The Solo Developer Mindset

Building an enterprise-level SaaS like Petpooja alone can feel overwhelming if attempted all at once. The secret to success when pairing with an AI coding assistant is **strict phased execution**:
1. **Never ask the agent to build the entire system in one prompt.**
2. **Focus on one complete user story per session** (e.g. "Today we will finish Table Shifting and Table Merging with live SignalR broadcast").
3. **Verify every step visually and via Swagger/API test** before moving to the next module.
4. **Track progress on your interactive dashboard** (`docs/project_tracker.html`).

---

## 2. Six-Phase Master Roadmap

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Backend Foundation, Multi-Tenancy & Core DB                   │
│ • MongoDB indexing, Tenant isolation, Seed data, Swagger test          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ PHASE 2: Cashier POS Billing Counter & Real-Time Table Manager          │
│ • Keyboard shortcuts, Bill print engine, Live SignalR floor plan        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ PHASE 3: Paperless Kitchen Display System (KDS) & Order Alerts         │
│ • Kitchen timer cards, sound chimes, Cooked status, Bump KOT           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ PHASE 4: SuperAdmin Portal Complete Isolation                          │
│ • `/superadmin/login`, Tenant onboarding, Subscription license engine   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ PHASE 5: React Native Waiter & Captain Handheld Mobile App             │
│ • Android/iOS app, 4-digit PIN, punch order at table, sync with POS    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ PHASE 6: Desktop App Packaging (Tauri) & Hardware ESC/POS Printers     │
│ • Windows desktop exe, silent thermal USB/LAN printing, cash drawer kick│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase-by-Phase Action Plan & Exact Agent Prompts

### 📍 Phase 1: Database & Multi-Tenant Backend (Foundation)
* **Goal:** Rock-solid MongoDB database schema, JWT auth, and multi-tenant security.
* **What's already done:** `PetBharke.API`, `PetBharke.Infrastructure`, `Program.cs`.
* **Agent Prompt to copy-paste:**
  > *"Hey Agent, let's verify Phase 1: Check MongoDB collections, ensure `TenantId` and `OutletId` are indexed on Orders, Tables, and MenuItems, and test the JWT auth flow in Swagger. Show me the exact seed data login credentials."*

---

### 📍 Phase 2: Web POS Billing & Table Manager
* **Goal:** High-speed cashier billing counter with live visual table occupancy.
* **Checklist:**
  - [x] Dine-in, Takeaway, Delivery order toggle
  - [x] Table visual floor plan with color coding (Green, Red, Yellow)
  - [ ] Split Bill modal (Equal split & custom item split)
  - [ ] Table Shifting & Merging modal
  - [ ] Receipt print preview with GST breakdown
* **Agent Prompt to copy-paste:**
  > *"Hey Agent, let's implement the Split Bill and Table Merge features in `Billing.tsx` and `TableManager.tsx`. Ensure that when a table is shifted or merged, it sends an update to ASP.NET Core and broadcasts via SignalR."*

---

### 📍 Phase 3: Kitchen Display System (KDS) & Chimes
* **Goal:** Chefs in the kitchen see incoming KOTs in real-time without reloading.
* **Checklist:**
  - [x] KDS layout with order cards
  - [ ] Audio chime sound (`ding.mp3`) when `ReceiveOrderUpdate` fires
  - [ ] Color urgency timer: Green (<10m) -> Amber (10-20m) -> Red (>20m)
  - [ ] "Mark Ready" button sends push notification to waiter
* **Agent Prompt to copy-paste:**
  > *"Hey Agent, let's upgrade `KDS.tsx` to add sound effects using Web Audio API on new orders, live elapsed timer ticking every second with color-coded urgency, and a 'Mark Cooked' button."*

---

### 📍 Phase 4: SuperAdmin Dedicated Portal & Licensing
* **Goal:** Completely decouple SuperAdmin from restaurant staff.
* **Checklist:**
  - [ ] Dedicated route `/superadmin/login` with unique UI
  - [ ] Tenant onboarding form (Name, GST, Owner details, Initial admin setup)
  - [ ] Subscription plan selector (Starter, Pro, Enterprise) with expiry dates
  - [ ] Feature toggle switches per restaurant
* **Agent Prompt to copy-paste:**
  > *"Hey Agent, let's isolate the SuperAdmin portal. Move SuperAdmin out of the restaurant `<AppLayout />` into its own `/superadmin/login` and `/superadmin/dashboard` with independent auth guard."*

---

### 📍 Phase 5: React Native Waiter Mobile App
* **Goal:** Waiters punch orders at the dining table on their mobile phones.
* **Checklist:**
  - [ ] Initialize React Native Expo app in `waiter-mobile/`
  - [ ] 4-digit staff PIN login
  - [ ] Visual table grid
  - [ ] Fast item search & category selector
  - [ ] Fire KOT directly to ASP.NET Core API with SignalR listener
* **Agent Prompt to copy-paste:**
  > *"Hey Agent, let's scaffold the React Native Waiter App in `waiter-mobile/` using the architecture blueprint from `docs/04_REACT_NATIVE_WAITER_APP_BLUEPRINT.md`."*

---

### 📍 Phase 6: Desktop App (Tauri) & Thermal Receipt Printing
* **Goal:** Installable `.exe` for Windows billing counter with silent thermal printing.
* **Checklist:**
  - [ ] Add Tauri 2.0 to `client/`
  - [ ] Native ESC/POS USB & LAN socket printer service
  - [ ] Auto-open cash drawer on bill settlement
  - [ ] Local offline cache with IndexedDB
* **Agent Prompt to copy-paste:**
  > *"Hey Agent, let's set up the thermal printer service and Tauri configuration so we can print 80mm receipts directly to USB and Network thermal printers."*

---

## 4. Daily Workflow Rules for Solo Developers

1. **Before Starting Any Code:** Open `docs/project_tracker.html` in your browser to inspect your current progress and pick the next single task.
2. **Ask for Clarification:** If an API endpoint or UI behavior is ambiguous, discuss the exact JSON shape with the agent first.
3. **Commit Regularly:**
   ```bash
   git add .
   git commit -m "feat(billing): added table merge and split bill calculations"
   ```
4. **Use Swagger Constantly:** Keep `http://localhost:5000/swagger` open in one tab to test every backend endpoint independently of the frontend.
