import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';

export async function createReview(req: Request, res: Response) {
  try {
    const { productId, rating, comment } = req.body;
    if (rating < 1 || rating > 5) return sendError(res, 'Rating must be 1-5', 400);

    const review = await prisma.review.create({
      data: { userId: req.user!.userId, productId, rating, comment },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    return sendSuccess(res, review, 'Review added', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getProductReviews(req: Request, res: Response) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId, isDeleted: false },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return sendSuccess(res, { reviews, averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length });
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
