# Optic Luxe — 5-Minute Demo Script (payments skipped)

## Reset (30s)
```bash
cd server && npm run db:seed
# accounts: admin@opticluxe.com / staff@opticluxe.com / customer@opticluxe.com / password123
# backend http://localhost:3001 / frontend http://localhost:3000
```

## Flow
1. **Shop (30s):** `/shop` → filter Aviator → open Classic Aviator. Point out variants, reviews.
2. **AR wow (90s):** Try On → allow camera (Chrome, HTTPS/localhost) → switch color → Add to cart from try-on.
   Fallback if camera fails: close try-on, use gallery. Say "photo mode on roadmap."
3. **Checkout lite (60s):** `/cart` → checkout shipping only → place order → show PENDING + reserved stock in Warehouse.
   Staff verifies to move to Processing (no payment deep-dive).
4. **POS payoff (90s):** as staff → `/dashboard/pos` → search same product → walk-in sale Cash → receipt → show Warehouse stock dropped + Analytics revenue up.
5. **Close:** "One stock, two channels, plus AR."

## Do not click
Refunds, procurement, site settings, audit logs, shipment history detail.

## If AR fails
- Retry camera button → back to product photos → continue shop → POS story carries demo.
- Have backup photos/video of AR working on same laptop.
