import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';
import { confirmReservation, releaseReservation, deductStock } from '../../core/services/inventory.service.js';
import { invalidateInventoryCache } from '../../core/services/cache.service.js';
import { generateSlug } from '../../core/utils/slug.js';

export async function createPayment(req: Request, res: Response) {
  try {
    const { orderId, paymentMethod, paymentGateway, transactionId, paymentProof, expiresAtMinutes } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return sendError(res, 'Order not found', 404);
    if (req.user!.role === 'CUSTOMER' && order.userId !== req.user!.userId) {
      return sendError(res, 'Access denied', 403);
    }

    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing) return sendError(res, 'Payment already exists for this order', 409);

    const expiredAt = expiresAtMinutes
      ? new Date(Date.now() + expiresAtMinutes * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h

    const payment = await prisma.payment.create({
      data: {
        orderId,
        paymentMethod,
        paymentGateway: paymentGateway || 'DUMMY',
        amount: order.totalAmount,
        expiredAt,
        transactionId,
        paymentProof,
        paymentStatus: 'PENDING',
      },
    });

    // Update order status to CONFIRMED (awaiting payment verification)
    await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });

    return sendSuccess(res, payment, 'Payment initiated', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function verifyPayment(req: Request, res: Response) {
  try {
    const { status: newStatus, gatewayTransactionId, gatewayResponse } = req.body;
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { order: { include: { items: true } } },
    });

    if (!payment) return sendError(res, 'Payment not found', 404);
    if (payment.paymentStatus === 'REFUNDED') {
      return sendError(res, 'Payment already refunded, cannot verify', 409);
    }
    if (payment.paymentStatus === 'VERIFIED') {
      return sendError(res, 'Payment already verified', 409);
    }

    const status = newStatus || 'VERIFIED';

    if (status === 'VERIFIED') {
      // ── 1. Confirm stock reservation ─────────────────────────────────────────
      await confirmReservation(payment.orderId);

      // ── 2. Update payment record ─────────────────────────────────────────────
      await prisma.payment.update({
        where: { id: req.params.id },
        data: {
          paymentStatus: 'VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: req.user?.userId,
          paidAt: new Date(),
          gatewayTransactionId,
          gatewayResponse: gatewayResponse ? JSON.parse(gatewayResponse) : undefined,
        },
      });

      // ── 3. Update order status ───────────────────────────────────────────────
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PROCESSING' },
      });

      // ── 4. Generate Invoice (ONLY after payment verified) ───────────────────
      const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      let nextNum = 1;
      if (lastInvoice) {
        const lastNum = parseInt(lastInvoice.invoiceNumber.split('/').pop() || '0', 10);
        nextNum = lastNum + 1;
      }

      const year = new Date().getFullYear();
      const invoiceNumber = `INV/${year}/${String(nextNum).padStart(4, '0')}`;

      await prisma.invoice.create({
        data: {
          orderId: payment.orderId,
          invoiceNumber,
          issuedAt: new Date(),
          paidAt: new Date(),
          totalAmount: payment.amount,
          status: 'PAID',
        },
      });

      // ── 5. Invalidate inventory cache (stock changed) ───────────────────────
      for (const item of payment.order.items) {
        if (item.variantId) {
          await invalidateInventoryCache(); // Full invalidation for simplicity
        }
      }

      return sendSuccess(res, { paymentId: payment.id, status: 'VERIFIED', invoiceNumber }, 'Payment verified and invoice generated');
    }

    if (status === 'FAILED') {
      const failureReason = req.body.failureReason || 'Payment verification failed';
      await prisma.payment.update({
        where: { id: req.params.id },
        data: { paymentStatus: 'FAILED', failureReason },
      });

      // Release reserved stock
      await releaseReservation(payment.orderId, 'Payment failed');

      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CANCELLED' },
      });

      return sendSuccess(res, { paymentId: payment.id, status: 'FAILED' }, failureReason);
    }

    return sendError(res, 'Invalid verification status', 400);
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
      prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);
    return sendSuccess(res, { data: payments, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

/**
 * Handle payment expiry — called by cron job or webhook.
 * Releases reserved stock and marks payment as expired.
 */
export async function expirePayment(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) return;
  if (payment.paymentStatus !== 'PENDING') return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { paymentStatus: 'EXPIRED' },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'CANCELLED' },
    }),
  ]);

  await releaseReservation(payment.orderId, 'Payment expired');
}

/**
 * Handle payment webhook from gateway (idempotent).
 * Detects duplicate webhooks and ignores them.
 */
export async function handlePaymentWebhook(req: Request, res: Response) {
  try {
    const { transactionId, status, orderId } = req.body;

    if (!transactionId || !status) {
      return sendError(res, 'Missing transactionId or status', 400);
    }

    const payment = await prisma.payment.findFirst({
      where: { gatewayTransactionId: transactionId },
    });

    if (!payment) {
      // Try by orderId if gateway doesn't return transactionId
      if (orderId) {
        const byOrder = await prisma.payment.findUnique({ where: { orderId } });
        if (byOrder && byOrder.paymentStatus === 'PENDING') {
          // Idempotent: process this payment
          req.params.id = byOrder.id;
          if (status === 'PAID' || status === 'SUCCESS') {
            return verifyPayment(req, res);
          }
          if (status === 'EXPIRE' || status === 'FAILED') {
            req.body = { status: 'FAILED', failureReason: `Gateway: ${status}` };
            return verifyPayment(req, res);
          }
        }
      }
      return sendError(res, 'Payment not found', 404);
    }

    // Idempotency: already processed
    if (payment.paymentStatus !== 'PENDING') {
      return sendSuccess(res, { paymentId: payment.id, status: payment.paymentStatus, duplicate: true }, 'Already processed');
    }

    req.params.id = payment.id;
    if (status === 'PAID' || status === 'SUCCESS') {
      req.body = {
        status: 'VERIFIED',
        gatewayTransactionId: transactionId,
        gatewayResponse: req.body,
      };
      return verifyPayment(req, res);
    }

    if (status === 'EXPIRE' || status === 'FAILED') {
      req.body = { status: 'FAILED', failureReason: `Gateway: ${status}`, gatewayTransactionId: transactionId };
      return verifyPayment(req, res);
    }

    return sendError(res, `Unhandled webhook status: ${status}`, 400);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

/**
 * Process a POS (offline) sale — direct stock deduction without reservation flow.
 */
export async function createPosSale(req: Request, res: Response) {
  try {
    const { customerName, customerPhone, items, paymentMethod, discountAmount, notes } = req.body;

    if (!items || items.length === 0) {
      return sendError(res, 'No items in sale', 400);
    }

    // Generate sale number
    const lastSale = await prisma.offlineSale.findFirst({ orderBy: { createdAt: 'desc' } });
    const nextNum = lastSale ? parseInt(lastSale.saleNumber.split('-').pop() || '0', 10) + 1 : 1;
    const saleNumber = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(nextNum).padStart(4, '0')}`;

    let subtotal = 0;
    const saleItems: { productId: string; variantId?: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];

    // Validate stock and calculate totals
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return sendError(res, `Product ${item.productId} not found`, 404);

      let variant = null;
      let price = product.discountPrice || product.basePrice;

      if (item.variantId) {
        variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
        if (!variant) return sendError(res, `Variant ${item.variantId} not found`, 404);
        if (variant.stockQty < item.quantity) {
          return sendError(res, `Insufficient stock for ${product.name} ${variant.colorName || ''}. Available: ${variant.stockQty}`, 400);
        }
        price += variant.priceOffset;
      } else {
        if (product.stockQty < item.quantity) {
          return sendError(res, `Insufficient stock for ${product.name}. Available: ${product.stockQty}`, 400);
        }
      }

      const totalPrice = price * item.quantity;
      subtotal += totalPrice;
      saleItems.push({ productId: item.productId, variantId: item.variantId || undefined, quantity: item.quantity, unitPrice: price, totalPrice });
    }

    const totalAmount = subtotal - (discountAmount || 0);

    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.offlineSale.create({
        data: {
          saleNumber,
          cashierId: req.user!.userId,
          staffId: (await tx.staff.findUnique({ where: { userId: req.user!.userId } }))?.id,
          saleChannel: 'WALK_IN',
          customerName,
          customerPhone,
          subtotal,
          discountAmount: discountAmount || 0,
          totalAmount,
          paymentMethod,
          paymentStatus: 'PAID',
          notes,
        },
      });

      for (const item of saleItems) {
        await tx.offlineSaleItem.create({
          data: {
            saleId: s.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },
        });

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (variant) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQty: { decrement: item.quantity }, version: { increment: 1 } },
            });
            await tx.inventoryMovement.create({
              data: {
                variantId: item.variantId,
                type: 'SOLD_OFFLINE',
                quantity: -item.quantity,
                balanceBefore: variant.stockQty,
                balanceAfter: variant.stockQty - item.quantity,
                reference: saleNumber,
                referenceId: s.id,
                performedBy: req.user!.userId,
              },
            });
          }
        }
      }

      return s;
    });

    return sendSuccess(res, { saleId: sale.id, saleNumber, totalAmount }, 'POS sale processed');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}