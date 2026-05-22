import { Router } from 'express';
import { getDashboard, getAnalytics } from './dashboard.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.get('/', authMiddleware, getDashboard);
router.get('/analytics', authMiddleware, roleMiddleware('ADMIN'), getAnalytics);

export default router;
