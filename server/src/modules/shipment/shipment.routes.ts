import { Router } from 'express';
import { createShipment, updateShipment, getShipmentByOrder } from './shipment.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.post('/', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), createShipment);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), updateShipment);
router.get('/order/:orderId', authMiddleware, getShipmentByOrder);

export default router;
