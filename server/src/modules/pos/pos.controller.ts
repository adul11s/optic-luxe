import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../../core/utils/response.js';
import { generateOrderNumber, generateInvoiceNumber } from '../../core/utils/slug.js';

// ── Create Offline Sale (POS) ──

export async function createOfflineSale(req: Request, res: Response) {
  try {
    const { items, customerName, customerPhone, paymentMethod, discountAmount, notes } = req.body;
    const cashierId = req.user?.userId;

    if (!items || !Array.isArray(items) || items.length === 0) {
      sendError(res, 'At least one item is required', 400);
      return;
    }

    const saleNumber = await generateOrderNumber();
    let subtotal = 0;

    // Validate stock and calculate totals within a transaction
    const sale = await prisma.$transaction(async (tx) => {
      const orderItems: { productId: string; variantId?: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId }, include: { product: true } });
        if (!variant) throw new Error(`Variant ${item.variantId} not found`);
        if (variant.stockQty < item.quantity) throw new Error(`Insufficient stock for ${variant.product.name} (${variant.colorName}). Available: ${variant.stockQty}`);

        const unitPrice = variant.product.discountPrice || variant.product.basePrice;
        const totalPrice = unitPrice * item.quantity;

        await tx.productVariant.update({ where: { id: variant.id }, data: { stockQty: { decrement: item.quantity } } });
        await tx.inventoryMovement.create({
          data: { variantId: variant.id, type: 'SOLD_OFFLINE', quantity: -item.quantity, balanceAfter: variant.stockQty - item.quantity, reference: saleNumber, performedBy: cashierId!, notes: `POS sale ${saleNumber}` },
        });

        orderItems.push({ productId: variant.productId, variantId: variant.id, quantity: item.quantity, unitPrice, totalPrice });
        subtotal += totalPrice;
      }

      const discount = discountAmount || 0;
      const total = subtotal - discount;

      return tx.offlineSale.create({
        data: {
          saleNumber, cashierId: cashierId!, customerName: customerName || null, customerPhone: customerPhone || null,
          subtotal, discountAmount: discount, totalAmount: total, paymentMethod: paymentMethod || 'CASH', notes,
          items: { create: orderItems },
        },
        include: { items: { include: { product: true, variant: true } } },
      });
    });

    sendSuccess(res, sale, 'Offline sale completed');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create offline sale', 400);
  }
}

// ── List Offline Sales ──

export async function getOfflineSales(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const where: Record<string, unknown> = { isDeleted: false };
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(endDate as string) };

    const [sales, total] = await Promise.all([
      prisma.offlineSale.findMany({
        where, include: { items: { include: { product: true, variant: true } } },
        orderBy: { createdAt: 'desc' }, skip: (+page - 1) * +limit, take: +limit,
      }),
      prisma.offlineSale.count({ where }),
    ]);

    sendPaginated(res, sales, total, +page, +limit);
  } catch (error) {
    sendError(res, 'Failed to fetch offline sales', 500);
  }
}

// ── Cashier Dashboard ──

export async function getCashierDashboard(_req: Request, res: Response) {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySales, recentSales, pendingPayments] = await Promise.all([
      prisma.offlineSale.aggregate({ where: { createdAt: { gte: today, lt: tomorrow } }, _sum: { totalAmount: true }, _count: true }),
      prisma.offlineSale.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { items: { include: { product: true } } } }),
      prisma.payment.count({ where: { paymentStatus: 'PENDING' } }),
    ]);

    sendSuccess(res, {
      todayTransactionCount: todaySales._count,
      todayRevenue: todaySales._sum.totalAmount || 0,
      pendingPayments,
      recentSales,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch cashier dashboard', 500);
  }
}

// ── Generate Invoice ──

export async function generateInvoicePOS(req: Request, res: Response) {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      sendError(res, 'orderId is required', 400);
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true, variant: true } }, user: true, payment: true },
    });
    if (!order) {
      sendError(res, 'Order not found', 404);
      return;
    }

    let invoice = await prisma.invoice.findUnique({ where: { orderId } });
    if (invoice) {
      sendSuccess(res, invoice, 'Invoice already exists');
      return;
    }

    const invoiceNumber = generateInvoiceNumber();
    invoice = await prisma.invoice.create({
      data: { orderId, invoiceNumber, issuedAt: new Date(), dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), totalAmount: order.totalAmount },
      include: { order: { include: { items: { include: { product: true, variant: true } }, user: true, payment: true } } },
    });

    sendSuccess(res, invoice, 'Invoice generated');
  } catch (error) {
    sendError(res, 'Failed to generate invoice', 500);
  }
}

// ── Customer Lookup ──

export async function customerLookup(req: Request, res: Response) {
  try {
    const { search } = req.query;
    if (!search) {
      sendError(res, 'Search query required', 400);
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        isDeleted: false,
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
        ],
      },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' }, take: 10,
          include: { items: { include: { product: true } }, payment: true },
        },
        _count: { select: { orders: true } },
      },
      take: 20,
    });

    sendSuccess(res, users.map(u => ({
      id: u.id, name: u.name, email: u.email, phone: u.phone,
      totalOrders: u._count.orders,
      totalSpent: u.orders.reduce((sum, o) => sum + o.totalAmount, 0),
      recentOrders: u.orders,
    })));
  } catch (error) {
    sendError(res, 'Failed to lookup customer', 500);
  }
}
