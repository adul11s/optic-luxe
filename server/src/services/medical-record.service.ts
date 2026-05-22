import prisma from '../core/database/prisma.js';

interface MedicalRecordFilters {
  patientId?: string;
  doctorId?: string;
  page?: number;
  limit?: number;
}

export const medicalRecordService = {
  async findAll(filters: MedicalRecordFilters) {
    const { patientId, doctorId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(patientId && { patientId }),
      ...(doctorId && { doctorId }),
    };

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { visitDate: 'desc' },
        include: {
          patient: { select: { id: true, name: true, medicalRecordNumber: true } },
          doctor: { include: { user: { select: { name: true } } } },
          prescriptions: { where: { isDeleted: false } },
        },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return {
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    return prisma.medicalRecord.findFirst({
      where: { id, isDeleted: false },
      include: {
        patient: true,
        doctor: { include: { user: { select: { name: true, email: true } } } },
        queue: true,
        prescriptions: {
          where: { isDeleted: false },
          include: {
            items: { include: { medication: true } },
          },
        },
      },
    });
  },

  async create(data: Record<string, unknown>, userId: string) {
    const recordData = {
      ...data,
      createdBy: userId,
    };

    if (data.visitDate && typeof data.visitDate === 'string') {
      (recordData as any).visitDate = new Date(data.visitDate);
    }
    if (data.followUpDate && typeof data.followUpDate === 'string') {
      (recordData as any).followUpDate = new Date(data.followUpDate);
    }

    return prisma.medicalRecord.create({
      data: recordData as any,
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });
  },

  async update(id: string, data: Record<string, unknown>, userId: string) {
    const recordData = {
      ...data,
      updatedBy: userId,
    };

    if (data.followUpDate && typeof data.followUpDate === 'string') {
      (recordData as any).followUpDate = new Date(data.followUpDate);
    }

    return prisma.medicalRecord.update({
      where: { id },
      data: recordData as any,
    });
  },

  async getDoctorByUserId(userId: string) {
    return prisma.doctor.findUnique({
      where: { userId },
    });
  },
};