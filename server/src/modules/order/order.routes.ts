import { Router } from 'express';
import { createOrder, getOrders, getOrderById, updateOrderStatus, getOrderStats } from './order.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.get('/stats', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), getOrderStats);
router.post('/', authMiddleware, roleMiddleware('CUSTOMER', 'ADMIN'), createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id/status', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), updateOrderStatus);

export default router;
