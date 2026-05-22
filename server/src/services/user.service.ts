import bcrypt from 'bcryptjs';
import prisma from '../core/database/prisma.js';

interface UserFilters {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const userService = {
  async findAll(filters: UserFilters) {
    const { role, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(role && { role: role as any }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return null;

    if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: id },
      });
      return { ...user, doctor };
    }

    return user;
  },

  async create(data: Record<string, unknown>, userId: string) {
    const password = await bcrypt.hash(data.password as string, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email as string,
        password,
        name: data.name as string,
        role: data.role as any,
        phone: data.phone as string | undefined,
        createdBy: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (data.role === 'DOCTOR') {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          specialty: (data.specialty as string) || 'General',
          consultationFee: (data.consultationFee as number) || 0,
          licenseNumber: (data.licenseNumber as string) || '',
        },
      });
    } else if (['RECEPTIONIST', 'PHARMACIST', 'CASHIER'].includes(data.role as string)) {
      await prisma.staff.create({
        data: {
          userId: user.id,
          position: data.role as any,
        },
      });
    }

    return user;
  },

  async update(id: string, data: Record<string, unknown>, userId: string) {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      } as any,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async delete(id: string, userId: string) {
    return prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  },
};