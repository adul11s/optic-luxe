import { Router } from 'express';
import { generateInvoice, getInvoices, getInvoiceById } from './invoice.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

router.post('/', authMiddleware, roleMiddleware('ADMIN', 'STAFF'), generateInvoice);
router.get('/', authMiddleware, getInvoices);
router.get('/:id', authMiddleware, getInvoiceById);

export default router;
