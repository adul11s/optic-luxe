import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from './category.controller.js';
import { authMiddleware, optionalAuth } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.get('/', optionalAuth, getCategories);
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createCategory);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), updateCategory);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteCategory);

export default router;
