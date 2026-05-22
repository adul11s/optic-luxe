import prisma from '../core/database/prisma.js';

interface PatientFilters {
  search?: string;
  page?: number;
  limit?: number;
}

function generateMRN(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MRN-${timestamp}-${random}`;
}

export const patientService = {
  async findAll(filters: PatientFilters) {
    const { search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { medicalRecordNumber: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true } },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    return prisma.patient.findFirst({
      where: { id, isDeleted: false },
      include: {
        medicalRecords: {
          where: { isDeleted: false },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
          },
          orderBy: { visitDate: 'desc' },
          take: 10,
        },
        prescriptions: {
          where: { isDeleted: false },
          include: {
            items: { include: { medication: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        queues: {
          where: { isDeleted: false },
          orderBy: { checkInTime: 'desc' },
          take: 5,
        },
      },
    });
  },

  async create(data: Record<string, unknown>, userId: string) {
    const patientData = {
      ...data,
      medicalRecordNumber: generateMRN(),
      createdBy: userId,
    };

    if (data.dateOfBirth && typeof data.dateOfBirth === 'string') {
      (patientData as any).dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.followUpDate && typeof data.followUpDate === 'string') {
      (patientData as any).followUpDate = new Date(data.followUpDate);
    }

    return prisma.patient.create({
      data: patientData as any,
    });
  },

  async update(id: string, data: Record<string, unknown>, userId: string) {
    const patientData = {
      ...data,
      updatedBy: userId,
    };

    if (data.dateOfBirth && typeof data.dateOfBirth === 'string') {
      (patientData as any).dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.followUpDate && typeof data.followUpDate === 'string') {
      (patientData as any).followUpDate = new Date(data.followUpDate);
    }

    return prisma.patient.update({
      where: { id },
      data: patientData as any,
    });
  },

  async delete(id: string, userId: string) {
    return prisma.patient.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  },
};