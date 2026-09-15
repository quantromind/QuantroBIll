# QuantroBill SuperAdmin Portal — UI Architecture & Layout Notes

## 1. Layout Decision (Reference §2)
Based on Section §2 of the SuperAdmin Upgrade specification and the attached visual references (`portal.quantromind.com`), we evaluated two architectural layouts:
- **(a) Top Bar + Horizontal Navigation Tabs Row**: Adopted as the primary layout.
- **(b) Left Sidebar-only Nav**: Deprecated in favor of the horizontal tabs pattern to match the reference screenshots' generous desktop workspace.

### Why Pattern (a) was chosen:
1. **Direct Match with Visual References**: The screenshots feature a clean, full-width fixed header with an integrated horizontal sub-navigation row (`Home / Create / Leads / Clients / Subscriptions / My Documents ...`).
2. **Maximized Table Width**: By removing the fixed 256px left sidebar on desktop, tables (tenants, invoices, audit trails, staff) have ample breathing room for 8–10 columns without cramped horizontal scrolling.
3. **Responsive Preservation**: For mobile viewports (< 768px), the top bar provides a hamburger toggle that opens a mobile navigation drawer.

---

## 2. Visual Hierarchy & Components

### Top Bar
- **Brand / Logo**: Left-aligned QuantroBill icon with bold brand text and a subtle pill badge indicating the `SuperAdmin` role.
- **Global Search**: Center-left global search input with quick shortcut cues for searching across tenants, invoices, tickets, and audit trails.
- **Utility Actions**:
  - Notification bell with dynamic alert indicator.
  - Interactive Demo link.
  - User identity pill (avatar initial, admin name, and email).
  - High-visibility Logout button with confirmation.

### Horizontal Navigation Tab Row
- Positioned directly below the top bar in `SuperAdminLayout.tsx`.
- Pill/tab buttons with icon and label.
- **Active Tab State**: Highlighted with an active filled pill background (`bg-amber-100/70 text-amber-900 border border-amber-200/80` or `bg-blue-600 text-white` depending on theme, matching the cream active pill from the reference screenshot's "My Documents" tab).
- Smooth horizontal scroll container with hidden scrollbars to accommodate all 13 primary sections cleanly.

### Page Structure Template
1. **`PageHeader`**: Icon, title, subtitle, refresh button, and primary action button (e.g. `+ New Plan`, `+ Add Tenant`).
2. **`StatCard` Grid**: 3–4 stat cards across the top of every list page (e.g. Total Revenue, MRR, ARR, Overdue Invoices), featuring big numbers, uppercase small labels, and circular pastel icon accents.
3. **`DataTableToolbar`**: Clean single-row container with search input, status/type dropdown filters, page-size selector, and record count badge (`N found`).
4. **Data Tables**:
   - Small uppercase header typography (`text-[11px] font-bold text-slate-500 tracking-wider`).
   - Colored pill status badges (`Active`, `Paid`, `Suspended`, `Overdue`).
   - Right-aligned currency and numeric values with Indian Rupee formatting (`₹23,66,518`).
   - Compact actions column on right edge with circular outline icon buttons for View, Edit, Link, and Delete.

---

## 3. Strict Primary Flow Routing (No Modals Rule)
In adherence to Hard Rule #2:
- **Tenant Management**: List at `/superadmin/tenants`, Detail view at `/superadmin/tenants/:id`, and New Tenant onboarding at `/superadmin/tenants/new`.
- **Plans Catalog**: Catalog list at `/superadmin/plans-catalog`, Plan editor at `/superadmin/plans-catalog/new` and `/:id`.
- **Platform Billing**: Invoice list at `/superadmin/billing`, Full invoice view at `/superadmin/billing/:id`.
- **Platform Team**: Team list at `/superadmin/team`, Member editor at `/superadmin/team/new` and `/:id`.
- **Announcements**: List at `/superadmin/announcements`, Composer at `/superadmin/announcements/new` and `/:id`.
- **Coupons**: List at `/superadmin/coupons`, Coupon editor at `/superadmin/coupons/new` and `/:id`.
- Modals are strictly reserved for lightweight confirmations (e.g. `ConfirmDialog` for suspension or deactivation).
