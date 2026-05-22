import { Router, Response } from 'express';
import { z } from 'zod';
import { roleMiddleware } from '../middleware/role.js';
import { validateBody } from '../middleware/validation.js';
import { medicalRecordService } from '../services/medical-record.service.js';
import type { AuthenticatedRequest } from '../core/types/index.js';

const createMedicalRecordSchema = z.object({
  patientId: z.string(),
  queueId: z.string().optional(),
  chiefComplaint: z.string().min(1),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentNotes: z.string().optional(),
  followUpDate: z.string().or(z.date()).optional(),
});

const updateMedicalRecordSchema = z.object({
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentNotes: z.string().optional(),
  followUpDate: z.string().or(z.date()).optional(),
});

const router = Router();

router.get('/', roleMiddleware(['ADMIN', 'DOCTOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId, doctorId, page = '1', limit = '10' } = req.query;
    const result = await medicalRecordService.findAll({
      patientId: patientId as string,
      doctorId: doctorId as string,
      page: Number(page),
      limit: Number(limit),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', roleMiddleware(['ADMIN', 'DOCTOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await medicalRecordService.findById(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, error: 'Medical record not found' });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/', validateBody(createMedicalRecordSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'DOCTOR' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const doctor = await medicalRecordService.getDoctorByUserId(req.user!.userId);
    if (!doctor) {
      res.status(400).json({ success: false, error: 'Doctor profile not found' });
      return;
    }

    const record = await medicalRecordService.create({
      ...req.body,
      doctorId: doctor.id,
    }, req.user!.userId);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', validateBody(updateMedicalRecordSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'DOCTOR' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const record = await medicalRecordService.update(req.params.id, req.body, req.user!.userId);
    if (!record) {
      res.status(404).json({ success: false, error: 'Medical record not found' });
      return;
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;