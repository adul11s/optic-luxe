# Optic Luxe — 5-Minute Demo Script (payments skipped)

## Reset (30s)
```bash
cd server && npm run db:seed
# accounts: admin@opticluxe.com / staff@opticluxe.com / customer@opticluxe.com / password123
# backend http://localhost:3001 / frontend http://localhost:3000
```

## Flow
1. **Shop (30s):** `/shop` → filter Aviator → open Classic Aviator. Point out variants, reviews.
2. **Checkout lite (60s):** `/cart` → checkout shipping only → place order → show PENDING + reserved stock in Warehouse.
   Staff verifies to move to Processing (no payment deep-dive).
3. **POS payoff (90s):** as staff → `/dashboard/pos` → search same product → walk-in sale Cash → receipt → show Warehouse stock dropped + Analytics revenue up.
4. **Close:** "One stock, two channels." Mention AR as roadmap (Try On button is hidden — placeholder 3D models).

## Do not click
Try On (hidden via NEXT_PUBLIC_TRYON_ENABLED), refunds, procurement, site settings, audit logs, shipment history detail.
