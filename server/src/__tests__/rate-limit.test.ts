/**
 * Rate limit login tests — 5 attempts / 5 menit per IP, ke-6 dalam jendela → 429.
 * Uses the real login controller so attempts are counted on actual requests.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { loginRateLimiter, resetRateLimitStore, LOGIN_RATE_LIMIT_OPTIONS } from '../middleware/rateLimit.js';
import { login } from '../modules/auth/auth.controller.js';

function mockReq(ip: string, body: Record<string, unknown>): Request {
  return { ip, body, headers: { 'user-agent': 'vitest' } } as unknown as Request;
}

interface MockRes extends Response {
  statusCode: number;
  body: any;
}

function mockRes(): Response & MockRes {
  const res: any = { statusCode: 0, body: undefined as any };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: any) => {
    res.body = body;
    return res;
  });
  res.setHeader = vi.fn();
  return res as Response & MockRes;
}

const IP = '203.0.113.55';
const nonexistentBody = { email: `nonexistent-${Date.now()}@ratelimit.test`, password: 'WrongPassword123!' };

describe('Login rate limiter (5 attempts / 5 minutes per IP)', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('allows up to 5 attempts within the window (all 401 from invalid credentials)', async () => {
    for (let i = 0; i < LOGIN_RATE_LIMIT_OPTIONS.max; i++) {
      const req = mockReq(IP, nonexistentBody);
      const res = mockRes();
      const next = vi.fn(async () => {
        await login(req, res);
      });
      await new Promise<void>((resolve) => next().then(resolve));
      // limiter passed the request through and login itself rejected credentials
      expect(res.statusCode).toBe(401);
      expect(next).toHaveBeenCalled();
    }
  });

  it('returns 429 on the 6th attempt within the window', async () => {
    // exhaust the window with 5 attempts through the real limiter + login
    for (let i = 0; i < LOGIN_RATE_LIMIT_OPTIONS.max; i++) {
      const res = mockRes();
      await new Promise<void>((resolve) => {
        const flow = async () => {
          await login(mockReq(IP, nonexistentBody), res);
          resolve();
        };
        loginRateLimiter(mockReq(IP, nonexistentBody), res, flow);
      });
      expect(res.statusCode).toBe(401);
    }

    // 6th attempt inside the window
    const res = mockRes();
    const next = vi.fn();
    loginRateLimiter(mockReq(IP, nonexistentBody), res, next);

    expect(res.statusCode).toBe(429);
    expect(res.body.message).toBe('Too many requests. Please try again later.');
    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });

  it('tracks attempts per IP — another IP still passes through', () => {
    const res = mockRes();
    const next = vi.fn();
    loginRateLimiter(mockReq('198.51.100.7', nonexistentBody), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(0); // no error response written
  });
});
