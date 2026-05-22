import prisma from '../core/database/prisma.js';

interface InvoiceFilters {
  status?: string;
  patientId?: string;
  page?: number;
  limit?: number;
}

interface PaymentFilters {
  invoiceId?: string;
  page?: number;
  limit?: number;
}

function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

export const billingService = {
  async findAllInvoices(filters: InvoiceFilters) {
    const { status, patientId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(status && { status: status as any }),
      ...(patientId && { patientId }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, name: true, medicalRecordNumber: true } },
          payments: { where: { isDeleted: false } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findInvoiceById(id: string) {
    return prisma.invoice.findFirst({
      where: { id, isDeleted: false },
      include: {
        patient: true,
        queue: true,
        payments: { where: { isDeleted: false } },
      },
    });
  },

  async createInvoice(data: Record<string, unknown>, userId: string) {
    return prisma.invoice.create({
      data: {
        ...data,
        invoiceNumber: generateInvoiceNumber(),
        createdBy: userId,
        dueDate: new Date(data.dueDate as string),
      } as any,
      include: {
        patient: true,
      },
    });
  },

  async payInvoice(id: string, cashierId: string, userId: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return null;

    const totalPaid = await prisma.payment.findMany({
      where: { invoiceId: id, isDeleted: false },
    });

    const alreadyPaid = totalPaid.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(invoice.totalAmount) - alreadyPaid;

    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        cashierId,
        amount: remaining,
        paymentMethod: 'CASH',
        paymentDate: new Date(),
        createdBy: userId,
      },
    });

    const newTotalPaid = alreadyPaid + Number(payment.amount);
    if (newTotalPaid >= Number(invoice.totalAmount)) {
      await prisma.invoice.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date(), updatedBy: userId },
      });
    }

    return payment;
  },

  async findAllPayments(filters: PaymentFilters) {
    const { invoiceId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(invoiceId && { invoiceId }),
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: { include: { patient: { select: { name: true } } } },
          cashier: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async createPayment(data: Record<string, unknown>, userId: string) {
    return prisma.payment.create({
      data: data as any,
    });
  },

  async getDailyReport(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const [payments, invoices] = await Promise.all([
      prisma.payment.findMany({
        where: {
          paymentDate: { gte: targetDate, lt: nextDay },
          isDeleted: false,
        },
        include: {
          invoice: { include: { patient: true } },
        },
      }),
      prisma.invoice.findMany({
        where: {
          createdAt: { gte: targetDate, lt: nextDay },
          isDeleted: false,
        },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(i => i.status === 'PAID').length;

    return {
      date: targetDate.toISOString().split('T')[0],
      totalRevenue,
      totalInvoices,
      paidInvoices,
      pendingInvoices: totalInvoices - paidInvoices,
      transactions: payments,
    };
  },

  async getSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayPayments, weekPayments, monthPayments, pendingInvoices] = await Promise.all([
      prisma.payment.aggregate({
        where: { paymentDate: { gte: today }, isDeleted: false },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: startOfWeek }, isDeleted: false },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { paymentDate: { gte: startOfMonth }, isDeleted: false },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: { status: 'PENDING', isDeleted: false },
      }),
    ]);

    return {
      today: Number(todayPayments._sum.amount || 0),
      week: Number(weekPayments._sum.amount || 0),
      month: Number(monthPayments._sum.amount || 0),
      pendingInvoices,
    };
  },

  async getStaffByUserId(userId: string) {
    return prisma.staff.findUnique({
      where: { userId },
    });
  },
};