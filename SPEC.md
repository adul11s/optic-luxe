# Optic Luxe — Optical E-Commerce Platform — Technical Specification

## 1. Project Overview

**Project Name:** Optic Luxe
**Type:** Full-stack premium optical e-commerce platform
**Core Functionality:** Browse, search, and purchase premium eyewear (frames) with a complete backend for inventory, order management, payment verification, invoicing, shipment tracking, and role-based staff/admin panels.
**Target Users:** Customer, Staff (Warehouse/Cashier), Admin
**Design Inspiration:** Warby Parker, Saturdays — premium, minimal, fashion-forward UX

---

## 2. Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js with TypeScript
- **ORM:** Prisma
- **Database:** SQLite (dev) / PostgreSQL (prod-ready)
- **Authentication:** JWT (7-day expiry)
- **Password Hashing:** bcryptjs (12 rounds)
- **Validation:** Zod
- **Architecture:** Clean/modular — each module has controller + routes

### Frontend (planned)
- **Framework:** Next.js 14+ with TypeScript
- **Styling:** TailwindCSS
- **Animation:** Framer Motion
- **State Management:** React Context + TanStack Query
- **Routing:** Next.js App Router

---

## 3. Database Schema

### 3.1 Entity Relationship Summary

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

ProductVariant ─── CartItem
ProductVariant ─── OrderItem

Cart ─── CartItem

Order ─── OrderItem
Order ─── Payment (1:1)
Order ─── Shipment (1:1)
Order ─── Invoice (1:1)

Payment ─── Order
Shipment ─── Staff
Shipment ─── Order
Invoice ─── Order
```

### 3.2 All Entities

#### User
```
id, email (unique), password (hashed), name, role (CUSTOMER|STAFF|ADMIN),
phone?, avatar?, isActive, createdAt, updatedAt, isDeleted, deletedAt?, deletedBy?
```

#### Staff (linked to User)
```
id, userId (FK unique), position (WAREHOUSE|CASHIER|SUPERVISOR),
createdAt, updatedAt, isDeleted, deletedAt?, deletedBy?
```

#### Category
```
id, name (unique), slug (unique), description?, image?,
isActive, sortOrder, createdAt, updatedAt, isDeleted, deletedAt?, deletedBy?
```

#### Product
```
id, name, slug (unique), sku (unique), description, brand, categoryId (FK),
frameShape? (ROUND|SQUARE|RECTANGLE|CAT_EYE|AVIATOR|OVAL|BROWLINE|GEOMETRIC|BUTTERFLY|WAYFARER),
material? (ACETATE|METAL|TITANIUM|TR90|WOOD|COMBINATION),
gender? (MEN|WOMEN|UNISEX|KIDS),
style? (CLASSIC|MODERN|VINTAGE|MINIMAL|BOLD),
color?, basePrice, discountPrice?,
isActive, isFeatured, isNewArrival, isBestSeller,
createdAt, createdBy?, updatedAt, updatedBy?, isDeleted, deletedAt?, deletedBy?
```

#### ProductImage
```
id, productId (FK), url, alt?, sortOrder, isPrimary, createdAt, updatedAt, isDeleted
```

#### ProductVariant
```
id, productId (FK), sku (unique), colorName?, colorHex?, sizeLabel?,
stockQty, minStockQty, isActive, createdAt, updatedAt, isDeleted
```

#### Cart
```
id, userId (FK unique), createdAt, updatedAt
```

#### CartItem
```
id, cartId (FK), productId (FK), variantId? (FK), quantity, createdAt, updatedAt
```

#### Order
```
id, orderNumber (unique), userId (FK), addressId? (FK),
status (PENDING|CONFIRMED|PROCESSING|PACKED|SHIPPED|COMPLETED|CANCELLED),
subtotal, shippingCost, discountAmount, totalAmount,
shippingName?, shippingPhone?, shippingAddress?, shippingCity?, shippingProvince?, shippingPostal?,
shippingMethod? (STANDARD|EXPRESS), notes?,
createdAt, updatedAt, isDeleted, deletedAt?, deletedBy?
```

#### OrderItem
```
id, orderId (FK), productId (FK), variantId? (FK),
quantity, unitPrice, totalPrice, createdAt, updatedAt, isDeleted
```

#### Payment
```
id, orderId (FK unique), paymentMethod (BANK_TRANSFER|E_WALLET|CREDIT_CARD),
paymentStatus (PENDING|VERIFIED|FAILED|REFUNDED),
amount, transactionId?, paymentProof?, verifiedAt?, verifiedBy?,
createdAt, updatedAt, isDeleted
```

#### Shipment
```
id, orderId (FK unique), staffId? (FK), courier?, trackingNumber?,
status (PENDING|PICKED_UP|IN_TRANSIT|DELIVERED|RETURNED),
shippedAt?, deliveredAt?, createdAt, updatedAt, isDeleted
```

#### Invoice
```
id, orderId (FK unique), invoiceNumber (unique), issuedAt, dueDate?,
createdAt, updatedAt, isDeleted
```

#### Review
```
id, userId (FK), productId (FK), rating (1-5), comment?,
createdAt, updatedAt, isDeleted
```

#### WishlistItem
```
id, userId (FK), productId (FK), createdAt
@@unique([userId, productId])
```

#### Address
```
id, userId (FK), label (Home|Office|Other), name, phone,
address, city, province, postalCode, isDefault,
createdAt, updatedAt, isDeleted
```

#### SiteConfig
```
id, siteName, tagline?, heroTitle?, heroSubtitle?, heroImage?,
aboutText?, contactEmail?, contactPhone?, socialIg?, socialFb?, socialTw?,
updatedAt
```

#### AuditLog
```
id, userId? (FK), action, entityType, entityId?,
oldData?, newData?, ipAddress?, userAgent?, createdAt
```

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Roles

| Role | Description |
|------|-------------|
| CUSTOMER | Browse products, place orders, track shipments, manage account |
| STAFF | Manage orders, verify payments, process shipments, manage inventory |
| ADMIN | Full system access: manage users/staff, products, analytics, site config |

### 4.2 Permission Matrix

| Feature | CUSTOMER | STAFF | ADMIN |
|---------|----------|-------|-------|
| Browse products | ✅ | ✅ | ✅ |
| Product detail | ✅ | ✅ | ✅ |
| Shopping cart | ✅ (own) | ❌ | ✅ |
| Place orders | ✅ (own) | ❌ | ✅ |
| Track orders | ✅ (own) | ✅ (all) | ✅ (all) |
| Order status management | ❌ | ✅ | ✅ |
| Payment verification | ❌ | ✅ | ✅ |
| Shipment management | ❌ | ✅ | ✅ |
| Invoice management | ❌ | ✅ | ✅ |
| Inventory/stock management | ❌ | ✅ | ✅ |
| Product CRUD | ❌ | ❌ | ✅ |
| Category CRUD | ❌ | ❌ | ✅ |
| User/Staff management | ❌ | ❌ | ✅ |
| Analytics & reports | ❌ | ❌ | ✅ |
| Site configuration | ❌ | ❌ | ✅ |
| Reviews | ✅ (own) | ❌ | ✅ |
| Wishlist | ✅ (own) | ❌ | ✅ |
| Saved addresses | ✅ (own) | ❌ | ✅ |

---

## 5. Backend Architecture

### 5.1 Directory Structure

```
server/
├── src/
│   ├── core/
│   │   ├── database/
│   │   │   └── prisma.ts          # Prisma singleton
│   │   └── utils/
│   │       ├── response.ts        # API response helpers + sendPaginated
│   │       ├── jwt.ts             # JWT sign/verify
│   │       └── slug.ts            # Slug + order/invoice number generators
│   ├── middleware/
│   │   ├── auth.ts                # authMiddleware + optionalAuth
│   │   ├── role.ts                # roleMiddleware(...roles)
│   │   ├── validation.ts          # Zod validation middleware
│   │   └── errorHandler.ts        # Error handler + audit logging
│   ├── modules/
│   │   ├── auth/                  # login, register, me, change-password
│   │   ├── product/               # CRUD + filter/search + catalog browsing
│   │   ├── category/              # CRUD categories
│   │   ├── cart/                  # Add/remove/update/clear cart
│   │   ├── order/                 # Create order, list, detail, status, stats
│   │   ├── payment/               # Create, verify, list payments
│   │   ├── shipment/              # Create, update, track shipments
│   │   ├── invoice/               # Generate, list, view invoices
│   │   ├── user/                  # List users, create staff, update/delete
│   │   ├── review/                # Create + list product reviews
│   │   ├── wishlist/              # Get + toggle wishlist
│   │   ├── dashboard/             # Role-based dashboards + analytics
│   │   └── address/              # CRUD saved addresses
│   └── index.ts                   # Express app entry point
├── prisma/
│   ├── schema.prisma              # Database schema (all 19 models)
│   ├── seed.ts                    # Database seeder with test data
│   └── dev.db                     # SQLite dev database
└── package.json
```

### 5.2 Module Pattern

Each module follows a consistent pattern:
- `*.controller.ts` — Request handlers with business logic
- `*.routes.ts` — Express Router with middleware guards
- `*.dto.ts` — Zod validation schemas (where applicable)

---

## 6. API Endpoints

### 6.1 Auth (`/api/auth`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | /login | ❌ | — | User login, returns JWT |
| POST | /register | ❌ | — | Register as CUSTOMER |
| GET | /me | ✅ | All | Get current user profile |
| POST | /change-password | ✅ | All | Change password |

### 6.2 Products (`/api/products`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | Optional | — | List products with filtering, pagination, search |
| GET | /filters | ❌ | — | Get available filter options (genders, shapes, materials, colors) |
| GET | /:slug | Optional | — | Product detail with images, variants, reviews, related products |
| POST | / | ✅ | ADMIN | Create product with images + variants |
| PUT | /:id | ✅ | ADMIN | Update product |
| DELETE | /:id | ✅ | ADMIN | Soft-delete product |

### 6.3 Categories (`/api/categories`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | Optional | — | List active categories with product counts |
| POST | / | ✅ | ADMIN | Create category |
| PUT | /:id | ✅ | ADMIN | Update category |
| DELETE | /:id | ✅ | ADMIN | Soft-delete category |

### 6.4 Cart (`/api/cart`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | ✅ | CUSTOMER, ADMIN | Get cart with items + subtotal |
| POST | /items | ✅ | CUSTOMER, ADMIN | Add item to cart |
| PUT | /items/:itemId | ✅ | CUSTOMER, ADMIN | Update item quantity |
| DELETE | /items/:itemId | ✅ | CUSTOMER, ADMIN | Remove item from cart |
| DELETE | / | ✅ | CUSTOMER, ADMIN | Clear entire cart |

### 6.5 Orders (`/api/orders`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /stats | ✅ | ADMIN, STAFF | Order statistics |
| POST | / | ✅ | CUSTOMER, ADMIN | Create order from cart |
| GET | / | ✅ | All | List orders (filtered by user for CUSTOMER) |
| GET | /:id | ✅ | All | Order detail (own orders only for CUSTOMER) |
| PUT | /:id/status | ✅ | ADMIN, STAFF | Update order status |

### 6.6 Payments (`/api/payments`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | / | ✅ | CUSTOMER, ADMIN | Submit payment for order |
| GET | / | ✅ | ADMIN, STAFF | List all payments |
| PUT | /:id/verify | ✅ | ADMIN, STAFF | Verify payment + deduct stock |

### 6.7 Shipments (`/api/shipments`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | / | ✅ | ADMIN, STAFF | Create shipment record |
| PUT | /:id | ✅ | ADMIN, STAFF | Update shipment status/tracking |
| GET | /order/:orderId | ✅ | All | Get shipment by order ID |

### 6.8 Invoices (`/api/invoices`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | / | ✅ | ADMIN, STAFF | Generate invoice from order |
| GET | / | ✅ | All | List invoices (filtered by user for CUSTOMER) |
| GET | /:id | ✅ | All | View invoice detail |

### 6.9 Users (`/api/users`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | ✅ | ADMIN | List all users |
| POST | /staff | ✅ | ADMIN | Create staff account |
| PUT | /:id | ✅ | ADMIN | Update user (name, role, active status) |
| DELETE | /:id | ✅ | ADMIN | Soft-delete user |

### 6.10 Reviews (`/api/reviews`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | /product/:productId | Optional | — | Get reviews + average rating |
| POST | / | ✅ | CUSTOMER, ADMIN | Create product review (rating 1-5) |

### 6.11 Wishlist (`/api/wishlist`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | ✅ | All | Get user's wishlist |
| POST | /toggle | ✅ | All | Add/remove product from wishlist |

### 6.12 Dashboard (`/api/dashboard`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | ✅ | All | Role-specific dashboard stats + recent data |
| GET | /analytics | ✅ | ADMIN | Revenue, top products, orders by status |

### 6.13 Addresses (`/api/addresses`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | / | ✅ | All | List user's saved addresses |
| POST | / | ✅ | All | Create new address |
| PUT | /:id | ✅ | All | Update address |
| DELETE | /:id | ✅ | All | Soft-delete address |

---

## 7. Order Flow

```
1. Customer browses catalog → adds products to cart
2. Customer proceeds to checkout → inputs shipping details
3. Order created (PENDING) → cart cleared automatically
4. Customer submits payment proof (BANK_TRANSFER / E_WALLET)
5. Payment status → PENDING
6. Staff verifies payment → VERIFIED
7. Stock deducted automatically on verification
8. Order status → CONFIRMED → PROCESSING → PACKED
9. Staff creates shipment → SHIPPED
10. Shipment delivered → COMPLETED
```

**Stock management rule:** Prevent overselling by checking stock at checkout. Stock deducted only after payment verification (not at order creation).

**Cancellation:** If cancelled, stock is restored for variant-based items.

---

## 8. Payment System

| Method | Description |
|--------|-------------|
| BANK_TRANSFER | Customer uploads transfer proof → Staff verifies |
| E_WALLET | Digital wallet → Staff verifies transaction |
| CREDIT_CARD | Reserved for future payment gateway integration |

---

## 9. Security

- All passwords hashed with bcrypt (12 rounds)
- JWT authentication with 7-day expiry
- Role-based middleware on all protected routes
- Passwords stripped from all API responses
- Customers can only access own orders/addresses
- Audit logging for all CUD operations
- Zod input validation on all endpoints
- Soft delete pattern (no permanent data loss)

---

## 10. Dashboard Specifications

### Admin Dashboard
- Total orders, revenue, users, products
- Pending orders count
- Low stock alerts (variants below minStockQty)
- Recent orders list

### Staff Dashboard
- Pending orders count
- Pending payments count
- Pending shipments count
- Recent orders list

### Customer Dashboard
- Total orders count
- Active (non-completed) orders count
- Recent orders with shipment status

### Analytics (Admin only)
- Monthly revenue
- Top 5 best-selling products
- Orders breakdown by status

---

## 11. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@opticluxe.com | password123 |
| Staff | staff@opticluxe.com | password123 |
| Customer | customer@opticluxe.com | password123 |

---

## 12. Seeded Data

- 12 products across 4 categories (Men, Women, Unisex, Kids)
- Frame shapes: Aviator, Rectangle, Cat Eye, Round, Square, Oval, Browline, Geometric, Butterfly, Wayfarer
- Materials: Acetate, Metal, Titanium, TR90, Combination
- Each product has 1-3 color variants + 2 placeholder images
- Sample reviews from customer account
- Customer address (Jakarta)
- Site configuration (Optic Luxe branding)

---

## 13. Project Structure

```
clinic-management-system/          # Legacy repo name (git preserved)
├── SPEC.md                        # This file
├── README.md                      # Project readme
├── server/                        # Backend (Express + Prisma)
│   ├── src/
│   │   ├── core/                  # Database, utils (JWT, slug, response)
│   │   ├── middleware/            # Auth, role, validation, error handling
│   │   ├── modules/               # 13 feature modules
│   │   └── index.ts               # App entry point
│   ├── prisma/
│   │   ├── schema.prisma          # 19 models
│   │   ├── seed.ts                # Test data seeder
│   │   └── dev.db                 # SQLite database
│   └── package.json
└── client/                        # Frontend (to be built with Next.js)
    └── (Next.js + TailwindCSS + Framer Motion)
```

---

## 14. Running the Project

### Backend
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev           # http://localhost:3000
```

### Frontend (coming soon)
```bash
cd client
npm install
npm run dev           # http://localhost:5173 (Vite) or :3000 (Next.js)
```
