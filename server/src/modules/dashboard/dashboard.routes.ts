import { Router } from 'express';
import { getDashboard, getAnalytics, getSalesAnalytics, getSidebarStats } from './dashboard.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.get('/', authMiddleware, getDashboard);
router.get('/sidebar-stats', authMiddleware, getSidebarStats);
router.get('/analytics', authMiddleware, roleMiddleware('ADMIN'), getAnalytics);
router.get('/sales-analytics', authMiddleware, roleMiddleware('ADMIN'), getSalesAnalytics);

export default router;
