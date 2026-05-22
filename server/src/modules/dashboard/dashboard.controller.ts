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

// ── Enhanced Analytics: Online vs Offline ──

export async function getSalesAnalytics(req: Request, res: Response) {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [onlineOrders, offlineOrders, onlineRevenue, offlineRevenue, todayOnline, todayOffline, monthlyOnline, monthlyOffline, inventoryStats] = await Promise.all([
      prisma.order.count({ where: { isDeleted: false, saleChannel: 'ONLINE' } }),
      prisma.offlineSale.count({ where: { isDeleted: false } }),
      prisma.order.aggregate({ where: { isDeleted: false, status: { not: 'CANCELLED' }, saleChannel: 'ONLINE' }, _sum: { totalAmount: true } }),
      prisma.offlineSale.aggregate({ where: { isDeleted: false }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { isDeleted: false, status: { not: 'CANCELLED' }, saleChannel: 'ONLINE', createdAt: { gte: today, lt: tomorrow } }, _sum: { totalAmount: true }, _count: true }),
      prisma.offlineSale.aggregate({ where: { isDeleted: false, createdAt: { gte: today, lt: tomorrow } }, _sum: { totalAmount: true }, _count: true }),
      prisma.order.aggregate({ where: { isDeleted: false, status: { not: 'CANCELLED' }, saleChannel: 'ONLINE', createdAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
      prisma.offlineSale.aggregate({ where: { isDeleted: false, createdAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
      prisma.productVariant.aggregate({ where: { isDeleted: false }, _sum: { stockQty: true }, _count: true }),
    ]);

    const topOnlineProducts = await prisma.orderItem.groupBy({ by: ['productId'], _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 });
    const topOfflineProducts = await prisma.offlineSaleItem.groupBy({ by: ['productId'], _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 });
    const allTopIds = [...new Set([...topOnlineProducts.map(p => p.productId), ...topOfflineProducts.map(p => p.productId)])];
    const productMap = new Map((await prisma.product.findMany({ where: { id: { in: allTopIds } }, select: { id: true, name: true, brand: true, images: { take: 1, where: { isPrimary: true } } } })).map(p => [p.id, p]));

    const lowStockItems = await prisma.productVariant.count({ where: { isDeleted: false, stockQty: { lte: prisma.productVariant.fields.minStockQty } } });

    sendSuccess(res, {
      overview: {
        totalOnlineOrders: onlineOrders,
        totalOfflineOrders: offlineOrders,
        totalOnlineRevenue: onlineRevenue._sum.totalAmount || 0,
        totalOfflineRevenue: offlineRevenue._sum.totalAmount || 0,
        totalRevenue: (onlineRevenue._sum.totalAmount || 0) + (offlineRevenue._sum.totalAmount || 0),
      },
      today: {
        onlineOrders: todayOnline._count || 0, onlineRevenue: todayOnline._sum.totalAmount || 0,
        offlineOrders: todayOffline._count || 0, offlineRevenue: todayOffline._sum.totalAmount || 0,
      },
      monthly: {
        onlineRevenue: monthlyOnline._sum.totalAmount || 0, offlineRevenue: monthlyOffline._sum.totalAmount || 0,
      },
      inventory: { totalStock: inventoryStats._sum.stockQty || 0, totalVariants: inventoryStats._count, lowStockCount: lowStockItems },
      topOnlineProducts: topOnlineProducts.map(p => ({ product: productMap.get(p.productId), totalSold: p._sum.quantity })),
      topOfflineProducts: topOfflineProducts.map(p => ({ product: productMap.get(p.productId), totalSold: p._sum.quantity })),
    });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}export async function getAnalytics(_req: Request, res: Response) {
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
