import { Router, Response } from 'express';
import { z } from 'zod';
import { roleMiddleware } from '../middleware/role.js';
import { validateBody } from '../middleware/validation.js';
import { medicationService } from '../services/medication.service.js';
import type { AuthenticatedRequest } from '../core/types/index.js';

const createMedicationSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  genericName: z.string().optional(),
  category: z.string().min(1),
  unit: z.string().min(1),
  stockQuantity: z.number().int().min(0),
  minStockLevel: z.number().int().min(0),
  unitPrice: z.number().min(0),
  expirationDate: z.string().or(z.date()),
  supplier: z.string().optional(),
});

const updateMedicationSchema = createMedicationSchema.partial();
const updateStockSchema = z.object({
  stockQuantity: z.number().int().min(0),
});

const router = Router();

router.get('/', roleMiddleware(['ADMIN', 'DOCTOR', 'PHARMACIST', 'CASHIER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, category, page = '1', limit = '20' } = req.query;
    const result = await medicationService.findAll({
      search: search as string,
      category: category as string,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/low-stock', roleMiddleware(['ADMIN', 'PHARMACIST']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medications = await medicationService.getLowStock();
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/categories', roleMiddleware(['ADMIN', 'PHARMACIST']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await medicationService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', roleMiddleware(['ADMIN', 'PHARMACIST']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medication = await medicationService.findById(req.params.id);
    if (!medication) {
      res.status(404).json({ success: false, error: 'Medication not found' });
      return;
    }
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/', roleMiddleware(['ADMIN', 'PHARMACIST']), validateBody(createMedicationSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medication = await medicationService.create(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', roleMiddleware(['ADMIN', 'PHARMACIST']), validateBody(updateMedicationSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medication = await medicationService.update(req.params.id, req.body, req.user!.userId);
    if (!medication) {
      res.status(404).json({ success: false, error: 'Medication not found' });
      return;
    }
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id/stock', roleMiddleware(['ADMIN', 'PHARMACIST']), validateBody(updateStockSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const medication = await medicationService.updateStock(req.params.id, req.body.stockQuantity, req.user!.userId);
    if (!medication) {
      res.status(404).json({ success: false, error: 'Medication not found' });
      return;
    }
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', roleMiddleware(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    await medicationService.delete(req.params.id, req.user!.userId);
    res.json({ success: true, message: 'Medication deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;