/**
 * Audit log tests — sensitive actions must record AuditLog rows.
 * Runs against the real Postgres test database (optic_luxe_test).
 */
import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { prisma } from '../core/database/prisma.js';
import { createProduct, updateProduct, deleteProduct } from '../modules/product/product.controller.js';
import { createOfflineSale } from '../modules/pos/pos.controller.js';
import { updateOrderStatus } from '../modules/order/order.controller.js';
import { processRefund } from '../core/services/refund.service.js';
import { getAuditLogs } from '../modules/audit/audit.controller.js';

function mockReq(user: { userId: string; role: string }, body: Record<string, unknown> = {}, params: Record<string, string> = {}, query: Record<string, unknown> = {}): Request {
  return { user, body, params, query, ip: '127.0.0.1', headers: { 'user-agent': 'vitest' } } as unknown as Request;
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
const PASSWORD = '$2a$12$abcdefghijklmnopqrstuv';

async function seedAdmin(userTag: string) {
  return prisma.user.create({
    data: { email: `audit-admin-${suffix()}-${userTag}@test.local`, password: PASSWORD, name: 'Audit Admin', role: 'ADMIN' },
  });
}

describe('Audit log: sensitive actions are recorded', () => {
  it('records CREATE, UPDATE, DELETE rows for product CRUD by admin', async () => {
    const admin = await seedAdmin('crud');
    const category = await prisma.category.create({
      data: { name: `Audit Cat ${suffix()}`, slug: `audit-cat-${suffix()}` },
    });

    // CREATE
    const resCreate = mockRes();
    await createProduct(
      mockReq({ userId: admin.id, role: 'ADMIN' }, {
        name: `Audit Frame ${suffix()}`,
        description: 'Audit test',
        brand: 'AuditBrand',
        categoryId: category.id,
        frameShape: 'ROUND',
        material: 'ACETATE',
        gender: 'UNISEX',
        basePrice: 250000,
      }),
      resCreate,
    );
    expect(resCreate.statusCode).toBe(201);
    const productId = resCreate.body.data.id;

    const createRow = await prisma.auditLog.findFirst({
      where: { action: 'CREATE', entityType: 'Product', entityId: productId },
    });
    expect(createRow).not.toBeNull();
    expect(createRow!.userId).toBe(admin.id);

    // UPDATE
    const resUpdate = mockRes();
    await updateProduct(
      mockReq({ userId: admin.id, role: 'ADMIN' }, { basePrice: 999000 }, { id: productId }),
      resUpdate,
    );
    expect(resUpdate.statusCode).toBe(200);
    const updateRow = await prisma.auditLog.findFirst({
      where: { action: 'UPDATE', entityType: 'Product', entityId: productId },
    });
    expect(updateRow).not.toBeNull();
    expect(JSON.parse(updateRow!.oldData as string).basePrice).toBe(250000);
    expect(JSON.parse(updateRow!.newData as string).basePrice).toBe(999000);

    // DELETE
    const resDelete = mockRes();
    await deleteProduct(mockReq({ userId: admin.id, role: 'ADMIN' }, {}, { id: productId }), resDelete);
    expect(resDelete.statusCode).toBe(200);
    const deleteRow = await prisma.auditLog.findFirst({
      where: { action: 'DELETE', entityType: 'Product', entityId: productId },
    });
    expect(deleteRow).not.toBeNull();
  });

  it('records POS sale audit row for offline sale', async () => {
    const admin = await seedAdmin('pos');
    const category = await prisma.category.create({
      data: { name: `POS Audit Cat ${suffix()}`, slug: `pos-audit-cat-${suffix()}` },
    });
    const product = await prisma.product.create({
      data: { name: `POS Audit Frame ${suffix()}`, slug: `pos-audit-${suffix()}`, sku: `PA-${suffix()}`, description: 'POS audit test', brand: 'AuditBrand', categoryId: category.id, basePrice: 300000 },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `PA-V-${suffix()}`, stockQty: 20, minStockQty: 1 },
    });

    const res = mockRes();
    await createOfflineSale(
      mockReq({ userId: admin.id, role: 'STAFF' }, {
        items: [{ variantId: variant.id, quantity: 2 }],
        paymentMethod: 'CASH',
      }),
      res,
    );
    expect(res.statusCode).toBe(200);

    const row = await prisma.auditLog.findFirst({
      where: { action: 'POS_SALE', entityType: 'OfflineSale', userId: admin.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(row).not.toBeNull();
    expect(row!.entityId).toBe(res.body.data.id);
  });

  it('records order status change audit row', async () => {
    const admin = await seedAdmin('status');
    const cust = await prisma.user.create({
      data: { email: `audit-cust-${suffix()}@test.local`, password: PASSWORD, name: 'Audit Cust', role: 'CUSTOMER' },
    });
    const order = await prisma.order.create({
      data: { orderNumber: `AUD-${suffix()}`, userId: cust.id, subtotal: 500000, shippingCost: 10000, totalAmount: 510000, status: 'PENDING' },
    });

    const res = mockRes();
    await updateOrderStatus(
      mockReq({ userId: admin.id, role: 'ADMIN' }, { status: 'CONFIRMED' }, { id: order.id }),
      res,
    );
    expect(res.statusCode).toBe(200);

    const row = await prisma.auditLog.findFirst({
      where: { action: 'STATUS_CHANGE', entityType: 'Order', entityId: order.id },
    });
    expect(row).not.toBeNull();
    expect(JSON.parse(row!.oldData as string).status).toBe('PENDING');
    expect(JSON.parse(row!.newData as string).status).toBe('CONFIRMED');
  });

  it('records REFUND audit row for online refund', async () => {
    const admin = await seedAdmin('refund');
    const category = await prisma.category.create({
      data: { name: `Ref Audit Cat ${suffix()}`, slug: `ref-audit-cat-${suffix()}` },
    });
    const product = await prisma.product.create({
      data: { name: `Refund Frame ${suffix()}`, slug: `refund-${suffix()}`, sku: `RF-${suffix()}`, description: 'Refund audit test', brand: 'AuditBrand', categoryId: category.id, basePrice: 500000 },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `RF-V-${suffix()}`, stockQty: 10, minStockQty: 1 },
    });
    const cust = await prisma.user.create({
      data: { email: `refund-cust-${suffix()}@test.local`, password: PASSWORD, name: 'Refund Cust', role: 'CUSTOMER' },
    });
    const order = await prisma.order.create({
      data: {
        orderNumber: `RF-ORD-${suffix()}`, userId: cust.id, subtotal: 500000, shippingCost: 10000, totalAmount: 510000,
        items: { create: [{ productId: product.id, variantId: variant.id, quantity: 1, unitPrice: 500000, totalPrice: 500000 }] },
      },
      include: { items: true },
    });
    const payment = await prisma.payment.create({
      data: { orderId: order.id, paymentMethod: 'BANK_TRANSFER', paymentStatus: 'VERIFIED', amount: order.totalAmount },
    });

    const result = await processRefund({ paymentId: payment.id, reason: 'Audit test refund', requestedBy: admin.id });
    expect(result.success).toBe(true);

    const row = await prisma.auditLog.findFirst({
      where: { action: 'REFUND', entityType: 'Payment', entityId: payment.id },
    });
    expect(row).not.toBeNull();
    expect(row!.userId).toBe(admin.id);
  });

  it('admin read endpoint returns recorded audit rows', async () => {
    const admin = await seedAdmin('read');
    await prisma.auditLog.create({
      data: { userId: admin.id, action: 'READ_ENDPOINT_PROBE', entityType: 'AuditTest', entityId: 'probe-1' },
    });

    const res = mockRes();
    await getAuditLogs(mockReq({ userId: admin.id, role: 'ADMIN' }, {}, {}, { action: 'READ_ENDPOINT_PROBE', page: 1, limit: 10 }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
    const match = res.body.data.find((l: any) => l.action === 'READ_ENDPOINT_PROBE' && l.entityId === 'probe-1');
    expect(match).toBeTruthy();
    expect(match.user.email).toBe(admin.email);
  });
});
