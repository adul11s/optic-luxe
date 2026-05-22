import { Router } from 'express';
import { getWishlist, toggleWishlist } from './wishlist.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);

export default router;
