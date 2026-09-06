import { describe, it, expect, vi } from 'vitest';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { generateToken } from '../core/utils/jwt.js';
import type { Request, Response } from 'express';

function createMockRequest(headers: Record<string, string> = {}) {
  return { headers } as unknown as Request;
}

function createMockResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe('Auth Middleware', () => {
  describe('authMiddleware', () => {
    it('should call next() for valid token', () => {
      const token = generateToken({ userId: '1', email: 'test@test.com', role: 'ADMIN' });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      const res = createMockResponse();
      const next = vi.fn();

      authMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('1');
    });

    it('should return 401 when no auth header', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn();

      authMiddleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 for non-Bearer token', () => {
      const req = createMockRequest({ authorization: 'Basic abc123' });
      const res = createMockResponse();
      const next = vi.fn();

      authMiddleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 for invalid token', () => {
      const req = createMockRequest({ authorization: 'Bearer invalid-token' });
      const res = createMockResponse();
      const next = vi.fn();

      authMiddleware(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('optionalAuth', () => {
    it('should always call next()', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = vi.fn();

      optionalAuth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should set user when valid token provided', () => {
      const token = generateToken({ userId: '1', email: 'test@test.com', role: 'ADMIN' });
      const req = createMockRequest({ authorization: `Bearer ${token}` });
      const res = createMockResponse();
      const next = vi.fn();

      optionalAuth(req, res, next);
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('1');
    });

    it('should not set user for invalid token', () => {
      const req = createMockRequest({ authorization: 'Bearer invalid' });
      const res = createMockResponse();
      const next = vi.fn();

      optionalAuth(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
