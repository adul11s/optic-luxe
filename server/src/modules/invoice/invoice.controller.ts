import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError, sendPaginated } from '../../core/utils/response.js';
import { generateInvoiceNumber } from '../../core/utils/slug.js';

export async function generateInvoice(req: Request, res: Response) {
  try {
    const { orderId } = req.body;

    const existing = await prisma.invoice.findUnique({ where: { orderId } });
    if (existing) return sendError(res, 'Invoice already exists', 409);

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } }, payment: true } });
    if (!order) return sendError(res, 'Order not found', 404);

    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber: generateInvoiceNumber(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalAmount: order.totalAmount,
      },
      include: { order: { include: { items: { include: { product: true } }, payment: true, user: { select: { name: true, email: true } } } } },
    });

    return sendSuccess(res, invoice, 'Invoice generated', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getInvoices(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const where: any = { isDeleted: false };
    if (req.user?.role === 'CUSTOMER') {
      where.order = { userId: req.user.userId };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({ where, include: { order: { include: { items: { include: { product: true } }, payment: true, user: { select: { name: true, email: true } } } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.invoice.count({ where }),
    ]);
    return sendPaginated(res, invoices, total, page, limit);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getInvoiceById(req: Request, res: Response) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { order: { include: { items: { include: { product: true } }, payment: true, user: { select: { name: true, email: true, phone: true } } } } },
    });
    if (!invoice || invoice.isDeleted) return sendError(res, 'Invoice not found', 404);
    return sendSuccess(res, invoice);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
