import { Router } from 'express';
import { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, getFilterOptions } from './product.controller.js';
import { getTryOnAssets } from './routes/tryon.controller.js';
import { authMiddleware, optionalAuth } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.get('/', optionalAuth, getProducts);
router.get('/filters', getFilterOptions);
router.get('/:id/tryon-assets', getTryOnAssets);
router.get('/:slug', optionalAuth, getProductBySlug);
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createProduct);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteProduct);

export default router;