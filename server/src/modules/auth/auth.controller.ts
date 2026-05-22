import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../core/database/prisma.js';
import { generateToken } from '../../core/utils/jwt.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';
import { auditLog } from '../../middleware/errorHandler.js';
import { loginSchema, registerSchema } from './auth.dto.js';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || user.isDeleted) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    await auditLog(user.id, 'LOGIN', 'User', user.id, undefined, undefined, req.ip, req.headers['user-agent']);

    const { password: _, ...userWithoutPassword } = user;
    return sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return sendError(res, error.errors.map((e: any) => e.message).join(', '), 400);
    }
    return sendError(res, error.message || 'Login failed', 500);
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, phone } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, phone, role: 'CUSTOMER' },
    });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    await auditLog(user.id, 'CREATE', 'User', user.id, undefined, { email, name }, req.ip, req.headers['user-agent']);

    const { password: _, ...userWithoutPassword } = user;
    return sendSuccess(res, { user: userWithoutPassword, token }, 'Registration successful', 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return sendError(res, error.errors.map((e: any) => e.message).join(', '), 400);
    }
    return sendError(res, error.message || 'Registration failed', 500);
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { staff: true, addresses: { where: { isDeleted: false } } },
    });
    if (!user || user.isDeleted) {
      return sendError(res, 'User not found', 404);
    }
    const { password: _, ...userWithoutPassword } = user;
    return sendSuccess(res, userWithoutPassword);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return sendError(res, 'User not found', 404);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return sendError(res, 'Current password is incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    return sendSuccess(res, null, 'Password updated');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
