import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../../core/utils/response.js';
import { generateOrderNumber } from '../../core/utils/slug.js';

export async function createOrder(req: Request, res: Response) {
  try {
    const { addressId, shippingMethod, shippingName, shippingPhone, shippingAddress, shippingCity, shippingProvince, shippingPostal, notes } = req.body;

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart || cart.items.length === 0) return sendError(res, 'Cart is empty', 400);

    // Validate stock
    for (const item of cart.items) {
      if (item.variant && item.variant.stockQty < item.quantity) {
        return sendError(res, `Insufficient stock for ${item.product.name}`, 400);
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, i) => sum + (i.product.discountPrice || i.product.basePrice) * i.quantity, 0);
    const shippingCost = shippingMethod === 'EXPRESS' ? 25000 : 10000;
    const totalAmount = subtotal + shippingCost;

    // Get address if addressId provided
    let addr = null;
    if (addressId) {
      addr = await prisma.address.findFirst({ where: { id: addressId, userId: req.user!.userId } });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user!.userId,
        addressId,
        subtotal,
        shippingCost,
        totalAmount,
        shippingName: shippingName || addr?.name,
        shippingPhone: shippingPhone || addr?.phone,
        shippingAddress: shippingAddress || addr?.address,
        shippingCity: shippingCity || addr?.city,
        shippingProvince: shippingProvince || addr?.province,
        shippingPostal: shippingPostal || addr?.postalCode,
        shippingMethod: shippingMethod || 'STANDARD',
        notes,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.product.discountPrice || item.product.basePrice,
            totalPrice: (item.product.discountPrice || item.product.basePrice) * item.quantity,
          })),
        },
      },
      include: { items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } } },
    });

    // Clear cart
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
    const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'STAFF';

    const where: any = { isDeleted: false };
    if (!isAdmin) where.userId = req.user!.userId;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
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
        items: { include: { product: { include: { images: true }, variant: true } } },
        payment: true,
        shipment: true,
        invoice: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!order || order.isDeleted) return sendError(res, 'Order not found', 404);

    // Customers can only see their own orders
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

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { items: true, payment: true, shipment: true },
    });

    // If cancelled, restore stock
    if (status === 'CANCELLED') {
      for (const item of order.items) {
        if (item.variantId) {
          await prisma.productVariant.update({ where: { id: item.variantId }, data: { stockQty: { increment: item.quantity } } });
        }
      }
    }

    return sendSuccess(res, order, 'Order status updated');
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
