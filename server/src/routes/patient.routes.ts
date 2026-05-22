import { Router, Response } from 'express';
import { z } from 'zod';
import { roleMiddleware } from '../middleware/role.js';
import { validateBody } from '../middleware/validation.js';
import { patientService } from '../services/patient.service.js';
import type { AuthenticatedRequest } from '../core/types/index.js';

const createPatientSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string().or(z.date()),
  gender: z.enum(['MALE', 'FEMALE']),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().min(1),
  emergencyContactName: z.string().min(1),
  emergencyContactPhone: z.string().min(1),
  allergies: z.string().optional(),
  bloodType: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

const router = Router();

router.use(roleMiddleware(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER']));

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '10' } = req.query;
    const result = await patientService.findAll({
      search: search as string,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patient = await patientService.findById(req.params.id);
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/', validateBody(createPatientSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const patient = await patientService.create(req.body, userId);
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', validateBody(updatePatientSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const patient = await patientService.update(req.params.id, req.body, userId);
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden - Admin only' });
      return;
    }
    const userId = req.user?.userId;
    await patientService.delete(req.params.id, userId);
    res.json({ success: true, message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;