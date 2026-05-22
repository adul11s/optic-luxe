import { Request, Response, NextFunction } from 'express';
import prisma from '../core/database/prisma.js';
import type { AuthenticatedRequest } from '../core/types/index.js';

export function auditLog(
  action: string,
  entityType: string,
  getEntityId?: (req: Request) => string
) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    const originalJson = (req as any).res?.json;

    (req as any).res?.json && ((req as any).res).json = function(data: unknown) {
      setImmediate(async () => {
        try {
          const userId = req.user?.userId;
          const entityId = getEntityId ? getEntityId(req) : req.params.id;
          const ipAddress = req.ip || req.connection.remoteAddress;
          const userAgent = req.headers['user-agent'];

          await prisma.auditLog.create({
            data: {
              userId,
              action,
              entityType,
              entityId: entityId || 'unknown',
              newData: JSON.stringify(data),
              ipAddress,
              userAgent,
            },
          });
        } catch (error) {
          console.error('Audit log error:', error);
        }
      });

      return originalJson.call(this, data);
    };

    next();
  };
}

export async function logAudit(
  userId: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  oldData?: unknown,
  newData?: unknown
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}