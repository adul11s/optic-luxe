import { Request, Response, NextFunction } from 'express';
import { prisma } from '../core/database/prisma.js';
import { sendError } from '../core/utils/response.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  sendError(res, err.message || 'Internal server error', 500);
}

export async function auditLog(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  oldData?: unknown,
  newData?: unknown,
  ipAddress?: string,
  userAgent?: string,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldData: oldData ? JSON.stringify(oldData) : undefined,
        newData: newData ? JSON.stringify(newData) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

export function auditMiddleware(entityType: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const originalJson = _res.json.bind(_res);
    _res.json = function (body: unknown) {
      if (req.user && req.method !== 'GET') {
        const entityId = (req.params as any).id;
        auditLog(
          req.user.userId,
          req.method === 'POST' ? 'CREATE' : req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE' : 'DELETE',
          entityType,
          entityId,
          undefined,
          body,
          req.ip,
          req.headers['user-agent'],
        ).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}
