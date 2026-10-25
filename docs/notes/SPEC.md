# Optic Luxe — Technical Specification

## 1. Project Overview

| Field | Value |
|-------|-------|
| Name | Optic Luxe |
| Type | Full-stack premium optical e-commerce platform |
| Core Features | E-commerce, AR try-on, POS, warehouse, order lifecycle |
| Users | Customer, Staff (Warehouse/Cashier/Supervisor/Delivery), Admin |
| Currency | IDR (Indonesian Rupiah) |

---

## 2. Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT (7-day expiry), bcryptjs (12 rounds)
- **Validation:** Zod
- **Testing:** Vitest (36 tests)
- **Architecture:** Modular — 16 feature modules, each with controller + routes

### Frontend
- **Framework:** Next.js 15 (App Router), TypeScript
- **Styling:** TailwindCSS
- **Animation:** Framer Motion
- **State:** TanStack Query (React Query)
- **3D / AR:** React Three Fiber, Three.js, face-api.js, MediaPipe Face Mesh
- **UI:** Custom component library (Badge, Button, Card, Input, Modal, Table, etc.)

---

## 3. Database Schema (27 Models)

### 3.1 Entity Relationships

```
User ─── Staff
User ─── Address
User ─── Order
User ─── Review
User ─── WishlistItem
User ─── Cart
User ─── AuditLog

Category ─── Product
Product ─── ProductImage
Product ─── ProductVariant
Product ─── Review
Product ─── WishlistItem
Product ─── OrderItem
Product ─── CartItem
Product ─── ProcurementItem

ProductVariant ─── CartItem
ProductVariant ─── OrderItem
ProductVariant ─── InventoryMovement
ProductVariant ─── ProductVariantImage

Cart ─── CartItem

Order ─── OrderItem
Order ─── Payment (1:1)
Order ─── Shipment (1:1)
Order ─── Invoice (1:1)
Order ─── OfflineSale (POS)

Payment ─── RefundItem
Shipment ─── ShipmentHistory
Shipment ─── Staff

Review ─── ReviewImage

Procurement ─── ProcurementItem

OfflineSale ─── OfflineSaleItem
```

### 3.2 All Entities

#### User
```
id, email (unique), password (hashed), name,
role (CUSTOMER|STAFF|ADMIN),
phone?, avatar?, isActive,
createdAt, updatedAt, isDeleted, deletedAt?, deletedBy?
```

#### Staff
```
id, userId (FK unique),
position (WAREHOUSE|CASHIER|SUPERVISOR|DELIVERY),
createdAt, updatedAt, isDeleted, deletedAt?, deletedBy?
```

#### Category
```
id, name (unique), slug (unique), description?, image?,
parentId? (FK, self-referential hierarchy),
isActive, sortOrder,
createdAt, updatedAt, isDeleted, deletedAt?, deletedBy?
```

#### Product
```
id, name, slug (unique), sku (unique), description, brand,
categoryId (FK),
frameShape? (ROUND|SQUARE|RECTANGLE|CAT_EYE|AVIATOR|OVAL|BROWLINE|GEOMETRIC|BUTTERFLY|WAYFARER),
material? (ACETATE|METAL|TITANIUM|TR90|WOOD|COMBINATION),
gender? (MEN|WOMEN|UNISEX|KIDS),
style? (CLASSIC|MODERN|VINTAGE|MINIMAL|BOLD),
basePrice, discountPrice?,
isActive, isFeatured, isNewArrival, isBestSeller,
createdAt, createdBy?, updatedAt, updatedBy?,
isDeleted, deletedAt?, deletedBy?
```

#### ProductImage
```
id, productId (FK), url, alt?, sortOrder, isPrimary,
createdAt, updatedAt, isDeleted
```

#### ProductVariant
```
id, productId (FK), sku (unique),
colorName?, colorHex?, sizeLabel?,
stockQty, reservedQty, minStockQty, priceOffset,
version (optimistic locking),
isActive,
createdAt, updatedAt, isDeleted
```

#### ProductVariantImage
```
id, variantId (FK), url, alt?, sortOrder, isPrimary,
createdAt, updatedAt, isDeleted
```

#### Cart
```
id, userId (FK unique), expiresAt?,
createdAt, updatedAt
```

#### CartItem
```
id, cartId (FK), productId (FK), variantId? (FK),
quantity, unitPrice (price snapshot), savedForLater,
createdAt, updatedAt
```

#### Order
```
id, orderNumber (unique), userId (FK), addressId? (FK),
status (PENDING|PAID|PROCESSING|SHIPPED|COMPLETED|CANCELLED|REFUNDED),
saleChannel (ONLINE|OFFLINE),
subtotal, shippingCost, discountAmount, totalAmount,
shippingName?, shippingPhone?, shippingAddress?,
shippingCity?, shippingProvince?, shippingPostal?,
shippingMethod? (STANDARD|EXPRESS), notes?,
cancelledAt?, cancelledBy?, completedAt?,
createdAt, updatedAt, isDeleted, deletedAt?, deletedBy?
```

#### OrderItem
```
id, orderId (FK), productId (FK), variantId? (FK),
quantity, unitPrice, totalPrice,
createdAt, updatedAt, isDeleted
```

#### Payment
```
id, orderId (FK unique),
paymentMethod (BANK_TRANSFER|E_WALLET|CREDIT_CARD|QRIS|GOPAY|OVO|DANA|SHOPEEPAY|MIDTRANS|XENDIT),
paymentGateway (MIDTRANS|XENDIT|STRIPE|DUMMY),
paymentStatus (PENDING|PAID|VERIFIED|EXPIRED|FAILED|REFUNDED),
gatewayTransactionId?, gatewayResponse?,
amount, paymentProof?,
verifiedAt?, verifiedBy?,
refundAmount?, refundReason?, refundedAt?, refundedBy?,
expiresAt?,
createdAt, updatedAt, isDeleted
```

#### RefundItem
```
id, paymentId (FK), orderItemId (FK),
quantity, unitPrice, totalRefund,
createdAt
```

#### Shipment
```
id, orderId (FK unique), staffId? (FK),
courier (JNE|J&T|SiCepat|AnterAja|POS|OTHER),
trackingNumber?, estimatedDelivery?,
status (PENDING|PICKED_UP|IN_TRANSIT|OUT_FOR_DELIVERY|DELIVERED|RETURNED|CANCELLED),
shippedAt?, deliveredAt?,
createdAt, updatedAt, isDeleted
```

#### ShipmentHistory
```
id, shipmentId (FK),
status, notes?, location?,
createdAt
```

#### Invoice
```
id, orderId (FK unique), invoiceNumber (unique),
issuedAt, dueDate?, paidAt?,
totalAmount,
status (ISSUED|PAID|OVERDUE|VOID|REFUNDED),
createdAt, updatedAt, isDeleted
```

#### Review
```
id, userId (FK), productId (FK), orderId? (FK),
rating (1-5), title?, comment?,
isVerified, isApproved,
createdAt, updatedAt, isDeleted
```

#### ReviewImage
```
id, reviewId (FK), url, alt?,
createdAt, isDeleted
```

#### WishlistItem
```
id, userId (FK), productId (FK), addedAt
@@unique([userId, productId])
```

#### Address
```
id, userId (FK),
label (Home|Office|Other),
name, phone, address, city, province, postalCode,
isDefault,
createdAt, updatedAt, isDeleted
```

#### SiteConfig
```
id, siteName, tagline?,
heroTitle?, heroSubtitle?, heroImage?,
aboutText?,
contactEmail?, contactPhone?,
socialIg?, socialFb?, socialTw?,
updatedAt
```

#### AuditLog
```
id, userId? (FK), action, entityType, entityId?,
oldData?, newData?,
ipAddress?, userAgent?,
createdAt
```

#### InventoryMovement
```
id, variantId (FK),
type (ADD|REDUCE|SOLD_ONLINE|SOLD_OFFLINE|ADJUSTMENT|PROCUREMENT|RETURN|TRANSFER_IN|TRANSFER_OUT),
quantity, balanceAfter,
reference?, performedBy?, notes?,
createdAt
```

#### Procurement
```
id, poNumber (unique), supplier,
status (DRAFT|ORDERED|PARTIAL|RECEIVED|CANCELLED),
totalAmount,
orderedAt?, receivedAt?,
createdAt, updatedAt, isDeleted
```

#### ProcurementItem
```
id, procurementId (FK), productId (FK), variantId (FK),
quantity, receivedQty, unitPrice,
createdAt, updatedAt
```

#### OfflineSale
```
id, saleNumber (unique), cashierId (FK),
saleChannel (WALK_IN|PHONE_ORDER|WHATSAPP|INSTAGRAM|MARKETPLACE),
customerName?, customerPhone?,
subtotal, discountAmount, totalAmount,
paymentMethod (CASH|BANK_TRANSFER|E_WALLET|QRIS),
paymentStatus (PENDING|PAID|REFUNDED),
notes?,
createdAt, isDeleted
```

#### OfflineSaleItem
```
id, saleId (FK), productId (FK), variantId (FK),
quantity, unitPrice, totalPrice,
refundQty,
createdAt
```

---

## 4. Role-Based Access Control

### 4.1 Roles

| Role | Description |
|------|-------------|
| CUSTOMER | Browse, purchase, track orders, manage account |
| STAFF | Process orders, verify payments, manage inventory, POS |
| ADMIN | Full access: users, products, analytics, settings, refunds |

### 4.2 Staff Positions

| Position | Access |
|----------|--------|
| WAREHOUSE | Inventory, stock adjustments, procurement |
| CASHIER | POS, walk-in sales |
| SUPERVISOR | All staff operations + oversight |
| DELIVERY | Shipment handling |

### 4.3 Permission Matrix

| Feature | CUSTOMER | STAFF | ADMIN |
|---------|----------|-------|-------|
| Browse products | ✅ | ✅ | ✅ |
| Product detail + AR try-on | ✅ | ✅ | ✅ |
| Shopping cart | ✅ (own) | ❌ | ✅ |
| Place orders | ✅ (own) | ❌ | ✅ |
| Track orders | ✅ (own) | ✅ (all) | ✅ (all) |
| Update order status | ❌ | ✅ | ✅ |
| Payment verification | ❌ | ✅ | ✅ |
| Shipment management | ❌ | ✅ | ✅ |
| Invoice management | ❌ | ✅ | ✅ |
| POS (walk-in sales) | ❌ | ✅ | ✅ |
| Warehouse / inventory | ❌ | ✅ | ✅ |
| Product CRUD | ❌ | ❌ | ✅ |
| Category CRUD | ❌ | ❌ | ✅ |
| User / staff management | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ✅ |
| Site configuration | ❌ | ❌ | ✅ |
| Refunds (online) | ❌ | ❌ | ✅ |
| Refunds (POS) | ❌ | ✅ | ✅ |
| Reviews | ✅ (own) | ❌ | ✅ |
| Wishlist | ✅ (own) | ❌ | ✅ |
| Addresses | ✅ (own) | ❌ | ✅ |

---

## 5. Backend Architecture

### 5.1 Directory Structure

```
server/
├── src/
│   ├── core/
│   │   ├── database/
│   │   │   └── prisma.ts              # Prisma singleton
│   │   ├── services/
│   │   │   ├── cache.service.ts       # Tagged cache with TTL
│   │   │   ├── inventory.service.ts   # Stock reservation & confirmation
│   │   │   └── refund.service.ts      # Online & POS refund logic
│   │   ├── types/
│   │   │   └── index.ts              # Shared TypeScript types
│   │   └── utils/
│   │       ├── response.ts           # sendSuccess, sendError, sendPaginated
│   │       ├── jwt.ts                # generateToken, verifyToken
│   │       └── slug.ts              # generateSlug, order/invoice numbers
│   ├── middleware/
│   │   ├── auth.ts                   # authMiddleware + optionalAuth
│   │   ├── role.ts                   # roleMiddleware(...roles)
│   │   ├── validation.ts             # Zod validation middleware
│   │   ├── audit.ts                  # Audit logging middleware
│   │   └── errorHandler.ts           # Global error handler
│   ├── modules/                      # 16 feature modules
│   │   ├── auth/                     # login, register, me, change-password
│   │   ├── product/                  # CRUD + filter/search + catalog
│   │   ├── category/                 # CRUD categories
│   │   ├── cart/                     # Add/remove/update/clear cart
│   │   ├── order/                    # Create, list, detail, status, stats
│   │   ├── payment/                  # Submit, verify, webhooks
│   │   ├── shipment/                 # Create, update, track
│   │   ├── invoice/                  # Generate, list, view
│   │   ├── pos/                      # Walk-in sales, receipts, lookup
│   │   ├── warehouse/                # Inventory, stock adjustment, alerts
│   │   ├── refund/                   # Online & POS refund processing
│   │   ├── review/                   # Create + list product reviews
│   │   ├── wishlist/                 # Toggle + list
│   │   ├── address/                  # CRUD saved addresses
│   │   ├── user/                     # List, create staff, update, delete
│   │   └── dashboard/                # Stats, analytics, sidebar badges
│   ├── __tests__/                    # Unit tests (36 passing)
│   └── index.ts                      # Express app entry point
├── prisma/
│   ├── schema.prisma                 # 27 models
│   ├── seed.ts                       # Database seeder
│   └── dev.db                        # SQLite dev database
└── package.json
```

### 5.2 Module Pattern

Each module follows:
- `*.controller.ts` — Request handlers with business logic
- `*.routes.ts` — Express Router with middleware guards
- `*.dto.ts` — Zod validation schemas (where applicable)

---

## 6. API Endpoints

All endpoints prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

### 6.1 Auth (`/api/auth`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | /login | No | Public | User login, returns JWT |
| POST | /register | No | Public | Register as CUSTOMER |
| GET | /me | Yes | All | Get current user profile |
| POST | /change-password | Yes | All | Change password |

### 6.2 Products (`/api/products`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | Optional | Public | List with filtering, pagination, search |
| GET | /filters | No | Public | Get filter options |
| GET | /:slug | Optional | Public | Product detail with images, variants, reviews |
| GET | /:id/tryon-assets | No | Public | Get 3D AR try-on assets |
| POST | / | Yes | Admin | Create product |
| PUT | /:id | Yes | Admin | Update product |
| DELETE | /:id | Yes | Admin | Soft-delete product |

### 6.3 Categories (`/api/categories`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | Optional | Public | List with product counts |
| POST | / | Yes | Admin | Create |
| PUT | /:id | Yes | Admin | Update |
| DELETE | /:id | Yes | Admin | Soft-delete |

### 6.4 Cart (`/api/cart`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | Yes | Customer, Admin | Get cart with items + subtotal |
| POST | /items | Yes | Customer, Admin | Add item |
| PUT | /items/:itemId | Yes | Customer, Admin | Update quantity |
| DELETE | /items/:itemId | Yes | Customer, Admin | Remove item |
| DELETE | / | Yes | Customer, Admin | Clear cart |

### 6.5 Orders (`/api/orders`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /stats | Yes | Admin, Staff | Order statistics |
| POST | / | Yes | Customer, Admin | Create order from cart |
| GET | / | Yes | All | List (filtered by user for Customer) |
| GET | /:id | Yes | All | Detail (own only for Customer) |
| PUT | /:id/status | Yes | Admin, Staff | Update status |

### 6.6 Payments (`/api/payments`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | / | Yes | Customer, Admin | Submit payment |
| GET | / | Yes | Admin, Staff | List all |
| PUT | /:id/verify | Yes | Admin, Staff | Verify + confirm stock + auto-invoice |

### 6.7 Shipments (`/api/shipments`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | / | Yes | Admin, Staff | Create |
| PUT | /:id | Yes | Admin, Staff | Update status/tracking |
| GET | /order/:orderId | Yes | All | Get by order |

### 6.8 Invoices (`/api/invoices`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | / | Yes | Admin, Staff | Generate |
| GET | / | Yes | All | List |
| GET | /:id | Yes | All | View |

### 6.9 Users (`/api/users`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | Yes | Admin | List all |
| POST | /staff | Yes | Admin | Create staff account |
| PUT | /:id | Yes | Admin | Update |
| DELETE | /:id | Yes | Admin | Soft-delete |

### 6.10 Reviews (`/api/reviews`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /product/:productId | Optional | Public | Reviews + average rating |
| POST | / | Yes | Customer, Admin | Create (rating 1-5) |

### 6.11 Wishlist (`/api/wishlist`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | Yes | All | Get wishlist |
| POST | /toggle | Yes | All | Toggle add/remove |

### 6.12 Dashboard (`/api/dashboard`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | Yes | All | Role-specific stats |
| GET | /sidebar-stats | Yes | All | Sidebar badge counts |
| GET | /analytics | Yes | Admin | Revenue, top products, order stats |
| GET | /sales-analytics | Yes | Admin | Sales analytics |

### 6.13 Addresses (`/api/addresses`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | Yes | All | List |
| POST | / | Yes | All | Create |
| PUT | /:id | Yes | All | Update |
| DELETE | /:id | Yes | All | Soft-delete |

### 6.14 Warehouse (`/api/warehouse`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /inventory | Yes | Staff, Admin | Full inventory overview |
| GET | /alerts | Yes | Staff, Admin | Low stock alerts |
| POST | /stock/adjust | Yes | Staff, Admin | Manual stock adjustment |
| GET | /movements | Yes | Staff, Admin | Movement history |

### 6.15 POS (`/api/pos`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | /sale | Yes | Staff, Admin | Create walk-in sale |
| GET | /sales | Yes | Staff, Admin | List offline sales |
| GET | /dashboard | Yes | Staff, Admin | Cashier dashboard stats |
| POST | /invoice/generate | Yes | Staff, Admin | Generate POS invoice |
| GET | /customer | Yes | Staff, Admin | Customer lookup |

### 6.16 Refunds (`/api/refunds`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | / | Yes | Admin | Process online refund |
| GET | / | Yes | Admin | List all |
| GET | /:paymentId | Yes | Admin, Staff | Get by payment |
| POST | /pos | Yes | Admin, Staff | Process POS refund |

---

## 7. Key Systems

### 7.1 Order Lifecycle

```
1. Customer browses → adds to cart
2. Checkout → shipping address + method
3. Order created (PENDING) → stock RESERVED → cart cleared
4. Payment submitted (BANK_TRANSFER / E_WALLET)
5. Staff verifies → stock CONFIRMED → invoice auto-generated
6. Order CONFIRMED → PROCESSING → SHIPPED → COMPLETED

On expiry: stock released, order CANCELLED
On cancel: stock restored
On refund: stock restored per item
```

### 7.2 Stock Management

- **Reservation:** Online orders reserve stock at order creation
- **Confirmation:** Stock deducted on payment verification
- **Release:** On expiry/cancellation, reserved stock returned
- **Optimistic Locking:** Version field on ProductVariant prevents race conditions
- **Audit Trail:** All movements logged to InventoryMovement

### 7.3 Payment Methods

| Method | Available In |
|--------|-------------|
| BANK_TRANSFER | Online, POS |
| E_WALLET | Online, POS |
| CASH | POS only |
| CREDIT_CARD | Reserved |
| QRIS, GOPAY, OVO, DANA, SHOPEEPAY | Schema only |

### 7.4 Shipping

| Method | Delivery Time | Cost |
|--------|--------------|------|
| Standard | 3-5 business days | Free |
| Express | 1-2 business days | Rp 50,000 |

**Couriers:** JNE, J&T, SiCepat, AnterAja, POS, Other

### 7.5 Refunds

- **Online (Admin only):** Full or partial, per-item quantity tracking
- **POS (Staff + Admin):** Per-item partial, cannot exceed remaining refundable
- Both restore stock automatically

### 7.6 POS System

- Product search by name or SKU
- Walk-in cart with stock validation
- Customer info (optional)
- Payment: Cash, Bank Transfer, E-Wallet
- Manual discount support
- Receipt generation
- Sale channels: WALK_IN, PHONE_ORDER, WHATSAPP, INSTAGRAM, MARKETPLACE

### 7.7 AR Try-On

- Camera access (Webcam)
- face-api.js: Tiny Face Detector + 68-point landmarks
- MediaPipe: 478-point face mesh (alternative)
- 3D glasses via Three.js / React Three Fiber (.glb models)
- Real-time positioning, rotation, scaling
- Color variant switching
- API: `GET /api/products/:id/tryon-assets`

---

## 8. Security

- JWT authentication with 7-day expiry
- Role-based middleware on all protected routes
- Password hashing with bcrypt (12 rounds)
- Passwords stripped from all API responses
- Customers can only access own data
- Zod input validation on all endpoints
- Audit logging for all CUD operations
- Soft delete (no permanent data loss)
- Optimistic locking on stock updates
- Stock reservation prevents overselling
- Payment expiry with automatic stock release
- Idempotent webhook handling
- CORS configuration with allowed origins

---

## 9. Frontend Pages

### Public Routes (`(main)`)
| Route | Description |
|-------|-------------|
| `/home` | Hero, featured collections, new arrivals, best sellers |
| `/shop` | Full catalog with filters, sorting, grid/list view |
| `/collections` | Browse by category |
| `/product/[slug]` | Detail, gallery, variants, reviews, AR try-on |
| `/cart` | Cart items, quantity, order summary |
| `/checkout` | 3-step: Shipping → Payment → Review |
| `/about` | Brand story |

### Auth Routes (`(auth)`)
| Route | Description |
|-------|-------------|
| `/login` | Email/password login |
| `/register` | Name/email/password registration |

### Dashboard Routes (`(dashboard)`)
| Route | Access | Description |
|-------|--------|-------------|
| `/dashboard` | All | Role-specific overview |
| `/dashboard/orders` | All | Order list with status filters |
| `/dashboard/payments` | Staff, Admin | Payment list |
| `/dashboard/shipments` | Staff, Admin | Shipment list |
| `/dashboard/invoices` | Staff, Admin | Invoice list |
| `/dashboard/inventory` | Staff, Admin | Stock levels |
| `/dashboard/warehouse` | Staff, Admin | Alerts, adjustment, history |
| `/dashboard/pos` | Staff, Admin | Walk-in sales terminal |
| `/dashboard/products` | Admin | Product CRUD |
| `/dashboard/categories` | Admin | Category list |
| `/dashboard/users` | Admin | User management |
| `/dashboard/analytics` | Admin | Revenue, top products, stats |
| `/dashboard/settings` | Admin | Site configuration |

---

## 10. Environment Variables

### Server (`server/.env`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | `7d` | Token lifetime |
| `CLIENT_URL` | No | `http://localhost:3000` | CORS origins |
| `PORT` | No | `3001` | Server port |

### Client (`client/.env.local`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001/api` | Backend API URL |

---

## 11. Testing

```bash
cd server
npm test                 # vitest run
npm run test:watch       # vitest watch
```

**Test modules:** JWT utils, response helpers, slug generation, auth middleware, role middleware.

---

## 12. Seeded Data

- 4 categories: Men, Women, Unisex, Kids (hierarchical)
- 12 products with frame shapes: Aviator, Rectangle, Cat Eye, Round, Square, Oval, Browline, Geometric, Butterfly, Wayfarer
- Materials: Acetate, Metal, Titanium, TR90, Combination
- Each product has 1-3 color variants with stock tracking
- Sample reviews, customer address (Jakarta)
- Site configuration (Optic Luxe branding)
- 3 test accounts (Admin, Staff, Customer)
