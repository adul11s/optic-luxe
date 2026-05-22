import { Router } from 'express';
import { createReview, getProductReviews } from './review.controller.js';
import { authMiddleware, optionalAuth } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.get('/product/:productId', optionalAuth, getProductReviews);
router.post('/', authMiddleware, roleMiddleware('CUSTOMER', 'ADMIN'), createReview);

export default router;
