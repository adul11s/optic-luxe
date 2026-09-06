# Optic Luxe User Guide

A complete guide to using the Optic Luxe premium eyewear platform — from browsing glasses to managing your store.

---

## Table of Contents

- [What is Optic Luxe?](#what-is-optic-luxe)
- [Getting Started](#getting-started)
- [Shopping as a Customer](#shopping-as-a-customer)
- [Managing Your Account](#managing-your-account)
- [Staff Operations](#staff-operations)
- [Admin Management](#admin-management)
- [Technical Reference](#technical-reference)

---

## What is Optic Luxe?

Optic Luxe is a full-featured online eyewear store. Customers can browse, try on glasses virtually using their camera, and place orders. Staff can process orders, manage inventory, and handle walk-in sales through a built-in Point of Sale system. Admins have full control over products, users, analytics, and site configuration.

**Key highlights:**
- Virtual AR try-on using your webcam
- Online shopping with cart and checkout
- Point of Sale (POS) for walk-in customers
- Real-time inventory and warehouse management
- Order, payment, shipment, and invoice tracking
- Role-based access for Admin, Staff, and Customer

---

## Getting Started

### System Requirements

- **Node.js** 18+ and npm
- **PostgreSQL** database
- A modern web browser (Chrome recommended for AR try-on)

### Installation

**1. Clone the project:**

```bash
git clone <repository-url>
cd optic-luxe
```

**2. Set up the database:**

```bash
cd server
cp .env.example .env    # edit with your PostgreSQL URL
npm install
npx prisma generate
npx prisma db push
npm run db:seed          # loads sample products, categories, and test accounts
```

**3. Start the backend:**

```bash
npm run dev              # runs on http://localhost:3001
```

**4. Start the frontend:**

```bash
cd ../client
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm install
npm run dev              # runs on http://localhost:3001
```

### Test Accounts

After seeding, you can log in with these accounts:

| Role    | Email                | Password     |
|---------|----------------------|--------------|
| Admin   | admin@opticluxe.com  | password123  |
| Staff   | staff@opticluxe.com  | password123  |
| Customer| customer@opticluxe.com| password123 |

---

## Shopping as a Customer

### Browsing Products

1. Visit **/home** to see the homepage with featured collections, new arrivals, and best sellers.
2. Click **Shop Now** or navigate to **/shop** to see the full catalog.
3. Use **filters** on the left sidebar to narrow results:
   - **Category** — Men, Women, Unisex, Kids
   - **Frame Shape** — Round, Square, Rectangle, Cat Eye, Aviator, Oval, Browline, Geometric, Butterfly, Wayfarer
   - **Material** — Acetate, Metal, Titanium, TR90, Wood, Combination
   - **Gender** — Men, Women, Unisex, Kids
   - **Price Range** — Min/Max price sliders
4. **Sort** results by: Newest First, Price Low to High, Price High to Low, Most Popular.
5. Toggle between **grid view** and **list view** using the icons near the top.

### Viewing a Product

1. Click any product card to open the **Product Detail** page.
2. Browse the **image gallery** — click thumbnails to switch images.
3. Select a **color variant** by clicking the color swatches.
4. Check available **sizes** if applicable.
5. Read the **Description** tab for details about frame shape, material, and features.
6. Check the **Reviews** tab to see ratings and comments from other customers.
7. The star rating and review count are shown near the product name.

### Virtual AR Try-On

1. On any product detail page, click the **Try On** button.
2. Allow **camera access** when prompted by your browser.
3. The page opens your webcam with the glasses overlaid on your face in real-time.
4. Move your head — the glasses track your face position and angle.
5. Use the **color selector** at the bottom to switch between available colors.
6. Click **Add to Cart** directly from the try-on view when you find the perfect pair.

> **Note:** AR try-on works best in Chrome on desktop. Good lighting improves face detection.

### Adding to Cart

1. Select your preferred **color variant** and **quantity**.
2. Click **Add to Cart**.
3. A confirmation appears — click **View Cart** or continue shopping.
4. Items in the cart retain their price even if the product price changes later.

### Shopping Cart

1. Go to **/cart** to review your items.
2. Adjust **quantities** with the +/- buttons.
3. **Remove** individual items with the trash icon.
4. The **order summary** shows subtotal and shipping cost.
5. Orders over **Rp 500,000** get **free standard shipping**.
6. Click **Proceed to Checkout** when ready.

### Checkout (3 Steps)

**Step 1 — Shipping:**
- Enter your delivery address: name, phone, full address, city, province, postal code.
- Choose a shipping method:
  - **Standard** — Free (3-5 business days)
  - **Express** — Rp 50,000 (1-2 business days)
- Add optional order notes.

**Step 2 — Payment:**
- Select a payment method:
  - **Bank Transfer** — Transfer to the provided bank account, upload proof
  - **E-Wallet** — GoPay, OVO, DANA, ShopeePay, or other supported wallets

**Step 3 — Review:**
- Confirm your shipping address, shipping method, and payment method.
- Review the order total.
- Click **Place Order** to complete.

After placing your order, you'll receive an order number (e.g., `ORD-260906-A1B2`). Upload your payment proof if you chose Bank Transfer.

### Tracking Your Order

1. Go to **Dashboard > My Orders** from the sidebar.
2. See all your orders with their current status.
3. Click an order to view full details including items, status history, and shipment info.

**Order status flow:**
```
Pending → Paid → Confirmed → Processing → Shipped → Completed
```

### Reviews

After receiving your order, you can leave a review:
1. Navigate to the product page.
2. Click **Write a Review** in the Reviews tab.
3. Select a star rating (1-5), write a title and comment.
4. Submit — reviews may require admin approval before appearing.

---

## Managing Your Account

### Profile

- Your name, email, and role are displayed in the sidebar.
- Click **Account** in the sidebar to manage your details.

### Addresses

1. Go to **Dashboard > Addresses**.
2. Add a new address with a label (Home, Office, Other).
3. Set one address as **default** — it will be pre-selected at checkout.
4. Edit or delete saved addresses anytime.

### Wishlist

1. Click the **heart icon** on any product to add it to your wishlist.
2. Go to **Dashboard > Wishlist** to see all saved items.
3. Click a wishlist item to view the product or remove it.

### Password

- Go to **Account** to change your password.
- Enter your current password and the new password.

---

## Staff Operations

Staff users handle day-to-day operations: order processing, payments, shipments, inventory, and walk-in sales.

### Dashboard Overview

After logging in as Staff, the dashboard shows:
- **Pending Orders** — Orders awaiting processing
- **Orders In Processing** — Currently being handled
- **Shipped Today** — Shipments dispatched today
- **Low Stock** — Products running low

### Processing Orders

1. Go to **Dashboard > Orders**.
2. Filter by status: All, Pending, Paid, Processing, Shipped, Completed, Cancelled.
3. Use the **search bar** to find orders by order number.
4. Click an order to open the **detail modal**.
5. Update the order status using the dropdown:
   - **Pending → Paid** — after payment is confirmed
   - **Paid → Processing** — start preparing the order
   - **Processing → Shipped** — after creating a shipment
6. Changes are saved immediately and reflected in the customer's dashboard.

### Verifying Payments

1. Go to **Dashboard > Payments**.
2. View pending payments with order details and payment proof (if uploaded).
3. Click **Verify** on a payment to confirm it.
4. Verifying a payment automatically:
   - Confirms the stock deduction
   - Generates an invoice
   - Updates the order status to Processing
5. Reject or flag suspicious payments for admin review.

### Creating Shipments

1. Go to **Dashboard > Shipments** or from the order detail modal.
2. Click **Create Shipment**.
3. Fill in:
   - **Courier** — JNE, J&T, SiCepat, AnterAja, POS, or Other
   - **Tracking Number** — from the courier
   - **Estimated Delivery** — expected delivery date
4. Update shipment status as it progresses:
   - Picked Up → In Transit → Out for Delivery → Delivered
5. Marking as **Delivered** automatically completes the order.

### Inventory Management

1. Go to **Dashboard > Warehouse**.
2. See a full overview of all product variants with stock levels.
3. **Low Stock Alerts** are highlighted — variants at or below minimum stock.
4. Click **Adjust Stock** on any variant to manually add or reduce stock.
5. Enter the quantity change, movement type (ADD, REDUCE, ADJUSTMENT), and notes.
6. All stock changes are logged in the **Movement History** section.

### Generating Invoices

1. After payment verification, an invoice is created automatically.
2. You can also manually generate an invoice from **Dashboard > Invoices**.
3. Invoices show: invoice number, order number, customer, amount, date, and status.

### Point of Sale (Walk-in Sales)

The POS system handles in-store transactions.

1. Go to **Dashboard > POS**.
2. **Search for products** by name or SKU in the search bar.
3. Click a product to add it to the cart.
4. Optionally enter **customer name** and **phone** for the record.
5. Apply a **discount** if needed.
6. Select a **payment method**: Cash, Bank Transfer, or E-Wallet.
7. Click **Complete Sale** to finish.
8. A **receipt** is generated that you can print or share.

**Cashier Dashboard** shows today's stats:
- Transaction count
- Total revenue
- Pending payments
- Recent sales list

---

## Admin Management

Admins have full access to every feature, plus exclusive management pages.

### Products

1. Go to **Dashboard > Products**.
2. View all products with images, prices, stock, and category.
3. **Search** by product name.
4. **Filter** by category using the dropdown.
5. **Create Product** — click the Add button to create a new product with:
   - Name, SKU, description, brand
   - Category assignment
   - Frame shape, material, gender, style
   - Base price and optional discount price
   - Product images (primary image + gallery)
   - Variants (color, size, stock level, min stock)
6. **Edit** — click the edit icon on any product row.
7. **Delete** — click the trash icon (soft delete — data is preserved).

### Categories

1. Go to **Dashboard > Categories**.
2. See all categories with the number of products in each.
3. Create, edit, or delete categories.
4. Categories support hierarchy (parent-child relationships).

### User Management

1. Go to **Dashboard > Users**.
2. View all users with their roles, status, and join date.
3. **Filter** by role: All, Admin, Staff, Customer.
4. **Search** by name or email.
5. **Create Staff Account** — click the Add button:
   - Enter name, email, password
   - Assign a position: Warehouse, Cashier, Supervisor, Delivery
6. **Edit User** — change role, activate/deactivate accounts.
7. **Delete User** — soft delete (user is deactivated, not permanently removed).

### Analytics

1. Go to **Dashboard > Analytics**.
2. View key metrics:
   - **Monthly Revenue** — total income this month
   - **Top 5 Products** — best-selling items by units sold
   - **Orders by Status** — breakdown across all statuses
   - **Average Order Value** — typical order amount
3. Data updates as orders are processed.

### Site Settings

1. Go to **Dashboard > Settings**.
2. Configure:
   - **Site Name** and **Tagline**
   - **Hero Section** — title, subtitle, background image
   - **About Text** — brand story
   - **Contact** — email and phone
   - **Social Links** — Instagram, Facebook, Twitter
3. Changes take effect on the public-facing site.

### Processing Refunds

1. From the Payments page, select an order with a paid status.
2. Click **Refund** to open the refund dialog.
3. Choose refund type:
   - **Full Refund** — refund the entire order amount
   - **Partial Refund** — refund specific items and quantities
4. Submit — stock is automatically restored for refunded items.
5. Refunds are logged for audit purposes.

---

## Technical Reference

### Project Structure

```
optic-luxe/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── (main)/        # Public pages (home, shop, cart, checkout)
│   │   │   ├── (auth)/        # Login, register
│   │   │   └── (dashboard)/   # Dashboard pages (all roles)
│   │   ├── components/
│   │   │   ├── ui/            # Reusable UI components (Button, Card, Modal, etc.)
│   │   │   └── tryon/         # AR try-on components (Three.js, MediaPipe)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # API client, auth provider, utilities
│   │   └── types/             # TypeScript type definitions
│   └── package.json
│
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── core/
│   │   │   ├── database/      # Prisma client singleton
│   │   │   ├── services/      # Business logic (cache, inventory, refund)
│   │   │   ├── types/         # Shared TypeScript types
│   │   │   └── utils/         # JWT, slug generation, response helpers
│   │   ├── middleware/         # Auth, role, validation, audit, error handler
│   │   ├── modules/           # Feature modules (one folder per domain)
│   │   │   ├── auth/          # Login, register, token refresh
│   │   │   ├── product/       # CRUD, filtering, search
│   │   │   ├── category/      # CRUD
│   │   │   ├── cart/          # Add, update, remove, clear
│   │   │   ├── order/         # Create, list, status updates
│   │   │   ├── payment/       # Submit, verify, webhooks
│   │   │   ├── shipment/      # Create, track, update status
│   │   │   ├── invoice/       # Generate, list
│   │   │   ├── review/        # Create, list with moderation
│   │   │   ├── wishlist/      # Toggle, list
│   │   │   ├── address/       # CRUD
│   │   │   ├── user/          # Admin user management
│   │   │   ├── dashboard/     # Stats, analytics
│   │   │   ├── warehouse/     # Inventory overview, stock adjustments
│   │   │   ├── pos/           # Point of Sale operations
│   │   │   └── refund/        # Online and POS refunds
│   │   ├── routes/            # Route definitions
│   │   └── index.ts           # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (22+ models)
│   │   └── seed.ts            # Sample data seeder
│   └── package.json
│
└── README.md
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 14 (App Router) |
| UI | TailwindCSS, Framer Motion, custom component library |
| 3D / AR | React Three Fiber, Three.js, face-api.js, MediaPipe |
| State Management | TanStack Query (React Query) |
| Backend Framework | Express.js |
| Database | PostgreSQL + Prisma ORM |
| Authentication | JWT (7-day expiry), bcrypt (12 rounds) |
| Language | TypeScript (full stack) |

### API Overview

All API endpoints are prefixed with `/api`. Protected endpoints require a `Bearer` token in the `Authorization` header.

| Endpoint Group | Base Path | Auth Required | Roles |
|---------------|-----------|---------------|-------|
| Auth | `/api/auth` | No (except `/me`, `/change-password`) | Public / All |
| Products | `/api/products` | Optional (GET), Yes (POST/PUT/DELETE) | Public / Admin |
| Categories | `/api/categories` | Optional (GET), Yes (POST/PUT/DELETE) | Public / Admin |
| Cart | `/api/cart` | Yes | Customer, Admin |
| Orders | `/api/orders` | Yes | All |
| Payments | `/api/payments` | Yes | All / Staff, Admin |
| Shipments | `/api/shipments` | Yes | Staff, Admin |
| Invoices | `/api/invoices` | Yes | All |
| Reviews | `/api/reviews` | Optional (GET), Yes (POST) | Public / Customer |
| Wishlist | `/api/wishlist` | Yes | All |
| Addresses | `/api/addresses` | Yes | All |
| Users | `/api/users` | Yes | Admin |
| Dashboard | `/api/dashboard` | Yes | All |
| Warehouse | `/api/warehouse` | Yes | Staff, Admin |
| POS | `/api/pos` | Yes | Staff, Admin |
| Refunds | `/api/refunds` | Yes | Admin (online) / Staff, Admin (POS) |

### Database Models (22+)

**User & Auth:** User, Staff

**Product Catalog:** Category, Product, ProductImage, ProductVariant, ProductVariantImage

**Shopping:** Cart, CartItem

**Orders & Payments:** Order, OrderItem, Payment, RefundItem

**Fulfillment:** Shipment, ShipmentHistory, Invoice

**Reviews & Social:** Review, ReviewImage, WishlistItem

**Address:** Address

**Operations:** InventoryMovement, SiteConfig, AuditLog

**Procurement:** Procurement, ProcurementItem

**POS:** OfflineSale, OfflineSaleItem

### Environment Variables

**Server** (`server/.env`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | `7d` | Token lifetime |
| `CLIENT_URL` | No | `http://localhost:3000` | Allowed CORS origins |
| `PORT` | No | `3000` | Server port |

**Client** (`client/.env.local`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001/api` | Backend API URL |

### Database Commands

```bash
cd server

npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma db push           # Push schema to database
npx prisma db seed           # Seed sample data
npx prisma studio            # Open Prisma Studio (visual DB browser)
npx prisma migrate dev       # Create a migration (production)
```

### Running Tests

```bash
cd server
npm test                     # Run all unit tests (vitest)
npm run test:watch           # Watch mode
```

**Test coverage includes:**
- JWT token generation and verification
- Response helpers (success, error, paginated)
- Slug and order/invoice number generation
- Auth middleware (valid, invalid, missing tokens)
- Role middleware (permission checks)

### Build & Deployment

**Backend:**
```bash
cd server
npm run build                # Compiles TypeScript to dist/
npm start                    # Runs compiled JS from dist/index.js
```

**Frontend:**
```bash
cd client
npm run build                # Next.js production build
npm start                    # Start production server
```

### Key Architecture Decisions

1. **Stock Reservation System** — Online orders reserve stock first. Stock is only deducted when payment is verified. If payment expires or is cancelled, stock is released.

2. **Optimistic Locking** — Product variants use a `version` field to prevent race conditions during concurrent stock updates.

3. **Soft Delete** — All entities use `isDeleted` flags. Data is never permanently removed, ensuring audit trails and referential integrity.

4. **Audit Logging** — Every create, update, and delete operation is logged with user, entity details, old/new values, IP address, and user agent.

5. **Cache Invalidation** — The cache service tags data by domain (products, orders, inventory, etc.) and invalidates affected caches on mutations.

6. **Role-Based Access** — Three roles (ADMIN, STAFF, CUSTOMER) with granular middleware on every endpoint. Staff positions (Warehouse, Cashier, Supervisor, Delivery) provide additional access control.

---

*This guide covers Optic Luxe v1.0. For issues or contributions, refer to the project repository.*
