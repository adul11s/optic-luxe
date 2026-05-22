import prisma from '../core/database/prisma.js';

interface MedicationFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const medicationService = {
  async findAll(filters: MedicationFilters) {
    const { search, category, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { genericName: { contains: search } },
        ],
      }),
      ...(category && { category }),
    };

    const [medications, total] = await Promise.all([
      prisma.medication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.medication.count({ where }),
    ]);

    return {
      success: true,
      data: medications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string) {
    return prisma.medication.findFirst({
      where: { id, isDeleted: false },
      include: {
        prescriptionItems: { where: { isDeleted: false } },
      },
    });
  },

  async getLowStock() {
    return prisma.medication.findMany({
      where: {
        isDeleted: false,
        stockQuantity: { lte: prisma.medication.fields.minStockLevel },
      },
      orderBy: { stockQuantity: 'asc' },
    });
  },

  async getCategories() {
    const medications = await prisma.medication.findMany({
      where: { isDeleted: false },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return medications.map(m => m.category);
  },

  async create(data: Record<string, unknown>, userId: string) {
    const medicationData = {
      ...data,
      createdBy: userId,
    };

    if (data.expirationDate && typeof data.expirationDate === 'string') {
      (medicationData as any).expirationDate = new Date(data.expirationDate);
    }

    return prisma.medication.create({
      data: medicationData as any,
    });
  },

  async update(id: string, data: Record<string, unknown>, userId: string) {
    const medicationData = {
      ...data,
      updatedBy: userId,
    };

    if (data.expirationDate && typeof data.expirationDate === 'string') {
      (medicationData as any).expirationDate = new Date(data.expirationDate);
    }

    return prisma.medication.update({
      where: { id },
      data: medicationData as any,
    });
  },

  async updateStock(id: string, stockQuantity: number, userId: string) {
    return prisma.medication.update({
      where: { id },
      data: {
        stockQuantity,
        updatedBy: userId,
      },
    });
  },

  async delete(id: string, userId: string) {
    return prisma.medication.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  },
};