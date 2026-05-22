import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';

export async function createShipment(req: Request, res: Response) {
  try {
    const { orderId, courier, trackingNumber } = req.body;
    const shipment = await prisma.shipment.create({
      data: { orderId, staffId: req.user?.userId, courier, trackingNumber, status: 'PICKED_UP', shippedAt: new Date() },
    });
    await prisma.order.update({ where: { id: orderId }, data: { status: 'SHIPPED' } });
    return sendSuccess(res, shipment, 'Shipment created', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateShipment(req: Request, res: Response) {
  try {
    const { status, trackingNumber, courier } = req.body;
    const data: any = { status };
    if (trackingNumber) data.trackingNumber = trackingNumber;
    if (courier) data.courier = courier;
    if (status === 'DELIVERED') { data.deliveredAt = new Date();
      const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
      if (shipment) await prisma.order.update({ where: { id: shipment.orderId }, data: { status: 'COMPLETED' } });
    }
    const shipment = await prisma.shipment.update({ where: { id: req.params.id }, data, include: { order: true } });
    return sendSuccess(res, shipment, 'Shipment updated');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function getShipmentByOrder(req: Request, res: Response) {
  try {
    const shipment = await prisma.shipment.findUnique({ where: { orderId: req.params.orderId } });
    if (!shipment) return sendError(res, 'Shipment not found', 404);
    return sendSuccess(res, shipment);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
