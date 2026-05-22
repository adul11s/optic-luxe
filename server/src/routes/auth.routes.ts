import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken, extractToken, verifyToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { authService } from '../services/auth.service.js';
import type { Role } from '../core/types/index.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'CASHIER']),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  consultationFee: z.number().optional(),
  licenseNumber: z.string().optional(),
});

const router = Router();

router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await authService.findByEmail(email);
    if (!user || !user.isActive || user.isDeleted) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, phone, specialty, consultationFee, licenseNumber } = req.body;

    const existingUser = await authService.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ success: false, error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await authService.create({
      email,
      password: hashedPassword,
      name,
      role,
      phone,
    });

    if (role === 'DOCTOR' && (specialty || licenseNumber)) {
      await authService.createDoctorProfile(user.id, {
        specialty: specialty || 'General',
        consultationFee: consultationFee || 0,
        licenseNumber: licenseNumber || '',
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req.headers.authorization) || (req as any).cookies?.token;
    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    const user = await authService.findById(payload.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const payload = await verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    const result = await authService.changePassword(payload.userId, oldPassword, newPassword);
    if (!result) {
      res.status(400).json({ success: false, error: 'Invalid old password' });
      return;
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;