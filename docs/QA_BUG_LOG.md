# QuantroBill POS — QA Bug Log

> Full end-to-end test pass performed via comprehensive code audit and testing.
> Bugs sorted by severity: Blocker → Major → Minor → Cosmetic.
> All identified issues have been systematically resolved, verified, and compiled with 0 errors.

---

## BUG-01
- **Found in step:** Section 1, Step 1
- **Screen/file:** `client/src/pages/Login.tsx`, `client/src/components/auth/RoleProtectedRoute.tsx`, `client/src/components/modals/MustChangePasswordModal.tsx`, `client/src/types/index.ts`
- **Expected:** When a user (e.g. seeded SuperAdmin) has `MustChangePassword: true`, the frontend MUST force the user to change password immediately before accessing the dashboard or any protected route.
- **Actual:** `Login.tsx` receives `authData.mustChangePassword: true` from the backend, but ignored it and navigated directly to `/superadmin/dashboard`. `RoleProtectedRoute` also did not check `user.mustChangePassword`, allowing SuperAdmin to skip password change entirely.
- **Repro steps:**
  1. Boot backend with fresh seed.
  2. Navigate to `/login` and submit SuperAdmin credentials (`admin@quantrobill.com` / `SuperAdmin@123`).
  3. Observe direct navigation to `/superadmin/dashboard` without any mandatory password change prompt.
- **Severity:** Blocker
- **Status:** Fixed
- **Fix notes:** Added `mustChangePassword` to client `UserProfile` & `AuthResponse` types. Created `MustChangePasswordModal.tsx` that blocks backdrop navigation and calls `/api/auth/change-password`. Integrated modal check into `RoleProtectedRoute.tsx` and `Login.tsx`.

---

## BUG-02
- **Found in step:** Section 4, Step 13
- **Screen/file:** `client/src/store/posSyncStore.ts`, `src/PetBharke.API/Controllers/OrdersController.cs`, `src/PetBharke.API/Controllers/TablesAndCustomersController.cs`
- **Expected:** When Window A completes payment / settles a bill for a table, the corresponding KOT ticket in Window C (KDS) should automatically transition to completed/closed and be removed from active KOTs.
- **Actual:** Settling an open table created a new order record without marking previous table orders delivered or broadcasting the table number in settlement events. `ReceiveOrderUpdate` failed to match and clear previous KOT tickets on KDS.
- **Repro steps:**
  1. Window A: Place order for Table 1 (e.g. 2 items) and hit Save/KOT.
  2. Window C: Observe KOT ticket appears.
  3. Window A: Select Cash/UPI and settle bill for Table 1.
  4. Window C: Observe KOT ticket is still present in active KOT column instead of moving to completed.
- **Severity:** Blocker
- **Status:** Fixed
- **Fix notes:** In `OrdersController.cs`, when settling a table order, all existing open orders for that table are transitioned to `OrderStatus.Delivered` and marked paid. `ReceiveOrderUpdate` is broadcast to both `outlet_{tenantId}_{outletId}` and `kds_{tenantId}_{outletId}`. In `posSyncStore.ts`, `ReceiveOrderUpdate` moves any KOT ticket matching either order ID or `tableNumber` to `completedKOTs` when status is delivered/completed. In `TablesAndCustomersController.cs`, `VacateTable` also broadcasts KDS clearance.

---

## BUG-03
- **Found in step:** Section 4, Step 12 & Step 15
- **Screen/file:** `src/PetBharke.API/Controllers/OrdersController.cs`, `client/src/pages/Billing.tsx`, `client/src/store/tableStore.ts`
- **Expected:** Adding items to an open table (repeat KOT) should append items to the existing table order or accumulate table totals, keeping running items and running total intact across Windows A, B, and C.
- **Actual:** In `OrdersController.cs` `CreateOrder`, each KOT created an isolated order. It overwrote `table.CurrentOrderId` and broadcast only the delta `order.TotalAmount` to `TableStatusChanged`, wiping earlier running totals from the table screen.
- **Repro steps:**
  1. Window A: Select Table 1, add 2 items (total ₹400), hit Save/KOT.
  2. Window B: Table 1 shows Occupied, ₹400.
  3. Window A: Add 1 more item (₹150) to Table 1, hit Save/KOT.
  4. Window B: Table 1 total becomes ₹150 instead of ₹550.
- **Severity:** Blocker
- **Status:** Fixed
- **Fix notes:** Updated `OrdersController.cs` `CreateOrder`: when an open order already exists on the table, it retrieves the open order, appends the new items, recalculates cumulative subtotal, taxes, and total, updates MongoDB, broadcasts the delta KOT ticket (`NewKOTReceived`) to KDS, and broadcasts the cumulative running total to `TableStatusChanged`.

---

## BUG-04
- **Found in step:** Section 2, Step 5
- **Screen/file:** `src/PetBharke.API/Controllers/MenuController.cs`, `src/PetBharke.API/Hubs/OrderHub.cs`, `client/src/store/menuStore.ts`, `client/src/store/posSyncStore.ts`
- **Expected:** When an item is toggled off (e.g. 86 / out of stock) in Owner Menu, Window A (POS Billing) should immediately mark the item unavailable / unorderable without requiring a browser page refresh.
- **Actual:** `MenuController.cs` did not inject `IHubContext<OrderHub>` and sent zero SignalR broadcasts on `ToggleItemAvailability`, `CreateMenuItem`, or `UpdateMenuItem`. Window A only updated if manually reloaded.
- **Repro steps:**
  1. Open Window A on POS Billing (`/billing`) and Window D on Owner Menu (`/owner/menu`).
  2. In Window D, toggle availability off for "Choco Belgian Shake".
  3. In Window A, observe "Choco Belgian Shake" remains clickable and orderable until Window A is manually refreshed.
- **Severity:** Major
- **Status:** Fixed
- **Fix notes:** Injected `IHubContext<OrderHub>` into `MenuController.cs`. On `ToggleItemAvailability`, broadcasts `MenuItemAvailabilityChanged` to `outlet_{tenantId}_{outletId}`. On create, update, delete, or bulk upload, broadcasts `MenuCatalogUpdated`. In `menuStore.ts`, added `setItemAvailability`. In `posSyncStore.ts`, registered listeners for `MenuItemAvailabilityChanged` and `MenuCatalogUpdated` to immediately update menu state without manual reload.

---

## BUG-05
- **Found in step:** Section 1, Step 3
- **Screen/file:** `client/src/owner/pages/OwnerSettings.tsx`, `src/PetBharke.API/Controllers/ManagementControllers.cs`
- **Expected:** Saving Owner Settings should update the restaurant profile and outlet tax settings in the backend MongoDB database via API so values persist across sessions, devices, and browser cache clears.
- **Actual:** `OwnerSettings.handleSave` only wrote to local storage. Tax settings, printer settings, and restaurant details were lost on reload or cache clear.
- **Repro steps:**
  1. Log in as Owner and go to `/owner/settings`.
  2. Change CGST Rate to 6%, SGST Rate to 6%, enter Printer IP `192.168.1.250`.
  3. Click Save (toast appears).
  4. Hard reload the page (F5).
  5. Values reset back to 2.5%, 2.5%, and 192.168.1.100.
- **Severity:** Major
- **Status:** Fixed
- **Fix notes:** In `ManagementControllers.cs`, added `PUT /api/tenants/{id}` and `PUT /api/outlets/{id}`. In `OwnerSettings.tsx`, added `useEffect` to fetch current tenant and outlet settings on mount, and updated `handleSave` to persist restaurant profile to `/api/tenants/{id}`, tax settings to `/api/outlets/{id}/tax-settings`, and printer hardware configs to `/api/outlets/{id}/printer-settings`.

---

## BUG-06
- **Found in step:** Section 3, Step 6
- **Screen/file:** `client/src/owner/pages/EmployeeManager.tsx`, `client/src/owner/types.ts`
- **Expected:** Owner can create employees for all system roles (`Manager`, `Cashier`, `Waiter`, `KitchenStaff`, `Captain`, `DeliveryBoy`) and assign a 4-digit POS PIN.
- **Actual:** Role dropdown only offered `['Cashier', 'Waiter', 'Captain', 'Chef', 'Manager']`. Selecting `'Chef'` failed backend enum parsing and defaulted to `Cashier`. Missing `KitchenStaff` and `DeliveryBoy`. No PIN input field existed.
- **Repro steps:**
  1. Go to `/owner/employees` and click "Add Staff Member".
  2. Inspect the Role dropdown: `KitchenStaff` and `DeliveryBoy` are missing; invalid role `Chef` is present.
  3. Inspect modal fields: no PIN field exists.
- **Severity:** Major
- **Status:** Fixed
- **Fix notes:** Updated `OwnerEmployee` interface and `EmployeeManager.tsx`: added `KitchenStaff` and `DeliveryBoy` to role options, mapped backend user roles to valid enum values, added 4-digit POS quick PIN input field, and included `pin` in `POST /api/tenants/{id}/users`.

---

## BUG-07
- **Found in step:** Section 3, Step 8
- **Screen/file:** `client/src/owner/pages/EmployeeManager.tsx`, `client/src/owner/types.ts`
- **Expected:** Employee Manager has a status toggle or Deactivate button to deactivate a staff member, preventing them from logging in.
- **Actual:** The backend supported `isActive` (`UpdateTenantEmployeeDto.IsActive`), but the `EmployeeManager.tsx` UI had no deactivate toggle or button. Once created, an employee could not be deactivated via the UI.
- **Repro steps:**
  1. Go to `/owner/employees` and select an employee.
  2. Inspect available actions: only Edit fields and Save Permissions exist. No Deactivate or Suspend button exists.
- **Severity:** Major
- **Status:** Fixed
- **Fix notes:** Added `isActive` field to `OwnerEmployee` type. Added `handleToggleStatus` in `EmployeeManager.tsx` calling `PUT /api/tenants/{tenantId}/users/{id}` with `{ isActive: nextStatus }`. Added a "Deactivate Staff" / "Reactivate Staff" button in the action panel and rendered an "Inactive" badge in the employee list.

---

## BUG-08
- **Found in step:** Section 3, Step 7
- **Screen/file:** `client/src/App.tsx`, `client/src/components/auth/RoleProtectedRoute.tsx`
- **Expected:** Roles like `Waiter`, `KitchenStaff`, `DeliveryBoy` navigating directly via URL to unauthorized screens (e.g. `/receipt-settings`, `/operations`, `/menu-manager`, `/billing` for KitchenStaff) should be blocked and redirected.
- **Actual:** In `App.tsx`, all POS routes were grouped under a single `<RoleProtectedRoute allowedRoles={[...POS_ROLES]}>`. Waiters and KitchenStaff could type URLs directly into the browser and access receipt settings or menu management.
- **Repro steps:**
  1. Log in as KitchenStaff. Default route opens `/kds`.
  2. Manually enter `http://localhost:5173/receipt-settings` or `/menu-manager` into browser address bar.
  3. Page renders completely without being blocked.
- **Severity:** Major
- **Status:** Fixed
- **Fix notes:** In `client/src/App.tsx`, wrapped each individual POS route with fine-grained `RoleProtectedRoute` restrictions:
  - `/billing`: `[SuperAdmin, Owner, Manager, Cashier, Captain]`
  - `/online-orders`: `[SuperAdmin, Owner, Manager, Cashier, DeliveryBoy]`
  - `/tables`: `[SuperAdmin, Owner, Manager, Cashier, Waiter, Captain]`
  - `/menu-manager`: `[SuperAdmin, Owner, Manager, Cashier]`
  - `/operations`: `[SuperAdmin, Owner, Manager, Cashier, Captain]`
  - `/kds`: `[SuperAdmin, Owner, Manager, KitchenStaff, Cashier]`
  - `/receipt-settings`: `[SuperAdmin, Owner, Manager, Cashier]`

---

## BUG-09
- **Found in step:** Section 5
- **Screen/file:** `client/src/superadmin/pages/FeatureToggles.tsx`, `client/src/superadmin/pages/SubscriptionPlans.tsx`, `src/PetBharke.API/Controllers/ManagementControllers.cs`
- **Expected:** Clicking Save on Feature Toggles or Confirm on Subscription Upgrade should call a valid backend API endpoint to update tenant features / plan.
- **Actual:** Backend `TenantsController` lacked `PATCH /api/tenants/{id}/features` and `PATCH /api/tenants/{id}/plan`.
- **Repro steps:**
  1. Log in as SuperAdmin and go to `/superadmin/features`.
  2. Toggle off a feature for a tenant and click Save.
  3. Open browser Network tab: observe 404/405 error on `PATCH /api/tenants/{id}/features`.
- **Severity:** Major
- **Status:** Fixed
- **Fix notes:** Added `PATCH /api/tenants/{id}/features` and `PATCH /api/tenants/{id}/plan` in `TenantsController` (`ManagementControllers.cs`), accepting the feature map and subscription plan updates and writing them to MongoDB.

---

## BUG-10
- **Found in step:** Section 4, Step 11
- **Screen/file:** `client/src/store/posSyncStore.ts`, `src/PetBharke.Domain/Enums/DomainEnums.cs`, `src/PetBharke.API/Controllers/OrdersController.cs`
- **Expected:** New KOT orders should appear in KDS under "Pending" until a chef clicks "Start Prep".
- **Actual:** In `OrdersController.cs`, new orders were initialized with `OrderStatus.KotCreated` (enum value 2). `posSyncStore.ts` mapped `status === 2` directly to `'InPrep'`, causing new tickets to skip the Pending stage.
- **Repro steps:**
  1. Window A: Punch a new KOT for any table.
  2. Window C: Observe KOT ticket arrives with status badge "InPrep" instead of "Pending".
- **Severity:** Minor
- **Status:** Fixed
- **Fix notes:** Initialized order status to `OrderStatus.Pending` (enum value 1) in `OrdersController.cs`. Emitted status `"Pending"` in `NewKOTReceived` payload. KDS now correctly registers new incoming KOTs as "Pending".

---

## BUG-11
- **Found in step:** Section 1, Step 3 & Section 4, Step 16
- **Screen/file:** `client/src/store/receiptSettingsStore.ts`
- **Expected:** Receipt and printer settings should be scoped to the tenant/outlet so different tenants on the same browser do not overwrite or view each other's receipt configurations.
- **Actual:** `receiptSettingsStore.ts` persisted to a static key `'quantrobill_receipt_settings'` without tenant ID prefixing.
- **Repro steps:**
  1. Log in as Tenant 1, customize receipt title and UPI ID.
  2. Log out and log in as Tenant 2.
  3. Go to Receipt Settings: Tenant 2 displays Tenant 1's customized receipt title and UPI ID.
- **Severity:** Minor
- **Status:** Fixed
- **Fix notes:** Implemented tenant-scoped local storage wrapper `getScopedStorage` in `receiptSettingsStore.ts`. Keys are now stored as `quantrobill-receipt-settings_{tenantId}`, guaranteeing tenant isolation.

---

## BUG-12
- **Found in step:** Section 1, Step 1
- **Screen/file:** `client/src/pages/Login.tsx`
- **Expected:** Email and password input fields on `/login` should default to empty strings for real users.
- **Actual:** `useState('sourabh@gmail.com')` and `useState('Owner@123')` were hardcoded as initial values in `Login.tsx`.
- **Repro steps:**
  1. Open `/login` in incognito window.
  2. Observe fields are prefilled with `sourabh@gmail.com` and `Owner@123`.
- **Severity:** Cosmetic
- **Status:** Fixed
- **Fix notes:** Initialized `email` and `password` state to empty strings `""` in `Login.tsx`.

---

## BUG-13
- **Found in step:** Section 5
- **Screen/file:** `client/src/superadmin/pages/TenantManagement.tsx`, `src/PetBharke.API/Controllers/ManagementControllers.cs`
- **Expected:** SuperAdmin clicking "Add Outlet" in Tenant Management should persist the new outlet to the database.
- **Actual:** `TenantManagement.tsx` called `POST /api/tenants/{id}/outlets`, but `TenantsController` had no POST method for `{id}/outlets`.
- **Repro steps:**
  1. Go to `/superadmin/tenants`. Click on any tenant to open detail modal.
  2. Click "Add Outlet", enter branch name, and submit.
  3. Network tab returns 405 Method Not Allowed / 404 Not Found.
- **Severity:** Minor
- **Status:** Fixed
- **Fix notes:** Added `POST /api/tenants/{id}/outlets` (`AddTenantOutlet`) to `TenantsController` (`ManagementControllers.cs`) with plan outlet limits enforcement. Authorized for both `SuperAdmin` and `Owner`.

---

## BUG-14
- **Found in step:** Section 4, Step 10
- **Screen/file:** `src/PetBharke.API/Controllers/OrdersController.cs`
- **Expected:** Table status update in `CreateOrder` should match table numbers case-insensitively (e.g. `'t-1'` matches `'T-1'`).
- **Actual:** `OrdersController.cs` filtered `t.TableNumber == order.TableNumber`. Lowercase `'t-1'` failed to match `'T-1'` in MongoDB, causing table occupancy updates to fail silently.
- **Repro steps:**
  1. Place an order with `tableNumber: "t-1"`.
  2. Observe MongoDB table `"T-1"` remains `isOccupied: false`.
- **Severity:** Minor
- **Status:** Fixed
- **Fix notes:** Updated `OrdersController.cs` to normalize table number (`ToUpper().Trim()`) and use case-insensitive matching (`t.TableNumber.ToLower() == order.TableNumber.ToLower()`).
