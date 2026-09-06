import { Request, Response, NextFunction } from 'express';
import { sendError } from '../core/utils/response.js';

export function roleMiddleware(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }
    next();
  };
}
