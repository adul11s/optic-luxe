import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';
import { processRefund, getRefundSummary, isRefundable, processPosRefund } from '../../core/services/refund.service.js';

export async function createRefund(req: Request, res: Response) {
  try {
    const { paymentId, reason, items } = req.body;

    if (!paymentId || !reason) {
      return sendError(res, 'paymentId and reason are required', 400);
    }

    if (reason.length < 10) {
      return sendError(res, 'Reason must be at least 10 characters', 400);
    }

    const refundable = await isRefundable(paymentId);
    if (!refundable.refundable) {
      return sendError(res, refundable.reason || 'Cannot refund this payment', 400);
    }

    const result = await processRefund({
      paymentId,
      reason,
      requestedBy: req.user!.userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      items: items || undefined,
    });

    return sendSuccess(res, result, 'Refund processed successfully');
  } catch (error: any) {
    if (error.message === 'Payment already refunded') {
      return sendError(res, error.message, 409);
    }
    return sendError(res, error.message, 500);
  }
}

export async function getRefundDetails(req: Request, res: Response) {
  try {
    const { paymentId } = req.params;

    const summary = await getRefundSummary(paymentId);

    return sendSuccess(res, summary);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getRefundList(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [refunds, total] = await Promise.all([
      prisma.payment.findMany({
        where: { paymentStatus: 'REFUNDED' },
        include: {
          order: {
            select: { id: true, orderNumber: true, user: { select: { name: true, email: true } } },
          },
          refundItems: {
            include: {
              orderItem: {
                include: { product: { select: { name: true, sku: true } } },
              },
            },
          },
        },
        orderBy: { refundedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where: { paymentStatus: 'REFUNDED' } }),
    ]);

    const data = refunds.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      orderNumber: p.order.orderNumber,
      customer: p.order.user,
      amount: p.amount,
      refundAmount: p.refundAmount,
      refundReason: p.refundReason,
      refundedAt: p.refundedAt,
      refundedBy: p.refundedBy,
      refundItems: p.refundItems.map((ri) => ({
        productName: ri.orderItem.product.name,
        productSku: ri.orderItem.product.sku,
        quantity: ri.quantity,
        totalRefund: ri.totalRefund,
      })),
    }));

    return sendSuccess(res, { data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createPosRefund(req: Request, res: Response) {
  try {
    const { saleId, itemId, quantity, reason } = req.body;

    if (!saleId || !itemId || !quantity || !reason) {
      return sendError(res, 'saleId, itemId, quantity, and reason are required', 400);
    }

    if (quantity <= 0) {
      return sendError(res, 'quantity must be positive', 400);
    }

    const sale = await prisma.offlineSale.findFirst({
      where: { id: saleId },
      include: { items: true },
    });

    if (!sale) return sendError(res, 'Sale not found', 404);
    if (sale.paymentStatus === 'REFUNDED') {
      return sendError(res, 'Sale already fully refunded', 409);
    }

    const item = sale.items.find((i) => i.id === itemId);
    if (!item) return sendError(res, 'Item not found in this sale', 404);

    const maxRefundQty = item.quantity - item.refundQty;
    if (quantity > maxRefundQty) {
      return sendError(res, `Maximum refundable quantity is ${maxRefundQty}`, 400);
    }

    await processPosRefund(saleId, itemId, quantity, reason, req.user!.userId);

    return sendSuccess(res, { saleId, itemId, quantity, totalRefund: quantity * item.unitPrice }, 'POS refund processed');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}