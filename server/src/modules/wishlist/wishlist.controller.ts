import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';

export async function getWishlist(req: Request, res: Response) {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.userId },
      include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, items);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function toggleWishlist(req: Request, res: Response) {
  try {
    const { productId } = req.body;
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: req.user!.userId, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return sendSuccess(res, { inWishlist: false }, 'Removed from wishlist');
    } else {
      await prisma.wishlistItem.create({ data: { userId: req.user!.userId, productId } });
      return sendSuccess(res, { inWishlist: true }, 'Added to wishlist');
    }
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
