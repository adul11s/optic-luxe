import { Router, Response } from 'express';
import { z } from 'zod';
import { roleMiddleware } from '../middleware/role.js';
import { validateBody } from '../middleware/validation.js';
import { billingService } from '../services/billing.service.js';
import type { AuthenticatedRequest } from '../core/types/index.js';

const createInvoiceSchema = z.object({
  patientId: z.string(),
  queueId: z.string().optional(),
  subtotalTreatment: z.number().min(0).optional(),
  subtotalMedication: z.number().min(0).optional(),
  dueDate: z.string().or(z.date()),
});

const createPaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'DEBIT', 'TRANSFER']),
  referenceNumber: z.string().optional(),
});

const router = Router();

router.get('/invoices', roleMiddleware(['ADMIN', 'CASHIER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, patientId, page = '1', limit = '10' } = req.query;
    const result = await billingService.findAllInvoices({
      status: status as string,
      patientId: patientId as string,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/invoices/:id', roleMiddleware(['ADMIN', 'CASHIER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await billingService.findInvoiceById(req.params.id);
    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/invoices', roleMiddleware(['ADMIN', 'CASHIER']), validateBody(createInvoiceSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await billingService.createInvoice(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/invoices/:id/pay', roleMiddleware(['ADMIN', 'CASHIER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staff = await billingService.getStaffByUserId(req.user!.userId);
    if (!staff) {
      res.status(400).json({ success: false, error: 'Staff profile not found' });
      return;
    }

    const result = await billingService.payInvoice(req.params.id, staff.id, req.user!.userId);
    if (!result) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/payments', roleMiddleware(['ADMIN', 'CASHIER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoiceId, page = '1', limit = '10' } = req.query;
    const result = await billingService.findAllPayments({
      invoiceId: invoiceId as string,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/payments', roleMiddleware(['ADMIN', 'CASHIER']), validateBody(createPaymentSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staff = await billingService.getStaffByUserId(req.user!.userId);
    if (!staff) {
      res.status(400).json({ success: false, error: 'Staff profile not found' });
      return;
    }

    const payment = await billingService.createPayment({
      ...req.body,
      cashierId: staff.id,
    }, req.user!.userId);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/reports/daily', roleMiddleware(['ADMIN', 'CASHIER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date } = req.query;
    const report = await billingService.getDailyReport(date as string);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/reports/summary', roleMiddleware(['ADMIN', 'CASHIER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await billingService.getSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;