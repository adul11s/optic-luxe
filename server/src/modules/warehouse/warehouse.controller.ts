import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';

// ── Inventory Overview ──

export async function getInventoryOverview(req: Request, res: Response) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { isDeleted: false },
      include: {
        product: { select: { id: true, name: true, slug: true, brand: true, basePrice: true, discountPrice: true, images: { take: 1, where: { isPrimary: true } } } },
      },
      orderBy: { stockQty: 'asc' },
    });

    const totalProducts = await prisma.product.count({ where: { isDeleted: false } });
    const totalVariants = variants.length;
    const totalStock = variants.reduce((sum, v) => sum + v.stockQty, 0);
    const lowStockCount = variants.filter(v => v.stockQty <= v.minStockQty && v.stockQty > 0).length;
    const outOfStockCount = variants.filter(v => v.stockQty === 0).length;

    sendSuccess(res, {
      overview: { totalProducts, totalVariants, totalStock, lowStockCount, outOfStockCount },
      items: variants.map(v => ({
        id: v.id, sku: v.sku, colorName: v.colorName, colorHex: v.colorHex,
        stockQty: v.stockQty, minStockQty: v.minStockQty,
        product: v.product ? { id: v.product.id, name: v.product.name, slug: v.product.slug, brand: v.product.brand, price: v.product.discountPrice || v.product.basePrice, image: v.product.images[0]?.url || null } : null,
      })),
    });
  } catch (error) {
    sendError(res, 'Failed to fetch inventory overview', 500);
  }
}

// ── Low Stock Alerts ──

export async function getLowStockAlerts(req: Request, res: Response) {
  try {
    const alerts = await prisma.productVariant.findMany({
      where: { isDeleted: false, stockQty: { lte: prisma.productVariant.fields.minStockQty } },
      include: { product: { select: { id: true, name: true, slug: true, images: { take: 1, where: { isPrimary: true } } } } },
      orderBy: { stockQty: 'asc' },
    });

    sendSuccess(res, alerts.map(a => ({
      id: a.id, sku: a.sku, colorName: a.colorName, stockQty: a.stockQty, minStockQty: a.minStockQty,
      severity: a.stockQty === 0 ? 'critical' : 'warning',
      product: a.product ? { id: a.product.id, name: a.product.name, slug: a.product.slug, image: a.product.images[0]?.url || null } : null,
    })));
  } catch (error) {
    sendError(res, 'Failed to fetch low stock alerts', 500);
  }
}

// ── Stock Movement ──

export async function adjustStock(req: Request, res: Response) {
  try {
    const { variantId, quantity, type, reference, notes } = req.body;
    const userId = req.user?.userId;

    if (!variantId || typeof quantity !== 'number' || quantity === 0) {
      return sendError(res, 'variantId and non-zero quantity are required', 400);
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) return sendError(res, 'Variant not found', 404);

    const newQty = Math.max(0, variant.stockQty + quantity);
    const movementType = type || (quantity > 0 ? 'ADD' : 'REDUCE');

    await prisma.$transaction([
      prisma.productVariant.update({ where: { id: variantId }, data: { stockQty: newQty } }),
      prisma.inventoryMovement.create({
        data: {
          variantId, type: movementType, quantity, balanceAfter: newQty,
          reference, performedBy: userId!, notes,
        },
      }),
    ]);

    sendSuccess(res, { variantId, previousStock: variant.stockQty, newStock: newQty, movement: quantity }, 'Stock adjusted');
  } catch (error) {
    sendError(res, 'Failed to adjust stock', 500);
  }
}

// ── Stock Movement History ──

export async function getMovementHistory(req: Request, res: Response) {
  try {
    const { variantId, type, page = 1, limit = 20 } = req.query;
    const where: Record<string, unknown> = {};
    if (variantId) where.variantId = variantId as string;
    if (type) where.type = type as string;

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: { variant: { include: { product: { select: { name: true, slug: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (+page - 1) * +limit,
        take: +limit,
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    sendSuccess(res, {
      data: movements,
      pagination: { page: +page, limit: +limit, total, totalPages: Math.ceil(total / +limit) },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch movement history', 500);
  }
}

// ── Warehouse Dashboard ──

export async function getWarehouseDashboard(req: Request, res: Response) {
  try {
    const [lowStockCount, recentMovements, pendingProcurements] = await Promise.all([
      prisma.productVariant.count({ where: { isDeleted: false, stockQty: { lte: prisma.productVariant.fields.minStockQty } } }),
      prisma.inventoryMovement.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { variant: { include: { product: { select: { name: true } } } } } }),
      prisma.procurement.count({ where: { status: 'ORDERED' } }),
    ]);

    sendSuccess(res, {
      lowStockAlerts: lowStockCount,
      pendingProcurements,
      recentMovements,
    });
  } catch (error) {
    sendError(res, 'Failed to fetch warehouse dashboard', 500);
  }
}
