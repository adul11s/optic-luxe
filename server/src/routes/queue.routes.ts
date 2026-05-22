import { Router, Response } from 'express';
import { z } from 'zod';
import { roleMiddleware } from '../middleware/role.js';
import { validateBody } from '../middleware/validation.js';
import { queueService } from '../services/queue.service.js';
import type { AuthenticatedRequest } from '../core/types/index.js';

const createQueueSchema = z.object({
  patientId: z.string(),
  doctorId: z.string().optional(),
  complaint: z.string().min(1),
});

const updateStatusSchema = z.object({
  status: z.enum(['WAITING', 'IN_TREATMENT', 'COMPLETED', 'CANCELLED']),
});

const assignDoctorSchema = z.object({
  doctorId: z.string(),
});

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, doctorId, date } = req.query;
    const result = await queueService.findAll({
      status: status as string,
      doctorId: doctorId as string,
      date: date as string,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/today-stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await queueService.getTodayStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queue = await queueService.findById(req.params.id);
    if (!queue) {
      res.status(404).json({ success: false, error: 'Queue not found' });
      return;
    }
    res.json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/', roleMiddleware(['RECEPTIONIST', 'ADMIN']), validateBody(createQueueSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staff = await queueService.getStaffByUserId(req.user!.userId);
    if (!staff) {
      res.status(400).json({ success: false, error: 'Staff profile not found' });
      return;
    }

    const queue = await queueService.create({
      ...req.body,
      receptionistId: staff.id,
    }, req.user!.userId);
    res.status(201).json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id/status', roleMiddleware(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), validateBody(updateStatusSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queue = await queueService.updateStatus(req.params.id, req.body.status, req.user!.userId);
    if (!queue) {
      res.status(404).json({ success: false, error: 'Queue not found' });
      return;
    }
    res.json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id/assign-doctor', roleMiddleware(['RECEPTIONIST', 'ADMIN']), validateBody(assignDoctorSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queue = await queueService.assignDoctor(req.params.id, req.body.doctorId, req.user!.userId);
    if (!queue) {
      res.status(404).json({ success: false, error: 'Queue not found' });
      return;
    }
    res.json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', roleMiddleware(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    await queueService.delete(req.params.id, req.user!.userId);
    res.json({ success: true, message: 'Queue deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;