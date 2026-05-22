import { Router } from 'express';
import { createPayment, verifyPayment, getPayments } from './payment.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.post('/', authMiddleware, roleMiddleware('CUSTOMER', 'ADMIN'), createPayment);
router.get('/', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), getPayments);
router.put('/:id/verify', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), verifyPayment);

export default router;
