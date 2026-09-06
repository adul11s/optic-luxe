import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';
import {
  getInventoryOverview, getLowStockAlerts, adjustStock,
  getMovementHistory, getWarehouseDashboard,
} from './warehouse.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/inventory', roleMiddleware('ADMIN', 'STAFF'), getInventoryOverview);
router.get('/alerts', roleMiddleware('ADMIN', 'STAFF'), getLowStockAlerts);
router.post('/stock/adjust', roleMiddleware('ADMIN', 'STAFF'), adjustStock);
router.get('/movements', roleMiddleware('ADMIN', 'STAFF'), getMovementHistory);
router.get('/dashboard', roleMiddleware('ADMIN', 'STAFF'), getWarehouseDashboard);

export default router;