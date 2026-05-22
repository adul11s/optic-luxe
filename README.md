# 👓 Optic Luxe — Premium Optical E-Commerce Platform

A production-ready full-stack optical e-commerce platform with role-based access control, clean architecture, and premium shopping experience.

## 🎯 Features

### Customer Experience
- Browse premium eyewear catalog with filtering (gender, shape, material, color, price)
- Product detail pages with image gallery, variants, and reviews
- Shopping cart with quantity management
- Checkout with shipping address and method selection
- Order tracking with shipment status
- Wishlist for saving favorites
- Saved addresses for faster checkout

### Staff Panel
- Order management (view, verify, update status)
- Payment verification with proof review
- Shipment creation and tracking
- Invoice generation
- Inventory/stock management

### Admin Panel
- Full system access
- Product & category management
- User/staff account management
- Analytics dashboard (revenue, top products, order stats)
- Site configuration

## 🏗️ Architecture

### Backend (Express.js + TypeScript + Prisma)
```
server/
├── src/
│   ├── core/           # Database, JWT utils, response helpers, slug generators
│   ├── middleware/     # Auth, RBAC, validation, error handling, audit logging
│   ├── modules/        # 13 feature modules (auth, product, cart, order, etc.)
│   └── index.ts        # Application entry point
├── prisma/
│   ├── schema.prisma   # 19 database models
│   └── seed.ts         # Database seeding with test data
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Backend Setup

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

The backend runs on `http://localhost:3000`

## 🔐 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@opticluxe.com | password123 |
| Staff | staff@opticluxe.com | password123 |
| Customer | customer@opticluxe.com | password123 |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` — User login
- `POST /api/auth/register` — Customer registration
- `GET /api/auth/me` — Get current user

### Products
- `GET /api/products` — Browse catalog with filters & pagination
- `GET /api/products/filters` — Get filter options
- `GET /api/products/:slug` — Product detail
- `POST /api/products` — Create product (Admin)
- `PUT /api/products/:id` — Update product (Admin)
- `DELETE /api/products/:id` — Soft delete (Admin)

### Categories
- `GET /api/categories` — List categories
- `POST /api/categories` — Create category (Admin)

### Cart
- `GET /api/cart` — View cart
- `POST /api/cart/items` — Add item
- `PUT /api/cart/items/:itemId` — Update quantity
- `DELETE /api/cart/items/:itemId` — Remove item

### Orders
- `POST /api/orders` — Place order
- `GET /api/orders` — List orders
- `GET /api/orders/stats` — Order stats (Staff/Admin)

### Payments
- `POST /api/payments` — Submit payment
- `PUT /api/payments/:id/verify` — Verify payment (Staff/Admin)

### Shipments
- `POST /api/shipments` — Create shipment (Staff/Admin)
- `GET /api/shipments/order/:orderId` — Track shipment

### Invoices
- `POST /api/invoices` — Generate invoice (Staff/Admin)

### Dashboard
- `GET /api/dashboard` — Role-based dashboard
- `GET /api/dashboard/analytics` — Analytics (Admin)

## 🔒 Security

- JWT authentication with role-based access control
- Password hashing with bcrypt (12 rounds)
- Input validation with Zod
- Passwords stripped from all API responses
- Soft delete for data retention
- Audit logging for all CUD operations

## 🎨 Seeded Data

12 products across 4 categories (Men, Women, Unisex, Kids) with:
- Multiple frame shapes (Aviator, Cat Eye, Round, Rectangle, etc.)
- Various materials (Acetate, Metal, Titanium, TR90)
- Color variants with stock tracking
- Sample reviews and customer data

## 📝 License

This project is for demonstration purposes.
