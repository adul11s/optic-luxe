Thought: Now I have a comprehensive view of the routes and RBAC. Let me write a clear journey document for each role.
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                    OPTIC LUXE — ROLE JOURNEY MATRIX                                  ║
║              WHO CAN DO WHAT → FEATURES → BOUNDARIES                                 ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 👑 ADMIN                                                                            │
│ admin@opticluxe.com / password123                                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘
✅ CAN DO
───────────────────────────
📋 CATALOG MANAGEMENT
  • Create / Edit / Delete products (name, price, images, variants, stock)
  • Create / Edit / Delete categories (including subcategories w/ parentId)
  • Activate / deactivate products & categories
  • Set isFeatured, isBestSeller, isNewArrival flags
  • Manage product variants: color, size, SKU, price offset, stock, isActive
  • View & manage all product images + variant images
👥 USER MANAGEMENT
  • Create staff accounts (Admin only)
  • View all users (list with pagination)
  • Edit any user (name, email, phone, role, isActive)
  • Soft-delete any user (isDeleted, deletedAt)
  • Cannot reset another admin's password (security boundary)
📦 ORDER MANAGEMENT
  • View all orders (any customer, any status)
  • View order stats / analytics
  • Update order status (PENDING → PROCESSING → SHIPPED → COMPLETED)
  • Cancel orders with reason
  • View any order detail (items, payment, shipment, invoice)
💳 PAYMENT MANAGEMENT
  • View all payments across all orders
  • Verify / approve manual payments (bank transfer)
  • Mark payment as failed / refund
🚚 SHIPMENT MANAGEMENT
  • Create shipments for orders
  • Assign courier + tracking number + estimated delivery
  • Update shipment status
  • View shipment history
🧾 INVOICE MANAGEMENT
  • Generate invoice (ONLY after payment verified)
  • View all invoices
  • Void / mark overdue invoices
📊 ANALYTICS & REPORTING
  • Full dashboard access
  • Revenue analytics
  • Sales analytics
  • View warehouse alerts & inventory overview
🏭 WAREHOUSE
  • View full inventory (all variants, stock levels)
  • View stock alerts (low stock, out of stock)
  • Stock adjustment (add / reduce with reason)
  • View inventory movement history
  • Procurement: create PO, mark received, partial delivery tracking
🏪 POS (Point of Sale)
  • Process walk-in sales
  • View POS dashboard
  • Process refunds
  • Generate POS invoices
⭐ REVIEWS
  • Approve / reject reviews (isApproved)
  • View all product reviews
  • Cannot hide reviews indefinitely — can only set isApproved=false
🔐 SECURITY
  • Full write access to SiteConfig (hero, about, contact, social links)
  • View audit logs (all actions by all users)
  • Cannot delete audit logs
❌ CANNOT DO
───────────────────────────
  • Change own role (prevent privilege escalation)
  • View other admins' raw password hashes
  • Delete audit logs
  • Generate invoice BEFORE payment is verified
  • Access medical module routes (separate concern)
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 👷 STAFF                                                                            │
│ staff@opticluxe.com / password123                                                   │
│ Position: WAREHOUSE | CASHIER | SUPERVISOR | DELIVERY                               │
└─────────────────────────────────────────────────────────────────────────────────────┘
✅ CAN DO (Limited to Assigned Position)
───────────────────────────
WAREHOUSE STAFF
  📦 INVENTORY
    • View inventory (all variants)
    • View low stock / out of stock alerts
    • Stock adjustment (ADD / REDUCE / ADJUSTMENT)
    • View inventory movement history per variant
    • Cannot: Create/delete products, categories, or users
  🚚 SHIPMENTS
    • Update shipment status (mark as picked up, in transit, delivered)
    • Add shipment history entries
    • Cannot: Create new shipments (admin only)
    • Cannot: Delete or void shipments
CASHIER STAFF
  💳 PAYMENTS
    • View pending payments assigned to them
    • Cannot: Verify payments (admin only)
  🏪 POS
    • Process walk-in sales (WALK_IN channel)
    • Apply discounts
    • Issue POS invoice
    • View own sales history
    • Cannot: Process refunds for other cashiers' sales
    • Cannot: Void invoices
SUPERVISOR STAFF
  📦 INVENTORY + SHIPMENTS + POS (combined read/write of above)
  📋 ORDERS
    • View all orders
    • Update order status (PENDING → PROCESSING → etc.)
    • Cannot: Cancel orders (admin only)
  💳 PAYMENTS
    • View all payments
    • Cannot: Verify payments
❌ CANNOT DO (Universal for all Staff)
───────────────────────────
  • Create / edit / delete products or categories
  • Create / delete staff accounts
  • View other staff members' profiles
  • Change order total amounts (discount enforcement)
  • Delete users
  • Access analytics / sales analytics (ADMIN only)
  • Generate invoices (ADMIN only)
  • Access SiteConfig
  • View audit logs
  • Verify payments
  • Access medical module routes
  • Role escalation: cannot assign ADMIN role
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 🛒 CUSTOMER                                                                         │
│ customer@opticluxe.com / password123                                                │
└─────────────────────────────────────────────────────────────────────────────────────┘
✅ CAN DO
───────────────────────────
  🛍️ SHOPPING
    • Browse products (public catalog, filters, search)
    • View product details, images, variants, reviews
    • Add to cart (own cart only)
    • Save items for later
    • Update cart item quantity
    • Remove items from cart
    • Checkout (create order from cart)
    • Cart expires after 7 days (server-enforced)
  📦 MY ORDERS
    • View own order history
    • View own order details (items, status, payment, shipment)
    • Cannot: View other customers' orders
  💳 PAYMENTS
    • Initiate payment for own orders
    • Choose payment method (BANK_TRANSFER, E_WALLET, QRIS, etc.)
    • View own payment status
    • Cannot: Verify or reject payments
    • Cannot: Change payment amount
  ⭐ REVIEWS
    • Write reviews for products (one per product per user)
    • Reviews default to isApproved=true (no moderation gate for customers)
    • Can include rating (1-5), title, comment
    • Edit own review
    • Cannot: Delete own review (soft delete handled by admin)
  ❤️ WISHLIST
    • Add / remove products to wishlist
    • View own wishlist
    • Cannot: View other users' wishlists
  📍 ADDRESSES
    • Manage own addresses (CRUD)
    • Set default address
    • Cannot: View other users' addresses
  🔐 ACCOUNT
    • Change own password
    • Update own profile (name, phone, email)
    • View own account data
    • Cannot: Change own role
    • Cannot: Access admin panel or staff features
❌ CANNOT DO
───────────────────────────
  • Browse /dashboard/* routes (layout redirects to login)
  • View all products in admin panel
  • Create/edit/delete products, categories, users
  • View analytics or revenue data
  • Process orders or shipments
  • Access warehouse, POS, or procurement modules
  • Verify or manage payments
  • View audit logs
  • Access medical module routes
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 🚫 GUEST (Unauthenticated Visitor)                                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
✅ CAN DO
───────────────────────────
  • Browse public product catalog (no auth required)
  • Filter products by category, price, gender, shape, material
  • View product details
  • View public reviews
  • Register for account
  • Login
❌ CANNOT DO
───────────────────────────
  • Add to cart
  • Checkout
  • View orders
  • Make payments
  • Write reviews
  • Access wishlist
  • Access dashboard
  • View any /api/* route that requires auth
═══════════════════════════════════════════════════════════════════════════════════════
                        ROUTE ACCESS SUMMARY TABLE
═══════════════════════════════════════════════════════════════════════════════════════
MODULE           ROUTE                         GUEST   CUSTOMER   STAFF   ADMIN
────────────────────────────────────────────── ────── ────────── ────── ──────
AUTH
  POST /login                                  ✓        ✓        ✓       ✓
  POST /register                               ✓        ✓        ✓       ✓
  GET  /me                                     ✓        ✓        ✓       ✓
  POST /change-password                                    ✓        ✓       ✓
PRODUCTS
  GET  /                                      ✓        ✓        ✓       ✓
  GET  /filters                               ✓        ✓        ✓       ✓
  GET  /:slug                                 ✓        ✓        ✓       ✓
  POST /                                                ✗        ✗       ✓
  PUT  /:id                                            ✗        ✗       ✓
  DELETE /:id                                         ✗        ✗       ✓
CATEGORIES
  GET  /                                      ✓        ✓        ✓       ✓
  POST /                                               ✗        ✗       ✓
  PUT  /:id                                            ✗        ✗       ✓
  DELETE /:id                                         ✗        ✗       ✓
CART
  GET  /                                               ✓        ✗       ✓
  POST /items                                         ✓        ✗       ✓
  PUT  /items/:itemId                                 ✓        ✗       ✓
  DELETE /items/:itemId                               ✓        ✗       ✓
  DELETE /                                            ✓        ✗       ✓
ORDERS
  GET  /stats                                         ✗        ✓       ✓
  POST /                                              ✓        ✗       ✓
  GET  /                                              ✓        ✓       ✓ ¹
  GET  /:id                                           ✓        ✓       ✓ ¹
  PUT  /:id/status                                    ✗        ✓       ✓
PAYMENTS
  POST /                                              ✓        ✗       ✓
  GET  /                                              ✗        ✗       ✓
  PUT  /:id/verify                                    ✗        ✗       ✓
SHIPMENTS
  POST /                                              ✗        ✗       ✓
  PUT  /:id                                           ✗        ✓       ✓
  GET  /order/:orderId                                ✓        ✓       ✓ ¹
INVOICES
  POST /                                              ✗        ✗       ✓
  GET  /                                              ✓        ✓       ✓ ¹
  GET  /:id                                           ✓        ✓       ✓ ¹
USERS
  GET  /                                              ✗        ✗       ✓
  POST /staff                                          ✗        ✗       ✓
  PUT  /:id                                           ✗        ✗       ✓
  DELETE /:id                                          ✗        ✗       ✓
REVIEWS
  GET  /product/:productId                           ✓        ✓        ✓       ✓
  POST /                                              ✓        ✓        ✗       ✓
WISHLIST
  GET  /                                              ✗        ✓        ✓       ✓
  POST /toggle                                        ✗        ✓        ✓       ✓
DASHBOARD
  GET  /                                              ✗        ✓        ✓       ✓
  GET  /analytics                                     ✗        ✗        ✗       ✓
  GET  /sales-analytics                               ✗        ✗        ✗       ✓
WAREHOUSE
  GET  /inventory                                     ✗        ✗        ✓       ✓
  GET  /alerts                                        ✗        ✗        ✓       ✓
  POST /stock/adjust                                  ✗        ✗        ✓       ✓
  GET  /movements                                     ✗        ✗        ✓       ✓
  GET  /dashboard                                     ✗        ✗        ✓       ✓
POS
  POST /sale                                          ✗        ✗        ✓       ✓
  GET  /sales                                         ✗        ✗        ✓       ✓
  GET  /dashboard                                     ✗        ✗        ✓       ✓
  POST /invoice/generate                              ✗        ✗        ✓       ✓
ADDRESSES
  GET  /                                              ✗        ✓        ✓       ✓
  POST /                                               ✗        ✓        ✓       ✓
  PUT  /:id                                            ✗        ✓        ✓       ✓
  DELETE /:id                                          ✗        ✓        ✓       ✓
─────────────────
¹ = Own records only (data scoped to userId)
═══════════════════════════════════════════════════════════════════════════════════════
                     BOUNDARY RULES (What Each Role CANNOT Exploit)
═══════════════════════════════════════════════════════════════════════════════════════
CUSTOMER trying to access STAFF routes
  → authMiddleware returns 401 before role check (token valid but no role match)
  → or roleMiddleware returns 403 Forbidden
CUSTOMER trying to access ADMIN routes
  → Same as above, 403 Forbidden
STAFF trying to access ADMIN-only routes
  → roleMiddleware('ADMIN') returns 403 Forbidden
GUEST trying to access any /api/* (except public)
  → authMiddleware returns 401 Unauthorized
Order access (CUSTOMER A trying to view CUSTOMER B's order)
  → Controller checks userId match on the order
  → Returns 403 if not owner
Payment verification
  → Only ADMIN can verify
  → Staff cannot call PUT /payments/:id/verify
Invoice generation
  → System enforces: invoice ONLY after payment verified
  → POST /invoices fails with 400 if order.payment.status !== 'VERIFIED'
Variant deletion
  → isDeleted=true (soft delete)
  → Preserves historical order data
  → isActive=false used instead for delisting
Price manipulation at checkout
  → unitPrice snapshot in CartItem and OrderItem
  → Final total calculated server-side from snapshot, not from client
═══════════════════════════════════════════════════════════════════════════════════════
                        FUTURE RBAC CONSIDERATIONS
═══════════════════════════════════════════════════════════════════════════════════════
If adding DELIVERY role (separate from WAREHOUSE):
  • Read-only access to shipment details
  • Can update shipment status (DELIVERED only)
  • Cannot access inventory movements
  • Cannot access POS or orders
If adding MANAGER role between STAFF and ADMIN:
  • View analytics + sales-analytics
  • Manage staff accounts (no delete)
  • Cannot access SiteConfig or audit logs
If adding SUPPORT role (customer service):
  • Read-only access to all orders
  • Cannot modify status or amounts
  • Can view customer profiles (no password)
  • Cannot access warehouse or POS