import { Router, Response } from 'express';
import { z } from 'zod';
import { roleMiddleware } from '../middleware/role.js';
import { validateBody } from '../middleware/validation.js';
import { scheduleService } from '../services/schedule.service.js';
import type { AuthenticatedRequest } from '../core/types/index.js';

const createScheduleSchema = z.object({
  doctorId: z.string(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  maxPatients: z.number().int().min(1),
});

const updateScheduleSchema = createScheduleSchema.partial();

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { doctorId } = req.query;
    const result = await scheduleService.findAll({
      doctorId: doctorId as string,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/doctor/:doctorId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedules = await scheduleService.findByDoctorId(req.params.doctorId);
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await scheduleService.findById(req.params.id);
    if (!schedule) {
      res.status(404).json({ success: false, error: 'Schedule not found' });
      return;
    }
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/', roleMiddleware(['ADMIN']), validateBody(createScheduleSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await scheduleService.create(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', roleMiddleware(['ADMIN']), validateBody(updateScheduleSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await scheduleService.update(req.params.id, req.body, req.user!.userId);
    if (!schedule) {
      res.status(404).json({ success: false, error: 'Schedule not found' });
      return;
    }
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', roleMiddleware(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    await scheduleService.delete(req.params.id, req.user!.userId);
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;