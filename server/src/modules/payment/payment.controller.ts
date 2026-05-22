import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';

export async function createPayment(req: Request, res: Response) {
  try {
    const { orderId, paymentMethod, transactionId, paymentProof } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return sendError(res, 'Order not found', 404);
    if (req.user!.role === 'CUSTOMER' && order.userId !== req.user!.userId) return sendError(res, 'Access denied', 403);

    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing) return sendError(res, 'Payment already exists for this order', 409);

    const payment = await prisma.payment.create({
      data: { orderId, paymentMethod, amount: order.totalAmount, transactionId, paymentProof },
    });

    await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });

    return sendSuccess(res, payment, 'Payment recorded', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function verifyPayment(req: Request, res: Response) {
  try {
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { paymentStatus: req.body.status || 'VERIFIED', verifiedAt: new Date(), verifiedBy: req.user?.userId },
    });

    if (payment.paymentStatus === 'VERIFIED') {
      // Deduct stock
      const order = await prisma.order.findUnique({ where: { id: payment.orderId }, include: { items: true } });
      if (order) {
        for (const item of order.items) {
          if (item.variantId) {
            await prisma.productVariant.update({ where: { id: item.variantId }, data: { stockQty: { decrement: item.quantity } } });
          }
        }
        await prisma.order.update({ where: { id: order.id }, data: { status: 'PROCESSING' } });
      }
    }

    return sendSuccess(res, payment, 'Payment verified');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getPayments(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const where: any = {};
    if (req.query.status) where.paymentStatus = req.query.status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({ where, include: { order: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.payment.count({ where }),
    ]);
    return sendSuccess(res, { data: payments, total, page, limit });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
