import { Router, Response } from 'express';
import { z } from 'zod';
import { roleMiddleware } from '../middleware/role.js';
import { validateBody } from '../middleware/validation.js';
import { userService } from '../services/user.service.js';
import type { AuthenticatedRequest } from '../core/types/index.js';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'CASHIER']),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  consultationFee: z.number().optional(),
  licenseNumber: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const router = Router();

router.use(roleMiddleware(['ADMIN']));

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, search, page = '1', limit = '10' } = req.query;
    const result = await userService.findAll({
      role: role as string,
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
    const user = await userService.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/', validateBody(createUserSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userService.create(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', validateBody(updateUserSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userService.update(req.params.id, req.body, req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await userService.delete(req.params.id, req.user!.userId);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;