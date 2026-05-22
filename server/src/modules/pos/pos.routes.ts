import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';
import {
  createOfflineSale, getOfflineSales, getCashierDashboard,
  generateInvoicePOS, customerLookup,
} from './pos.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/sale', roleMiddleware('ADMIN', 'STAFF'), createOfflineSale);
router.get('/sales', roleMiddleware('ADMIN', 'STAFF'), getOfflineSales);
router.get('/dashboard', roleMiddleware('ADMIN', 'STAFF'), getCashierDashboard);
router.post('/invoice/generate', roleMiddleware('ADMIN', 'STAFF'), generateInvoicePOS);
router.get('/customer', roleMiddleware('ADMIN', 'STAFF'), customerLookup);

export default router;