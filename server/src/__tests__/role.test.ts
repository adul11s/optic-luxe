import { describe, it, expect, vi } from 'vitest';
import { roleMiddleware } from '../middleware/role.js';
import type { Request, Response } from 'express';

function createMockRequest(user?: { userId: string; role: string }) {
  return { user } as unknown as Request;
}

function createMockResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('Role Middleware', () => {
  it('should call next() when user has required role', () => {
    const req = createMockRequest({ userId: '1', role: 'ADMIN' });
    const res = createMockResponse();
    const next = vi.fn();

    roleMiddleware('ADMIN')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next() when user has one of multiple allowed roles', () => {
    const req = createMockRequest({ userId: '1', role: 'STAFF' });
    const res = createMockResponse();
    const next = vi.fn();

    roleMiddleware('ADMIN', 'STAFF')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 when user role not allowed', () => {
    const req = createMockRequest({ userId: '1', role: 'CUSTOMER' });
    const res = createMockResponse();
    const next = vi.fn();

    roleMiddleware('ADMIN', 'STAFF')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 401 when user not authenticated', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    roleMiddleware('ADMIN')(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
