import { Request, Response } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';

export async function getAddresses(req: Request, res: Response) {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user!.userId, isDeleted: false }, orderBy: { isDefault: 'desc' } });
    return sendSuccess(res, addresses);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createAddress(req: Request, res: Response) {
  try {
    const { label, name, phone, address, city, province, postalCode, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
    }

    const addr = await prisma.address.create({
      data: { userId: req.user!.userId, label, name, phone, address, city, province, postalCode, isDefault: isDefault || false },
    });
    return sendSuccess(res, addr, 'Address saved', 201);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function updateAddress(req: Request, res: Response) {
  try {
    const data = req.body;
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
    }
    const addr = await prisma.address.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, addr, 'Address updated');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function deleteAddress(req: Request, res: Response) {
  try {
    await prisma.address.update({ where: { id: req.params.id }, data: { isDeleted: true } });
    return sendSuccess(res, null, 'Address deleted');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}
