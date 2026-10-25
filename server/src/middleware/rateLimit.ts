import { Request, Response, NextFunction } from 'express';
import { sendError } from '../core/utils/response.js';

// ── In-memory fixed-window rate limiter (per IP) ─────────────────────────────
// Backing store is a plain Map: single-process API, no Redis hard dependency.
// If the server is scaled horizontally, swap Map for Redis (same interface).

interface AttemptEntry {
  count: number;
  windowStart: number;
}

const attempts = new Map<string, AttemptEntry>();

export interface RateLimitOptions {
  windowMs: number; // fixed window duration
  max: number;      // max attempts per window per key
}

const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of attempts) {
    if (now - entry.windowStart >= windowMs) attempts.delete(key);
  }
}

export function createRateLimiter(options: RateLimitOptions) {
  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const key = req.ip || (req as unknown as { connection?: { remoteAddress?: string } }).connection?.remoteAddress || 'unknown';

    cleanup(now, options.windowMs);

    const entry = attempts.get(key);
    if (!entry || now - entry.windowStart >= options.windowMs) {
      attempts.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (entry.count >= options.max) {
      const retryAfterSeconds = Math.ceil((entry.windowStart + options.windowMs - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      sendError(res, 'Too many requests. Please try again later.', 429);
      return;
    }

    entry.count += 1;
    next();
  };
}

export const LOGIN_RATE_LIMIT_OPTIONS: RateLimitOptions = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,                  // 5 attempts / 5 menit per IP
};

export const loginRateLimiter = createRateLimiter(LOGIN_RATE_LIMIT_OPTIONS);

/** Test helper: clear all tracked keys. */
export function resetRateLimitStore(): void {
  attempts.clear();
}
