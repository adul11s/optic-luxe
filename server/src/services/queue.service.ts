import { prisma } from '../core/database/prisma.js';

interface QueueFilters {
  status?: string;
  doctorId?: string;
  date?: string;
}

async function getNextQueueNumber(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastQueue = await prisma.queue.findFirst({
    where: {
      createdAt: {
        gte: today,
      },
    },
    orderBy: { queueNumber: 'desc' },
  });

  return lastQueue ? lastQueue.queueNumber + 1 : 1;
}

export const queueService = {
  async findAll(filters: QueueFilters) {
    const { status, doctorId, date } = filters;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      isDeleted: false,
      createdAt: { gte: today },
      ...(status && { status: status as any }),
      ...(doctorId && { doctorId }),
    };

    const queues = await prisma.queue.findMany({
      where,
      orderBy: { queueNumber: 'asc' },
      include: {
        patient: { select: { id: true, name: true, medicalRecordNumber: true } },
        doctor: { include: { user: { select: { name: true } } } },
        receptionist: { include: { user: { select: { name: true } } } },
      },
    });

    return { success: true, data: queues };
  },

  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [waiting, inTreatment, completed, total] = await Promise.all([
      prisma.queue.count({
        where: { status: 'WAITING', isDeleted: false, createdAt: { gte: today } },
      }),
      prisma.queue.count({
        where: { status: 'IN_TREATMENT', isDeleted: false, createdAt: { gte: today } },
      }),
      prisma.queue.count({
        where: { status: 'COMPLETED', isDeleted: false, createdAt: { gte: today } },
      }),
      prisma.queue.count({
        where: { isDeleted: false, createdAt: { gte: today } },
      }),
    ]);

    return {
      waiting,
      inTreatment,
      completed,
      total,
      averageWaitTime: 15,
    };
  },

  async findById(id: string) {
    return prisma.queue.findFirst({
      where: { id, isDeleted: false },
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true } } } },
        receptionist: { include: { user: { select: { name: true } } } },
        medicalRecords: { where: { isDeleted: false } },
      },
    });
  },

  async create(data: Record<string, unknown>, userId: string) {
    const queueNumber = await getNextQueueNumber();

    return prisma.queue.create({
      data: {
        ...data,
        queueNumber,
        receptionistId: data.receptionistId as string,
        createdBy: userId,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });
  },

  async updateStatus(id: string, status: string, userId: string) {
    const updateData: any = {
      status: status as any,
      updatedBy: userId,
    };

    if (status === 'IN_TREATMENT') {
      updateData.startTreatmentTime = new Date();
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      updateData.endTreatmentTime = new Date();
    }

    return prisma.queue.update({
      where: { id },
      data: updateData,
    });
  },

  async assignDoctor(id: string, doctorId: string, userId: string) {
    return prisma.queue.update({
      where: { id },
      data: {
        doctorId,
        updatedBy: userId,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });
  },

  async delete(id: string, userId: string) {
    return prisma.queue.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  },

  async getStaffByUserId(userId: string) {
    return prisma.staff.findUnique({
      where: { userId },
    });
  },
};