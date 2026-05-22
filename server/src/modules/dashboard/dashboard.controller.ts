import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';

export async function getDashboard(req: Request, res: Response) {
  try {
    const role = req.user!.role;

    if (role === 'ADMIN') {
      const [totalOrders, totalRevenue, totalUsers, totalProducts, pendingOrders, lowStock] = await Promise.all([
        prisma.order.count({ where: { isDeleted: false } }),
        prisma.order.aggregate({ where: { isDeleted: false, status: { not: 'CANCELLED' } }, _sum: { totalAmount: true } }),
        prisma.user.count({ where: { isDeleted: false } }),
        prisma.product.count({ where: { isDeleted: false } }),
        prisma.order.count({ where: { isDeleted: false, status: 'PENDING' } }),
        prisma.productVariant.findMany({ where: { isDeleted: false, stockQty: { lte: prisma.productVariant.fields.minStockQty } }, include: { product: { select: { name: true } } } }),
      ]);

      const recentOrders = await prisma.order.findMany({
        where: { isDeleted: false },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      return sendSuccess(res, {
        stats: { totalOrders, totalRevenue: totalRevenue._sum.totalAmount || 0, totalUsers, totalProducts, pendingOrders, lowStockCount: lowStock.length },
        lowStock,
        recentOrders,
      });
    }

    if (role === 'STAFF') {
      const [pendingOrders, pendingPayments, pendingShipments] = await Promise.all([
        prisma.order.count({ where: { isDeleted: false, status: { in: ['PENDING', 'CONFIRMED'] } } }),
        prisma.payment.count({ where: { paymentStatus: 'PENDING' } }),
        prisma.order.count({ where: { isDeleted: false, status: { in: ['PROCESSING', 'PACKED'] } } }),
      ]);

      const recentOrders = await prisma.order.findMany({
        where: { isDeleted: false, status: { not: 'CANCELLED' } },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      return sendSuccess(res, { stats: { pendingOrders, pendingPayments, pendingShipments }, recentOrders });
    }

    if (role === 'CUSTOMER') {
      const userId = req.user!.userId;
      const [orders, activeCount] = await Promise.all([
        prisma.order.findMany({ where: { userId, isDeleted: false }, include: { shipment: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma.order.count({ where: { userId, isDeleted: false, status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
      ]);
      return sendSuccess(res, { stats: { totalOrders: await prisma.order.count({ where: { userId, isDeleted: false } }), activeOrders: activeCount }, recentOrders: orders });
    }

    return sendSuccess(res, {});
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getAnalytics(_req: Request, res: Response) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyRevenue, topProducts, ordersByStatus] = await Promise.all([
      prisma.order.aggregate({ where: { isDeleted: false, status: { not: 'CANCELLED' }, createdAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
      prisma.orderItem.groupBy({ by: ['productId'], _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 }),
      prisma.order.groupBy({ by: ['status'], _count: true, where: { isDeleted: false } }),
    ]);

    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, basePrice: true } });

    return sendSuccess(res, {
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      topProducts: topProducts.map(p => ({ ...products.find(pr => pr.id === p.productId), totalSold: p._sum.quantity })),
      ordersByStatus,
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
