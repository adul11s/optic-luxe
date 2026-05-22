import prisma from '../core/database/prisma.js';

interface ScheduleFilters {
  doctorId?: string;
}

export const scheduleService = {
  async findAll(filters: ScheduleFilters) {
    const { doctorId } = filters;

    const where = {
      isDeleted: false,
      ...(doctorId && { doctorId }),
    };

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    return { success: true, data: schedules };
  },

  async findById(id: string) {
    return prisma.schedule.findFirst({
      where: { id, isDeleted: false },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
    });
  },

  async findByDoctorId(doctorId: string) {
    return prisma.schedule.findMany({
      where: { doctorId, isDeleted: false },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  },

  async create(data: Record<string, unknown>, userId: string) {
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        doctorId: data.doctorId as string,
        dayOfWeek: data.dayOfWeek as number,
        isDeleted: false,
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime as string } },
              { endTime: { gt: data.startTime as string } },
            ],
          },
          {
            AND: [
              { startTime: { lt: data.endTime as string } },
              { endTime: { gte: data.endTime as string } },
            ],
          },
          {
            AND: [
              { startTime: { gte: data.startTime as string } },
              { endTime: { lte: data.endTime as string } },
            ],
          },
        ],
      },
    });

    if (existingSchedule) {
      throw new Error('Schedule conflict: Time slot already occupied');
    }

    return prisma.schedule.create({
      data: {
        ...data,
        createdBy: userId,
      } as any,
      include: {
        doctor: { include: { user: true } },
      },
    });
  },

  async update(id: string, data: Record<string, unknown>, userId: string) {
    return prisma.schedule.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      } as any,
    });
  },

  async delete(id: string, userId: string) {
    return prisma.schedule.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  },
};