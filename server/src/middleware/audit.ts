import { Request, Response, NextFunction } from 'express';
import { prisma } from '../core/database/prisma.js';

export function auditLog(
  action: string,
  entityType: string,
  getEntityId?: (req: Request) => string
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    const res = (req as any).res;
    if (!res) {
      next();
      return;
    }

    const originalJson = res.json.bind(res);

    res.json = function(data: unknown) {
      setImmediate(async () => {
        try {
          const userId = req.user?.userId;
          const entityId = getEntityId ? getEntityId(req) : (req.params as any).id;
          const ipAddress = req.ip || (req as any).connection?.remoteAddress;
          const userAgent = req.headers['user-agent'];

          await prisma.auditLog.create({
            data: {
              userId: userId || 'unknown',
              action,
              entityType,
              entityId: entityId || 'unknown',
              newData: data ? JSON.stringify(data) : undefined,
              ipAddress: ipAddress || undefined,
              userAgent: userAgent || undefined,
            },
          });
        } catch (error) {
          console.error('Audit log error:', error);
        }
      });

      return originalJson(data);
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
        userId: userId || 'unknown',
        action,
        entityType,
        entityId,
        oldData: oldData ? JSON.stringify(oldData) : undefined,
        newData: newData ? JSON.stringify(newData) : undefined,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}