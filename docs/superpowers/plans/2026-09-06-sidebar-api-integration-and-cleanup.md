# Sidebar API Integration & Project Cleanup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix sidebar navigation to display dynamic badge counts from the API, create missing dashboard pages, and clean up dead code from the previous clinic system project.

**Architecture:** Add a sidebar stats API endpoint that returns badge counts (pending orders, pending payments, low stock alerts). Update the dashboard layout to fetch these stats and populate sidebar badges. Create missing dashboard page stubs for payments, shipments, invoices, categories, and settings. Remove empty medical module folders and unused legacy code.

**Tech Stack:** Next.js 15 App Router, React 19, TanStack Query, Express.js, Prisma, PostgreSQL, TypeScript, TailwindCSS, Zustand

**Spec:** `SPEC.md`, `journey.md`

## Global Constraints

- Node.js 18+
- TypeScript strict mode
- Prisma ORM with PostgreSQL
- JWT auth with 7-day expiry
- Role-based access: ADMIN, STAFF, CUSTOMER
- Soft delete pattern (isDeleted fields)
- All API responses use `sendSuccess`/`sendError` helpers
- Frontend uses `authGet`/`authPost`/`authPut`/`authDelete` from `@/lib/api.ts`

---

## File Structure

### Files to Create
- `client/src/app/(dashboard)/dashboard/payments/page.tsx` — Payments management page
- `client/src/app/(dashboard)/dashboard/shipments/page.tsx` — Shipments management page
- `client/src/app/(dashboard)/dashboard/invoices/page.tsx` — Invoices management page
- `client/src/app/(dashboard)/dashboard/categories/page.tsx` — Categories management page
- `client/src/app/(dashboard)/dashboard/settings/page.tsx` — Site settings page

### Files to Modify
- `client/src/app/(dashboard)/layout.tsx` — Add dynamic badge fetching + fix customer nav routes
- `client/src/app/(dashboard)/dashboard/analytics/page.tsx` — Replace hardcoded stats with API data
- `server/src/modules/dashboard/dashboard.controller.ts` — Add sidebar stats endpoint
- `server/src/modules/dashboard/dashboard.routes.ts` — Add sidebar stats route
- `server/package.json` — Fix name and description
- `client/src/stores/auth.store.ts` — Remove unused Zustand store

### Files to Delete
- `server/src/modules/medical-record/` (empty directory)
- `server/src/modules/patient/` (empty directory)
- `server/src/modules/schedule/` (empty directory)
- `server/src/modules/billing/` (empty directory)
- `server/src/modules/queue/` (empty directory)
- `server/src/modules/medication/` (empty directory)
- `server/src/routes/` (entire directory — legacy clinic routes)
- `server/src/services/` (entire directory — legacy clinic services)
- `server/src/utils/` (empty directory)
- `client/src/stores/auth.store.ts` (unused Zustand store)

---

### Task 1: Clean Up Dead Code from Clinic System

**Files:**
- Delete: `server/src/modules/medical-record/` (empty)
- Delete: `server/src/modules/patient/` (empty)
- Delete: `server/src/modules/schedule/` (empty)
- Delete: `server/src/modules/billing/` (empty)
- Delete: `server/src/modules/queue/` (empty)
- Delete: `server/src/modules/medication/` (empty)
- Delete: `server/src/routes/` (all files: auth.routes.ts, billing.routes.ts, medical-record.routes.ts, medication.routes.ts, patient.routes.ts, queue.routes.ts, schedule.routes.ts, user.routes.ts)
- Delete: `server/src/services/` (all files: auth.service.ts, billing.service.ts, medical-record.service.ts, medication.service.ts, patient.service.ts, queue.service.ts, schedule.service.ts, user.service.ts)
- Delete: `server/src/utils/` (empty directory)
- Delete: `client/src/stores/auth.store.ts` (unused Zustand store)
- Modify: `server/package.json` — Fix name and description

**Interfaces:**
- Consumes: None
- Produces: None (cleanup only)

- [ ] **Step 1: Remove empty medical module directories**

```bash
rm -rf server/src/modules/medical-record
rm -rf server/src/modules/patient
rm -rf server/src/modules/schedule
rm -rf server/src/modules/billing
rm -rf server/src/modules/queue
rm -rf server/src/modules/medication
```

- [ ] **Step 2: Remove legacy routes and services directories**

```bash
rm -rf server/src/routes
rm -rf server/src/services
rm -rf server/src/utils
```

- [ ] **Step 3: Remove unused Zustand auth store**

```bash
rm client/src/stores/auth.store.ts
```

- [ ] **Step 4: Fix server package.json naming**

Edit `server/package.json`:
- Change `"name": "clinic-server"` → `"name": "optic-luxe-server"`
- Change `"description": "Clinic Management System - Backend"` → `"description": "Optic Luxe Premium Eyewear - Backend"`

- [ ] **Step 5: Verify server still compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors (old routes/services were never imported in index.ts)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove dead clinic system code and fix package naming"
```

---

### Task 2: Add Sidebar Stats API Endpoint

**Files:**
- Modify: `server/src/modules/dashboard/dashboard.controller.ts` — Add `getSidebarStats` function
- Modify: `server/src/modules/dashboard/dashboard.routes.ts` — Add route

**Interfaces:**
- Consumes: None
- Produces: `GET /api/dashboard/sidebar-stats` returns `{ pendingOrders: number, pendingPayments: number, lowStockAlerts: number, totalUsers: number }`

- [ ] **Step 1: Add getSidebarStats to dashboard controller**

Append to `server/src/modules/dashboard/dashboard.controller.ts`:

```typescript
export async function getSidebarStats(req: Request, res: Response) {
  try {
    const role = req.user!.role;

    const stats: Record<string, number> = {};

    if (role === 'ADMIN' || role === 'STAFF') {
      const [pendingOrders, pendingPayments, lowStockAlerts, totalUsers] = await Promise.all([
        prisma.order.count({ where: { isDeleted: false, status: 'PENDING' } }),
        prisma.payment.count({ where: { paymentStatus: 'PENDING' } }),
        prisma.productVariant.count({
          where: { isDeleted: false, stockQty: { lte: prisma.productVariant.fields.minStockQty } },
        }),
        role === 'ADMIN' ? prisma.user.count({ where: { isDeleted: false } }) : Promise.resolve(0),
      ]);

      stats.pendingOrders = pendingOrders;
      stats.pendingPayments = pendingPayments;
      stats.lowStockAlerts = lowStockAlerts;
      stats.totalUsers = totalUsers;
    }

    if (role === 'CUSTOMER') {
      const [activeOrders, wishlistItems] = await Promise.all([
        prisma.order.count({ where: { userId: req.user!.userId, isDeleted: false, status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
        prisma.wishlistItem.count({ where: { userId: req.user!.userId } }),
      ]);

      stats.activeOrders = activeOrders;
      stats.wishlistItems = wishlistItems;
    }

    return sendSuccess(res, stats);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
```

- [ ] **Step 2: Add route for sidebar stats**

Edit `server/src/modules/dashboard/dashboard.routes.ts` to add:

```typescript
router.get('/sidebar-stats', authMiddleware, getSidebarStats);
```

- [ ] **Step 3: Verify server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/dashboard/dashboard.controller.ts server/src/modules/dashboard/dashboard.routes.ts
git commit -m "feat: add sidebar stats API endpoint for dynamic badge counts"
```

---

### Task 3: Update Dashboard Layout with Dynamic Badges

**Files:**
- Modify: `client/src/app/(dashboard)/layout.tsx` — Fetch sidebar stats, populate badges, fix customer nav routes

**Interfaces:**
- Consumes: `GET /api/dashboard/sidebar-stats` from Task 2
- Produces: Sidebar badges update dynamically based on role

- [ ] **Step 1: Add imports and query hook to dashboard layout**

Replace the imports section and add the query. The key changes to `client/src/app/(dashboard)/layout.tsx`:

1. Add `useQuery` import from `@tanstack/react-query`
2. Add `authGet` import from `@/lib/api`
3. Add sidebar stats query after the `useAuth()` call:

```typescript
const { data: statsResponse } = useQuery({
  queryKey: ["dashboard", "sidebar-stats"],
  queryFn: () => authGet<{ data: Record<string, number> }>("/dashboard/sidebar-stats"),
  enabled: !!user,
});

const stats = statsResponse?.data || {};
```

- [ ] **Step 2: Fix customer nav routes**

Change customer nav from `/account/*` to `/dashboard/*` routes:

```typescript
const customerNav: NavItem[] = [
  { label: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { label: "Addresses", href: "/dashboard/addresses", icon: Package },
  { label: "Account", href: "/dashboard/account", icon: Users },
];
```

- [ ] **Step 3: Add dynamic badges to nav items**

Replace the nav items mapping section to inject badges from stats:

```typescript
const getNavWithBadges = (items: NavItem[]): NavItem[] => {
  return items.map((item) => {
    let badge: string | undefined;
    if (item.href === "/dashboard/orders" && stats.pendingOrders > 0) badge = String(stats.pendingOrders);
    if (item.href === "/dashboard/payments" && stats.pendingPayments > 0) badge = String(stats.pendingPayments);
    if (item.href === "/dashboard/warehouse" && stats.lowStockAlerts > 0) badge = String(stats.lowStockAlerts);
    if (item.href === "/dashboard/users" && stats.totalUsers > 0) badge = String(stats.totalUsers);
    if (item.href === "/dashboard/wishlist" && stats.wishlistItems > 0) badge = String(stats.wishlistItems);
    if (item.href === "/dashboard/orders" && role === "CUSTOMER" && stats.activeOrders > 0) badge = String(stats.activeOrders);
    return { ...item, badge };
  });
};

const navItems = getNavWithBadges(
  role === "ADMIN" ? adminNav : role === "STAFF" ? staffNav : customerNav
);
```

- [ ] **Step 4: Verify layout renders**

Run: `cd client && npm run build`
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add client/src/app/\(dashboard\)/layout.tsx
git commit -m "feat: add dynamic badge counts to sidebar navigation"
```

---

### Task 4: Create Missing Dashboard Pages

**Files:**
- Create: `client/src/app/(dashboard)/dashboard/payments/page.tsx`
- Create: `client/src/app/(dashboard)/dashboard/shipments/page.tsx`
- Create: `client/src/app/(dashboard)/dashboard/invoices/page.tsx`
- Create: `client/src/app/(dashboard)/dashboard/categories/page.tsx`
- Create: `client/src/app/(dashboard)/dashboard/settings/page.tsx`

**Interfaces:**
- Consumes: Existing API endpoints (`GET /payments`, `GET /shipments`, `GET /invoices`, `GET /categories`, `GET /site-config`)
- Produces: Functional dashboard pages for each section

- [ ] **Step 1: Create payments page**

Create `client/src/app/(dashboard)/dashboard/payments/page.tsx` with:
- Fetch `GET /payments` with status filter
- Table showing payment ID, order number, customer, amount, method, status, date
- Status badges (PENDING=warning, VERIFIED=success, FAILED=danger)
- Pagination

- [ ] **Step 2: Create shipments page**

Create `client/src/app/(dashboard)/dashboard/shipments/page.tsx` with:
- Fetch shipments (via order listing with shipment data)
- Table showing order number, customer, courier, tracking, status, date
- Status badges matching shipment statuses
- Pagination

- [ ] **Step 3: Create invoices page**

Create `client/src/app/(dashboard)/dashboard/invoices/page.tsx` with:
- Fetch `GET /invoices`
- Table showing invoice number, order number, amount, status, issued date
- Status badges (ISSUED=default, PAID=success, OVERDUE=danger)
- Pagination

- [ ] **Step 4: Create categories page**

Create `client/src/app/(dashboard)/dashboard/categories/page.tsx` with:
- Fetch `GET /categories`
- Table showing name, slug, product count, status, sort order
- Active/inactive toggle display
- Admin-only (check role)

- [ ] **Step 5: Create settings page**

Create `client/src/app/(dashboard)/dashboard/settings/page.tsx` with:
- Fetch site config (placeholder — endpoint may need creation)
- Form displaying site name, tagline, hero content, contact info, social links
- Read-only for now (edit functionality can be added later)

- [ ] **Step 6: Verify all pages compile**

Run: `cd client && npm run build`
Expected: No TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add client/src/app/\(dashboard\)/dashboard/
git commit -m "feat: add missing dashboard pages for payments, shipments, invoices, categories, settings"
```

---

### Task 5: Fix Analytics Page Hardcoded Data

**Files:**
- Modify: `client/src/app/(dashboard)/dashboard/analytics/page.tsx` — Replace hardcoded stat values with API data

**Interfaces:**
- Consumes: `GET /api/dashboard/analytics` (existing endpoint)
- Produces: Stats cards display real data from API response

- [ ] **Step 1: Update analytics page to use API data for stats cards**

Replace the hardcoded StatCard values in `client/src/app/(dashboard)/dashboard/analytics/page.tsx`:

The current code has:
```typescript
<StatCard title="Total Revenue" value={formatPrice(125000000)} ... />
<StatCard title="Total Orders" value={342} ... />
<StatCard title="Total Users" value={158} ... />
<StatCard title="Avg. Order Value" value={formatPrice(365000)} ... />
```

Replace with API-derived values:
```typescript
const totalRevenue = data?.monthlyRevenue?.reduce((sum, m) => sum + m.revenue, 0) || 0;
const totalOrders = data?.ordersByStatus?.reduce((sum, s) => sum + s.count, 0) || 0;
const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

<StatCard title="Total Revenue" value={formatPrice(totalRevenue)} icon={<DollarSign className="w-6 h-6" />} />
<StatCard title="Total Orders" value={totalOrders} icon={<ShoppingBag className="w-6 h-6" />} />
<StatCard title="Avg. Order Value" value={formatPrice(avgOrderValue)} icon={<TrendingUp className="w-6 h-6" />} />
```

Note: Total Users stat should be removed from analytics page since the analytics endpoint doesn't return user count — that's available in the main dashboard.

- [ ] **Step 2: Verify analytics page compiles**

Run: `cd client && npm run build`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add client/src/app/\(dashboard\)/dashboard/analytics/page.tsx
git commit -m "fix: replace hardcoded analytics stats with API data"
```

---

### Task 6: Final Verification

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified working system

- [ ] **Step 1: Run full server build**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run full client build**

Run: `cd client && npm run build`
Expected: No errors

- [ ] **Step 3: Start server and test sidebar stats endpoint**

Run: `cd server && npm run dev`
Then: `curl http://localhost:3001/api/dashboard/sidebar-stats -H "Authorization: Bearer <token>"`
Expected: Returns `{ pendingOrders, pendingPayments, lowStockAlerts }` for admin/staff

- [ ] **Step 4: Verify sidebar badges render**

- Login as admin → sidebar should show badge counts
- Login as staff → sidebar should show badge counts
- Login as customer → sidebar should show active orders count

- [ ] **Step 5: Verify all new dashboard pages load**

- Navigate to `/dashboard/payments` → page renders
- Navigate to `/dashboard/shipments` → page renders
- Navigate to `/dashboard/invoices` → page renders
- Navigate to `/dashboard/categories` → page renders
- Navigate to `/dashboard/settings` → page renders

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final verification and cleanup"
```
