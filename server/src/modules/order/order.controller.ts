import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../../core/utils/response.js';
import { generateOrderNumber } from '../../core/utils/slug.js';
import { reserveStock, releaseReservation, batchCheckStock } from '../../core/services/inventory.service.js';
import { InsufficientStockError, ConcurrentUpdateError } from '../../core/services/inventory.service.js';

export async function createOrder(req: Request, res: Response) {
  try {
    const { addressId, shippingMethod, notes } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
      include: { items: { where: { savedForLater: false }, include: { product: true, variant: true } } },
    });
    if (!cart || cart.items.length === 0) return sendError(res, 'Cart is empty', 400);

    const stockCheck = await batchCheckStock(
      cart.items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId!, quantity: i.quantity }))
    );
    for (const item of cart.items) {
      if (!item.variantId) continue;
      const available = stockCheck.get(item.variantId) ?? 0;
      if (available < item.quantity) {
        return sendError(res, `Insufficient stock for ${item.product.name} (${item.variant?.colorName || ''}). Available: ${available}`, 400);
      }
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const shippingCost = shippingMethod === 'EXPRESS' ? 25000 : 10000;
    const totalAmount = subtotal + shippingCost;

    try {
      await reserveStock({
        orderId: 'PENDING',
        items: cart.items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId!, quantity: i.quantity })),
      });
    } catch (err) {
      if (err instanceof ConcurrentUpdateError) {
        return sendError(res, 'Stock was modified by another request. Please retry your order.', 409);
      }
      if (err instanceof InsufficientStockError) {
        return sendError(res, err.message, 400);
      }
      throw err;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user!.userId,
        addressId,
        subtotal,
        shippingCost,
        totalAmount,
        notes,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    await prisma.inventoryMovement.updateMany({
      where: { referenceId: 'PENDING', type: 'SOLD_ONLINE' },
      data: { reference: order.orderNumber, referenceId: order.id },
    });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return sendSuccess(res, order, 'Order created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getOrders(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = (req.query.search as string)?.trim();
    const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'STAFF';

    const where: any = { isDeleted: false };
    if (!isAdmin) where.userId = req.user!.userId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { is: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          payment: true,
          shipment: true,
          invoice: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);
    return sendPaginated(res, orders, total, page, limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
              variant: true,
            },
          },
          payment: true,
          shipment: true,
          invoice: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });
      if (!order || order.isDeleted) return sendError(res, 'Order not found', 404);

    if (req.user!.role === 'CUSTOMER' && order.userId !== req.user!.userId) {
      return sendError(res, 'Access denied', 403);
    }
    return sendSuccess(res, order);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) return sendError(res, 'Invalid status', 400);

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, payment: true },
    });
    if (!order) return sendError(res, 'Order not found', 404);

    const previousStatus = order.status;
    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = req.user!.userId;
      await releaseReservation(order.id, `Order ${order.orderNumber} cancelled by ${req.user!.role}`);
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: { items: true, payment: true, shipment: true },
    });

    return sendSuccess(res, updated, `Order status updated to ${status}`);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getOrderStats(_req: Request, res: Response) {
  try {
    const [total, pending, processing, shipped, completed, revenue] = await Promise.all([
      prisma.order.count({ where: { isDeleted: false } }),
      prisma.order.count({ where: { isDeleted: false, status: 'PENDING' } }),
      prisma.order.count({ where: { isDeleted: false, status: { in: ['CONFIRMED', 'PROCESSING', 'PACKED'] } } }),
      prisma.order.count({ where: { isDeleted: false, status: 'SHIPPED' } }),
      prisma.order.count({ where: { isDeleted: false, status: 'COMPLETED' } }),
      prisma.order.aggregate({ where: { isDeleted: false, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
    ]);
    return sendSuccess(res, { total, pending, processing, shipped, completed, revenue: revenue._sum.totalAmount || 0 });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}