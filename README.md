# Optic Luxe — Premium Optical E-Commerce Platform

A full-stack optical e-commerce platform with virtual AR try-on, unified online/offline sales, real-time inventory management, and a complete order-to-delivery pipeline.

## Highlights

- **AR Virtual Try-On** — Webcam-based 3D glasses fitting using Three.js + MediaPipe
- **Point of Sale** — Walk-in sales with receipts, customer lookup, and stock sync
- **Unified Inventory** — Real-time stock across online and offline channels
- **Order Lifecycle** — From browse to delivery with automated invoice generation
- **Role-Based Access** — Admin, Staff (Warehouse/Cashier/Supervisor/Delivery), Customer
- **0 TypeScript Errors** — Full-stack TypeScript with strict mode

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, Framer Motion |
| 3D / AR | React Three Fiber, Three.js, face-api.js, MediaPipe Face Mesh |
| State | TanStack Query (React Query) |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL + Prisma ORM (27 models) |
| Auth | JWT (7-day expiry), bcrypt (12 rounds) |
| Testing | Vitest (36 tests passing) |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm

### 1. Database Setup

```bash
cd server
cp .env.example .env        # edit with your PostgreSQL URL
npx prisma generate
npx prisma db push
npm run db:seed              # loads 12 products, categories, test accounts
```

### 2. Backend

```bash
npm install
npm run dev                  # http://localhost:3001
```

### 3. Frontend

```bash
cd ../client
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm install
npm run dev                  # http://localhost:3001
```

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@opticluxe.com | password123 |
| Staff | staff@opticluxe.com | password123 |
| Customer | customer@opticluxe.com | password123 |

## Features by Role

### Customer
- Browse catalog with filters (gender, shape, material, price range, category)
- Product detail with image gallery, variant selection, and reviews
- **AR Virtual Try-On** — try glasses using your webcam
- Shopping cart with quantity management
- 3-step checkout (shipping → payment → review)
- Order tracking with shipment status
- Wishlist and saved addresses
- Account management

### Staff
- Order management with status updates
- Payment verification with automatic stock confirmation and invoice generation
- Shipment creation and tracking (JNE, J&T, SiCepat, AnterAja, POS)
- **Point of Sale** — walk-in sales with cart, discounts, receipts
- Warehouse dashboard with low stock alerts and stock adjustment
- Movement history audit trail

### Admin
- All Staff features plus:
- Product and category CRUD
- User and staff account management
- Analytics dashboard (revenue, top products, order stats)
- Site configuration (name, tagline, hero, contact, social links)
- Refund processing (full and partial)

## Project Structure

```
optic-luxe/
├── client/                        # Next.js 15 frontend
│   ├── src/app/
│   │   ├── (main)/                # Public: home, shop, cart, checkout, about
│   │   ├── (auth)/                # Login, register
│   │   └── (dashboard)/           # Dashboard pages (13 routes)
│   ├── src/components/ui/         # Reusable UI components
│   ├── src/components/tryon/      # AR try-on (Three.js + MediaPipe)
│   ├── src/lib/                   # API client, auth provider, utils
│   └── src/types/                 # TypeScript definitions
│
├── server/                        # Express.js backend
│   ├── src/modules/               # 16 feature modules
│   │   ├── auth/                  # Login, register, token refresh
│   │   ├── product/               # CRUD, filtering, search
│   │   ├── cart/                  # Add, update, remove, clear
│   │   ├── order/                 # Create, list, status updates
│   │   ├── payment/               # Submit, verify, webhooks
│   │   ├── shipment/              # Create, track, update
│   │   ├── invoice/               # Generate, list
│   │   ├── pos/                   # Walk-in sales, receipts
│   │   ├── warehouse/             # Inventory, stock adjustment, alerts
│   │   ├── refund/                # Online and POS refunds
│   │   ├── review/                # Create, list with moderation
│   │   ├── wishlist/              # Toggle, list
│   │   ├── address/               # CRUD
│   │   ├── user/                  # Admin user management
│   │   ├── category/              # CRUD
│   │   └── dashboard/             # Stats, analytics
│   ├── src/middleware/             # Auth, role, validation, audit, error handler
│   ├── src/core/                  # Database, utils, services
│   ├── src/__tests__/             # Unit tests (36 passing)
│   └── prisma/schema.prisma       # 27 database models
│
├── presentation.html              # Slide deck
├── USER_GUIDE.md                  # End-user guide
└── README.md                      # This file
```

## API Overview

All endpoints prefixed with `/api`. Protected endpoints require `Bearer` token.

| Group | Path | Access |
|-------|------|--------|
| Auth | `/api/auth` | Public / All |
| Products | `/api/products` | Public (GET) / Admin (CUD) |
| Categories | `/api/categories` | Public (GET) / Admin (CUD) |
| Cart | `/api/cart` | Customer, Admin |
| Orders | `/api/orders` | All |
| Payments | `/api/payments` | All (submit) / Staff, Admin (list, verify) |
| Shipments | `/api/shipments` | Staff, Admin |
| Invoices | `/api/invoices` | All |
| POS | `/api/pos` | Staff, Admin |
| Warehouse | `/api/warehouse` | Staff, Admin |
| Refunds | `/api/refunds` | Admin (online) / Staff, Admin (POS) |
| Reviews | `/api/reviews` | Public (GET) / Customer (POST) |
| Wishlist | `/api/wishlist` | All |
| Addresses | `/api/addresses` | All |
| Users | `/api/users` | Admin |
| Dashboard | `/api/dashboard` | All |

## Testing

```bash
cd server
npm test                     # Run all unit tests
npm run test:watch           # Watch mode
```

**Coverage:** JWT utils, response helpers, slug generation, auth middleware, role middleware.

## Order Lifecycle

```
Browse → Add to Cart → Checkout → Order Created (PENDING)
  → Stock Reserved → Payment Submitted → Payment Verified
  → Stock Confirmed → Invoice Generated → Order CONFIRMED
  → Processing → Shipped → Delivered → COMPLETED
```

- Stock is reserved at order creation, confirmed on payment verification
- Payment expiry auto-cancels and releases stock
- Refunds restore stock per item (full or partial)

## Database Models (27)

**User & Auth:** User, Staff

**Catalog:** Category, Product, ProductImage, ProductVariant, ProductVariantImage

**Shopping:** Cart, CartItem

**Orders:** Order, OrderItem, Payment, RefundItem

**Fulfillment:** Shipment, ShipmentHistory, Invoice

**Social:** Review, ReviewImage, WishlistItem

**Address:** Address

**Operations:** InventoryMovement, SiteConfig, AuditLog

**Procurement:** Procurement, ProcurementItem

**POS:** OfflineSale, OfflineSaleItem

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: 7d) |
| `CLIENT_URL` | No | CORS allowed origins |
| `PORT` | No | Server port (default: 3001) |

### Client (`client/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (default: http://localhost:3001/api) |

## License

Demonstration purposes.
