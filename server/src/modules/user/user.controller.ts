import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../../core/utils/response.js';

export async function getUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;

    const where: any = { isDeleted: false };
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.user.count({ where }),
    ]);
    return sendPaginated(res, users, total, page, limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createStaff(req: Request, res: Response) {
  try {
    const { email, password, name, phone, position } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return sendError(res, 'Email already registered', 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, phone, role: 'STAFF' },
    });
    await prisma.staff.create({ data: { userId: user.id, position: position || 'WAREHOUSE' } });

    const { password: _, ...userWithoutPassword } = user;
    return sendSuccess(res, userWithoutPassword, 'Staff created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { name, phone, isActive, role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, phone, isActive, role },
      select: { id: true, email: true, name: true, role: true, phone: true, isActive: true, createdAt: true },
    });
    return sendSuccess(res, user, 'User updated');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isDeleted: true, deletedAt: new Date(), deletedBy: req.user?.userId } });
    return sendSuccess(res, null, 'User deleted');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
