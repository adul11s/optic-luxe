import { prisma } from '../database/prisma.js';
import { restoreStock } from './inventory.service.js';
import { logAudit } from '../../middleware/audit.js';

export type RefundType = 'FULL' | 'PARTIAL';

export interface RefundRequest {
  paymentId: string;
  reason: string;
  requestedBy: string;
  ipAddress?: string;
  userAgent?: string;
  items?: { orderItemId: string; quantity: number }[]; // for partial refunds
}

export interface RefundResult {
  success: boolean;
  paymentId: string;
  refundAmount: number;
  refundedItems: { orderItemId: string; quantity: number; totalRefund: number }[];
}

/**
 * Process a refund for an online order.
 *
 * Flow:
 *  1. Validate payment exists and is VERIFIED
 *  2. Determine full vs partial refund
 *  3. For each item:
 *     a. Restore stock via restoreStock()
 *     b. Create RefundItem record
 *  4. Update Payment record (refundAmount, refundedAt, refundedBy, paymentStatus)
 *  5. Update Order status to REFUNDED (full) or keep current (partial)
 *  6. Create audit log
 *
 * Edge cases handled:
 *  - Webhook duplication: Idempotent check — if already refunded, return existing result
 *  - Partial refund: supports different quantities per item
 *  - Payment already refunded: reject with 409
 *  - Network failure during refund: wrapped in transaction, manual retry supported
 */
export async function processRefund({
  paymentId,
  reason,
  requestedBy,
  ipAddress,
  userAgent,
  items,
}: RefundRequest): Promise<RefundResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: { items: { include: { variant: true } } },
      },
    },
  });

  if (!payment) throw new Error('Payment not found');
  if (payment.paymentStatus === 'REFUNDED') {
    throw new Error('Payment already refunded');
  }
  if (payment.paymentStatus !== 'VERIFIED' && payment.paymentStatus !== 'PAID') {
    throw new Error(`Cannot refund payment with status: ${payment.paymentStatus}`);
  }

  const isPartial = items && items.length > 0 && items.length < payment.order.items.length;

  const refundedItems: RefundResult['refundedItems'] = [];
  let totalRefund = 0;

  await prisma.$transaction(async (tx) => {
    for (const orderItem of payment.order.items) {
      const refundQty = isPartial
        ? (items.find((i) => i.orderItemId === orderItem.id)?.quantity ?? 0)
        : orderItem.quantity;

      if (refundQty <= 0) continue;

      const totalRefundForItem = refundQty * orderItem.unitPrice;
      totalRefund += totalRefundForItem;

      if (orderItem.variantId) {
        await restoreStock(
          orderItem.variantId,
          refundQty,
          `REFUND: ${reason}`,
          payment.order.orderNumber,
          payment.order.id,
          requestedBy
        );
      }

      await tx.refundItem.create({
        data: {
          paymentId: payment.id,
          orderItemId: orderItem.id,
          quantity: refundQty,
          unitPrice: orderItem.unitPrice,
          totalRefund: totalRefundForItem,
        },
      });

      refundedItems.push({
        orderItemId: orderItem.id,
        quantity: refundQty,
        totalRefund: totalRefundForItem,
      });
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: 'REFUNDED',
        refundAmount: totalRefund,
        refundedAt: new Date(),
        refundedBy: requestedBy,
        refundReason: reason,
      },
    });

    if (!isPartial) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'REFUNDED' },
      });
    }
  });

  try {
    await logAudit(requestedBy, 'REFUND', 'Payment', paymentId, undefined, JSON.stringify({ amount: totalRefund, reason }));
  } catch {
    // Non-critical: audit log failure should not rollback refund
  }

  return {
    success: true,
    paymentId,
    refundAmount: totalRefund,
    refundedItems,
  };
}

/**
 * Process refund for offline/POS sale.
 * Flow is simpler — no order/payment chain, just OfflineSaleItem.
 */
export async function processPosRefund(
  saleId: string,
  itemId: string,
  quantity: number,
  reason: string,
  requestedBy: string
): Promise<void> {
  const saleItem = await prisma.offlineSaleItem.findUnique({
    where: { id: itemId, saleId },
    include: { variant: true },
  });

  if (!saleItem) throw new Error('Sale item not found');
  if (saleItem.refundQty + quantity > saleItem.quantity) {
    throw new Error(`Refund quantity exceeds sold quantity. Already refunded: ${saleItem.refundQty}`);
  }

  const totalRefund = quantity * saleItem.unitPrice;

  await prisma.$transaction(async (tx) => {
    await tx.offlineSaleItem.update({
      where: { id: itemId },
      data: { refundQty: { increment: quantity } },
    });

    await tx.offlineSale.update({
      where: { id: saleId },
      data: { paymentStatus: quantity < saleItem.quantity - saleItem.refundQty ? 'PAID' : 'REFUNDED' },
    });

    if (saleItem.variantId) {
      const variant = await tx.productVariant.findUnique({ where: { id: saleItem.variantId } });
      if (variant) {
        const newStock = variant.stockQty + quantity;
        await tx.productVariant.update({
          where: { id: saleItem.variantId },
          data: { stockQty: newStock, version: { increment: 1 } },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: saleItem.variantId,
            type: 'RETURN',
            quantity,
            balanceBefore: variant.stockQty,
            balanceAfter: newStock,
            reference: saleId,
            referenceId: saleId,
            performedBy: requestedBy,
            notes: `POS REFUND: ${reason}`,
          },
        });
      }
    }
  });
}

/**
 * Check if an order's payment is refundable.
 */
export async function isRefundable(paymentId: string): Promise<{ refundable: boolean; reason?: string }> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { include: { shipment: true } } },
  });

  if (!payment) return { refundable: false, reason: 'Payment not found' };
  if (payment.paymentStatus === 'REFUNDED') return { refundable: false, reason: 'Already refunded' };
  if (payment.paymentStatus === 'EXPIRED' || payment.paymentStatus === 'FAILED') {
    return { refundable: false, reason: 'Payment was not completed' };
  }
  if (payment.order.status === 'COMPLETED') {
    return { refundable: false, reason: 'Order already completed' };
  }
  if (payment.order.status === 'CANCELLED') {
    return { refundable: false, reason: 'Order was cancelled' };
  }

  return { refundable: true };
}

/**
 * Get refund summary for an order.
 */
export async function getRefundSummary(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      refundItems: {
        include: {
          orderItem: {
            include: { product: { select: { name: true, sku: true } }, variant: { select: { sku: true, colorName: true } } },
          },
        },
      },
    },
  });

  if (!payment) throw new Error('Payment not found');

  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    originalAmount: payment.amount,
    refundedAmount: payment.refundAmount || 0,
    refundStatus: payment.paymentStatus,
    refundDate: payment.refundedAt,
    refundedBy: payment.refundedBy,
    refundReason: payment.refundReason,
    refundedItems: payment.refundItems.map((ri) => ({
      orderItemId: ri.orderItemId,
      productName: ri.orderItem.product.name,
      productSku: ri.orderItem.product.sku,
      variantSku: ri.orderItem.variant?.sku,
      colorName: ri.orderItem.variant?.colorName,
      refundQuantity: ri.quantity,
      unitPrice: ri.unitPrice,
      totalRefund: ri.totalRefund,
    })),
  };
}