/**
 * Oversell race test — two parallel checkouts fighting for the last unit of stock.
 * Invariant: exactly one checkout succeeds and stock never goes negative.
 *
 * Pattern mirrors integration.test.ts (mock req/res against real Postgres).
 */
import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { prisma } from '../core/database/prisma.js';
import { createOrder } from '../modules/order/order.controller.js';
import { reserveStock } from '../core/services/inventory.service.js';

function mockReq(user: { userId: string; role: string }, body: Record<string, unknown> = {}): Request {
  return { user, body, params: {}, ip: '127.0.0.1', headers: { 'user-agent': 'vitest' } } as unknown as Request;
}

interface MockRes extends Response {
  statusCode: number;
  body: any;
}

function mockRes(): Response & MockRes {
  const res: any = { statusCode: 0, body: undefined as any };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: any) => {
    res.body = body;
    return res;
  });
  return res as Response & MockRes;
}

const suffix = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

async function seedSingleUnit() {
  const s = suffix();
  const category = await prisma.category.create({ data: { name: `Race Cat ${s}`, slug: `race-cat-${s}` } });
  const product = await prisma.product.create({
    data: {
      name: `Race Frame ${s}`,
      slug: `race-frame-${s}`,
      sku: `RACE-${s}`,
      description: 'Oversell race fixture',
      brand: 'TestBrand',
      categoryId: category.id,
      basePrice: 500000,
    },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, sku: `RACE-V-${s}`, stockQty: 1, minStockQty: 1 },
  });
  return { product, variant };
}

async function seedCustomerCart(variantId: string, productId: string, qty: number, tag: string) {
  const user = await prisma.user.create({
    data: { email: `race-${tag}-${suffix()}@test.local`, password: '$2a$12$x', name: `Racer ${tag}`, role: 'CUSTOMER' },
  });
  const cart = await prisma.cart.create({ data: { userId: user.id } });
  await prisma.cartItem.create({
    data: { cartId: cart.id, productId, variantId, quantity: qty, unitPrice: 500000 },
  });
  return { user, cart };
}

describe('Oversell race (real DB concurrency)', () => {
  it('two parallel checkouts with stock=1: exactly one succeeds, no oversell', async () => {
    const { product, variant } = await seedSingleUnit();
    const a = await seedCustomerCart(variant.id, product.id, 1, 'a');
    const b = await seedCustomerCart(variant.id, product.id, 1, 'b');
    const [resA, resB] = await Promise.all([
      runCheckout(a.user.id),
      runCheckout(b.user.id),
    ]);

    // Exactly one winner: 201. The loser gets 400 (insufficient stock) or 409 (optimistic-lock conflict).
    const winnerRes = resA.statusCode === 201 ? resA : resB;
    const loserRes = resA.statusCode === 201 ? resB : resA;
    expect(winnerRes.statusCode).toBe(201);
    expect([400, 409]).toContain(loserRes.statusCode);

    const v = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    // Winner uses a reservation: stockQty stays 1, reservedQty cannot exceed 1, nothing negative.
    expect(v!.stockQty).toBe(1);
    expect(v!.reservedQty).toBe(1);
    expect(v!.reservedQty).toBeLessThanOrEqual(v!.stockQty);

    const winnerUserId = resA.statusCode === 201 ? a.user.id : b.user.id;
    const loserUserId = winnerUserId === a.user.id ? b.user.id : a.user.id;
    expect(await prisma.order.count({ where: { userId: winnerUserId, items: { some: { variantId: variant.id } } } })).toBe(1);
    expect(await prisma.order.count({ where: { userId: loserUserId, items: { some: { variantId: variant.id } } } })).toBe(0);
  });

  it('service-level race: two parallel reserveStock on 1 unit — one wins, one rejected', async () => {
    const { variant } = await seedSingleUnit();
    const results = await Promise.allSettled([
      reserveStock({ orderId: 'RACE-A', items: [{ variantId: variant.id, quantity: 1 }] }),
      reserveStock({ orderId: 'RACE-B', items: [{ variantId: variant.id, quantity: 1 }] }),
    ]).then((r) => r.map((x) => x.status));

    expect(results.sort()).toEqual(['fulfilled', 'rejected']);
    const v = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    expect(v!.stockQty).toBe(1);
    expect(v!.reservedQty).toBe(1);
    expect(v!.reservedQty).toBeLessThanOrEqual(v!.stockQty);
  });
});

// --- helpers ---

async function runCheckout(userId: string) {
  const res = mockRes();
  await createOrder(mockReq({ userId, role: 'CUSTOMER' }, { shippingMethod: 'STANDARD' }), res);
  return res;
}
