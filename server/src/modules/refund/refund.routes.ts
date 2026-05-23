import { Router } from 'express';
import { createRefund, getRefundDetails, getRefundList, createPosRefund } from './refund.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

// ── Online Refunds ────────────────────────────────────────────────────────────
// ADMIN only — full refund authority
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createRefund);
router.get('/', authMiddleware, roleMiddleware('ADMIN'), getRefundList);
router.get('/:paymentId', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), getRefundDetails);

// ── POS Refunds ────────────────────────────────────────────────────────────────
// Staff with CASHIER or SUPERVISOR position can process POS refunds
router.post('/pos', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), createPosRefund);

export default router;