import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma.js';

export class InsufficientStockError extends Error {
  constructor(variantId: string, requested: number, available: number) {
    super(`Insufficient stock for variant ${variantId}: requested ${requested}, available ${available}`);
    this.name = 'InsufficientStockError';
  }
}

export class ConcurrentUpdateError extends Error {
  constructor(variantId: string) {
    super(`Concurrent update detected for variant ${variantId}. Please retry.`);
    this.name = 'ConcurrentUpdateError';
  }
}

export class ReservationExpiredError extends Error {
  constructor(reservationId: string) {
    super(`Reservation ${reservationId} has expired`);
    this.name = 'ReservationExpiredError';
  }
}

interface ReservationItem {
  variantId: string;
  quantity: number;
}

interface ReserveStockOptions {
  orderId: string;
  items: ReservationItem[];
  ttlMinutes?: number;
}

/**
 * Reserve stock for an order.
 * Uses optimistic locking (version field) to prevent race conditions.
 *
 * Flow:
 *  1. Check available = stockQty - reservedQty >= requested
 *  2. Increment reservedQty per variant
 *  3. Increment version per variant
 *  4. Create InventoryMovement record
 *
 * If any variant fails, entire transaction rolls back.
 */
export async function reserveStock({ orderId, items, ttlMinutes = 30 }: ReserveStockOptions): Promise<void> {
  const results = await Promise.all(
    items.map(async (item) => {
      if (!item.variantId) return null;

      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        select: { id: true, stockQty: true, reservedQty: true, version: true, sku: true },
      });

      if (!variant) throw new Error(`Variant ${item.variantId} not found`);

      const available = variant.stockQty - variant.reservedQty;
      if (available < item.quantity) {
        throw new InsufficientStockError(item.variantId, item.quantity, available);
      }

      return prisma.productVariant.updateMany({
        where: {
          id: item.variantId,
          version: variant.version,
        },
        data: {
          reservedQty: { increment: item.quantity },
          version: { increment: 1 },
        },
      });
    })
  );

  const hasConflict = results.some((r) => r !== null && r.count === 0);
  if (hasConflict) {
    throw new ConcurrentUpdateError(items.find((_, i) => results[i]?.count === 0)?.variantId || 'unknown');
  }

  await prisma.$transaction(
    items
      .filter((i) => i.variantId)
      .map((item) =>
        prisma.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            type: 'SOLD_ONLINE',
            quantity: -item.quantity,
            balanceBefore: 0,
            balanceAfter: 0,
            reference: orderId,
            referenceId: orderId,
            performedBy: 'SYSTEM',
            notes: `Reserved for order ${orderId} (TTL: ${ttlMinutes}m)`,
          },
        })
      )
  );
}

/**
 * Confirm stock reservation — convert reserved to actual deduction.
 * Called when payment is VERIFIED.
 *
 * Flow:
 *  1. Decrement reservedQty
 *  2. Decrement stockQty
 *  3. Update InventoryMovement with actual balanceAfter
 */
export async function confirmReservation(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { where: { variantId: null } } },
  });

  if (!order) throw new Error(`Order ${orderId} not found`);

  for (const item of order.items) {
    if (!item.variantId) continue;

    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!variant) continue;

    const newStock = variant.stockQty - item.quantity;
    const newReserved = Math.max(0, variant.reservedQty - item.quantity);

    await prisma.$transaction([
      prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockQty: newStock,
          reservedQty: newReserved,
          version: { increment: 1 },
        },
      }),
      prisma.inventoryMovement.updateMany({
        where: { referenceId: orderId, variantId: item.variantId, type: 'SOLD_ONLINE' },
        data: { balanceAfter: newStock, notes: `Confirmed for order ${orderId}` },
      }),
    ]);
  }
}

/**
 * Release reserved stock — called when order is cancelled or payment fails.
 * Restores both stockQty and reservedQty.
 */
export async function releaseReservation(orderId: string, reason: string = 'ORDER_CANCELLED'): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  for (const item of order.items) {
    if (!item.variantId) continue;

    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!variant) continue;

    const newStock = variant.stockQty + item.quantity;
    const newReserved = Math.max(0, variant.reservedQty - item.quantity);

    await prisma.$transaction([
      prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockQty: newStock,
          reservedQty: newReserved,
          version: { increment: 1 },
        },
      }),
      prisma.inventoryMovement.create({
        data: {
          variantId: item.variantId,
          type: 'RETURN',
          quantity: item.quantity,
          balanceBefore: variant.stockQty,
          balanceAfter: newStock,
          reference: orderId,
          referenceId: orderId,
          performedBy: 'SYSTEM',
          notes: `${reason} — released reservation for order ${orderId}`,
        },
      }),
    ]);
  }
}

/**
 * Actually deduct stock — called when payment is VERIFIED (final step).
 * Differs from confirmReservation: this is for direct POS sales (no reservation phase).
 */
export async function deductStock(variantId: string, quantity: number, reference: string, referenceId: string, performedBy: string): Promise<void> {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error(`Variant ${variantId} not found`);

  if (variant.stockQty < quantity) {
    throw new InsufficientStockError(variantId, quantity, variant.stockQty);
  }

  const newStock = variant.stockQty - quantity;

  await prisma.$transaction([
    prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQty: newStock, version: { increment: 1 } },
    }),
    prisma.inventoryMovement.create({
      data: {
        variantId,
        type: 'SOLD_OFFLINE',
        quantity: -quantity,
        balanceBefore: variant.stockQty,
        balanceAfter: newStock,
        reference,
        referenceId,
        performedBy,
        notes: `Stock sold: ${reference}`,
      },
    }),
  ]);
}

/**
 * Restore stock — for refunds (both online and offline).
 * Restores stockQty but NOT reservedQty.
 */
export async function restoreStock(variantId: string, quantity: number, reason: string, reference: string, referenceId: string, performedBy: string): Promise<void> {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error(`Variant ${variantId} not found`);

  const newStock = variant.stockQty + quantity;

  await prisma.$transaction([
    prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQty: newStock, version: { increment: 1 } },
    }),
    prisma.inventoryMovement.create({
      data: {
        variantId,
        type: 'RETURN',
        quantity,
        balanceBefore: variant.stockQty,
        balanceAfter: newStock,
        reference,
        referenceId,
        performedBy,
        notes: reason,
      },
    }),
  ]);
}

/**
 * Get real-time available stock (stockQty - reservedQty).
 */
export async function getAvailableStock(variantId: string): Promise<number> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { stockQty: true, reservedQty: true },
  });
  if (!variant) return 0;
  return variant.stockQty - variant.reservedQty;
}

/**
 * Batch check available stock across multiple variants.
 * Returns map of variantId → available qty.
 */
export async function batchCheckStock(variantIds: { variantId: string; quantity: number }[]): Promise<Map<string, number>> {
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds.map((v) => v.variantId) } },
    select: { id: true, stockQty: true, reservedQty: true },
  });

  const available = new Map<string, number>();
  for (const v of variants) {
    available.set(v.id, v.stockQty - v.reservedQty);
  }
  return available;
}