import { Router } from 'express';
import { prisma } from '../../core/database/prisma.js';
import { sendSuccess, sendError } from '../../core/utils/response.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleMiddleware } from '../../middleware/role.js';

const router = Router();

// ── Read audit trail (ADMIN only) ─────────────────────────────────────────────
router.get('/', authMiddleware, roleMiddleware('ADMIN'), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const action = req.query.action as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const userId = req.query.userId as string | undefined;

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return sendSuccess(res, logs, 'OK', 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to fetch audit logs', 500);
  }
});

export default router;
