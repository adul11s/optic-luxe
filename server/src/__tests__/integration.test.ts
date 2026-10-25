/**
 * Integration tests — order/inventory/POS/refund flows against a real Postgres
 * database (isolated `optic_luxe_test`, see vitest.config.ts + setup.ts).
 * These cover the core business flows, not just utilities.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { Request, Response } from 'express';
import { prisma } from '../core/database/prisma.js';
import { createOrder } from '../modules/order/order.controller.js';
import { createOfflineSale } from '../modules/pos/pos.controller.js';
import { createPosRefund, createRefund } from '../modules/refund/refund.controller.js';
import { roleMiddleware } from '../middleware/role.js';

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
const PASSWORD = '$2a$12$abcdefghijklmnopqrstuv'; // not verified in these flows

async function seedFixture(stockQty: number) {
  const s = suffix();
  const user = await prisma.user.create({
    data: { email: `it-cust-${s}@test.local`, password: PASSWORD, name: 'IT Customer', role: 'CUSTOMER' },
  });
  const staff = await prisma.user.create({
    data: { email: `it-staff-${s}@test.local`, password: PASSWORD, name: 'IT Staff', role: 'STAFF' },
  });
  const admin = await prisma.user.create({
    data: { email: `it-admin-${s}@test.local`, password: PASSWORD, name: 'IT Admin', role: 'ADMIN' },
  });
  const category = await prisma.category.create({
    data: { name: `IT Category ${s}`, slug: `it-cat-${s}` },
  });
  const product = await prisma.product.create({
    data: {
      name: `Test Frame ${s}`,
      slug: `test-frame-${s}`,
      sku: `IT-${s}`,
      description: 'Integration test product',
      brand: 'TestBrand',
      categoryId: category.id,
      basePrice: 500000,
    },
  });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, sku: `IT-V-${s}`, stockQty, minStockQty: 1 },
  });
  return { user, staff, admin, product, variant };
}

async function seedPaidOrder(variantId: string, productId: string, userId: string, quantity: number) {
  const order = await prisma.order.create({
    data: {
      orderNumber: `IT-ORD-${suffix()}`,
      userId,
      subtotal: quantity * 500000,
      shippingCost: 10000,
      totalAmount: quantity * 500000 + 10000,
      items: { create: [{ productId, variantId, quantity, unitPrice: 500000, totalPrice: quantity * 500000 }] },
    },
    include: { items: true },
  });
  const payment = await prisma.payment.create({
    data: { orderId: order.id, paymentMethod: 'BANK_TRANSFER', paymentStatus: 'VERIFIED', amount: order.totalAmount },
  });
  return { order, payment };
}

describe('Integration: order, inventory, POS & refund (real DB)', () => {
  it('checkout order reserves stock (available stock drops by cart quantity)', async () => {
    const fx = await seedFixture(10);
    const cart = await prisma.cart.create({ data: { userId: fx.user.id } });
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: fx.product.id, variantId: fx.variant.id, quantity: 2, unitPrice: 500000 },
    });

    const res = mockRes();
    await createOrder(mockReq({ userId: fx.user.id, role: 'CUSTOMER' }, { shippingMethod: 'STANDARD' }), res);

    expect(res.statusCode).toBe(201);
    const order = await prisma.order.findUnique({ where: { id: res.body.data.id }, include: { items: true } });
    expect(order!.items[0].quantity).toBe(2);
    expect(order!.items[0].variantId).toBe(fx.variant.id);

    const variant = await prisma.productVariant.findUnique({ where: { id: fx.variant.id } });
    expect(variant!.stockQty).toBe(10);
    expect(variant!.reservedQty).toBe(2); // reserveStock reduced available stock

    // cart is cleared after successful checkout
    expect(await prisma.cartItem.count({ where: { cartId: cart.id } })).toBe(0);
  });

  it('processing a refund restores stock', async () => {
    const fx = await seedFixture(5);
    const { payment } = await seedPaidOrder(fx.variant.id, fx.product.id, fx.user.id, 2);

    const res = mockRes();
    await createRefund(
      mockReq({ userId: fx.admin.id, role: 'ADMIN' }, {
        paymentId: payment.id,
        reason: 'Customer returned the glasses, frames cracked',
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    const variant = await prisma.productVariant.findUnique({ where: { id: fx.variant.id } });
    expect(variant!.stockQty).toBe(7); // 5 + 2 restored
    expect(await prisma.refundItem.count({ where: { paymentId: payment.id } })).toBe(1);
    const refunded = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(refunded!.paymentStatus).toBe('REFUNDED');
    expect(refunded!.refundAmount).toBe(1000000);
    expect(await prisma.auditLog.count({ where: { action: 'REFUND' } })).toBeGreaterThan(0);
  });

  it('POS sale decrements stock and records the sale with an inventory movement', async () => {
    const fx = await seedFixture(10);

    const res = mockRes();
    await createOfflineSale(
      mockReq({ userId: fx.staff.id, role: 'STAFF' }, {
        items: [{ variantId: fx.variant.id, quantity: 3 }],
        customerName: 'Walk-in Test',
        paymentMethod: 'CASH',
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    const sale = await prisma.offlineSale.findUnique({ where: { id: res.body.data.id }, include: { items: true } });
    expect(sale).not.toBeNull();
    expect(sale!.totalAmount).toBe(1500000); // 3 × 500000
    expect(sale!.cashierId).toBe(fx.staff.id);
    expect(sale!.items[0].quantity).toBe(3);

    const variant = await prisma.productVariant.findUnique({ where: { id: fx.variant.id } });
    expect(variant!.stockQty).toBe(7); // 10 - 3

    const movement = await prisma.inventoryMovement.findFirst({
      where: { variantId: fx.variant.id, type: 'SOLD_OFFLINE' },
    });
    expect(movement!.quantity).toBe(-3);
    expect(movement!.performedBy).toBe(fx.staff.id);
  });

  it('POS refund returns units to stock and records a RETURN movement', async () => {
    const fx = await seedFixture(10);
    const saleRes = mockRes();
    await createOfflineSale(
      mockReq({ userId: fx.staff.id, role: 'STAFF' }, {
        items: [{ variantId: fx.variant.id, quantity: 3 }],
        paymentMethod: 'CASH',
      }),
      saleRes
    );
    const sale = await prisma.offlineSale.findFirst({ where: { cashierId: fx.staff.id }, include: { items: true } });
    expect(sale).not.toBeNull();

    const res = mockRes();
    await createPosRefund(
      mockReq({ userId: fx.staff.id, role: 'STAFF' }, {
        saleId: sale!.id,
        itemId: sale!.items[0].id,
        quantity: 1,
        reason: 'Defective unit returned',
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    const saleItem = await prisma.offlineSaleItem.findUnique({ where: { id: sale!.items[0].id } });
    expect(saleItem!.refundQty).toBe(1);
    const variant = await prisma.productVariant.findUnique({ where: { id: fx.variant.id } });
    expect(variant!.stockQty).toBe(8); // 7 + 1 returned
    const movement = await prisma.inventoryMovement.findFirst({
      where: { variantId: fx.variant.id, type: 'RETURN', referenceId: sale!.id },
    });
    expect(movement).not.toBeNull();
    expect(movement!.quantity).toBe(1);
  });
});

describe('Integration: role-based access (real middleware)', () => {
  it('cashier (STAFF) is denied on an ADMIN-only endpoint', () => {
    const middleware = roleMiddleware('ADMIN'); // refunds: ADMIN only
    const next = vi.fn();
    const res = mockRes();

    middleware(
      { user: { userId: 'staff-1', role: 'STAFF' } } as unknown as Request,
      res as unknown as Response,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('Insufficient permissions');
  });

  it('unauthenticated requests are rejected before role checks', () => {
    const middleware = roleMiddleware('ADMIN', 'STAFF');
    const next = vi.fn();
    const res = mockRes();

    middleware({} as unknown as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});

afterAll(async () => {
  // Test database is fully owned by the test suite — wipe everything the flows touched.
  await prisma.refundItem.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.offlineSaleItem.deleteMany({});
  await prisma.offlineSale.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});
