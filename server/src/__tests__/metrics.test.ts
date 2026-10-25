/**
 * Metrics tests — in-process counters & latency ring buffer.
 * Verifies: counters rise on requests, 5xx counted, percentiles computed,
 * and the snapshot payload leaks no personal data.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { percentiles, metricsMiddleware, snapshotMetrics, resetMetricsStore } from '../middleware/metrics.js';

function makeObj<T extends object>(extra: Record<string, unknown> = {}): T {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  const req = {
    method: 'GET',
    baseUrl: '/api/products',
    originalUrl: '/api/products',
    route: { path: '/' },
    headers: { 'user-agent': 'vitest', authorization: 'Bearer secret-token' },
    params: {},
    body: { email: 'picuh@example.com', password: 'hunter2' },
    user: { userId: 'user-123', role: 'CUSTOMER' },
    ...extra,
    on(ev: string, cb: (...args: unknown[]) => void) {
      (listeners[ev] ??= []).push(cb);
      return req;
    },
    emit(ev: string, ...args: unknown[]) {
      for (const cb of listeners[ev] ?? []) cb(...args);
      return true;
    },
  } as unknown as T;
  return req;
}

function runThrough(): { req: Request; res: Response } {
  const req = makeObj<Request>();
  const res = makeObj<Response & { statusCode: number; locals: Record<string, unknown> }>({
    statusCode: 200,
    locals: {},
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
  });
  (res as Response & { statusCode: number }).statusCode = 200;
  metricsMiddleware(req, res, () => {});
  return { req, res };
}

beforeEach(() => resetMetricsStore());

describe('Metrics middleware', () => {
  it('increments the request counter per route', () => {
    const { req, res } = runThrough();
    (res as Response).emit('finish');
    const snap = snapshotMetrics();
    const route = snap.routes.find((r) => r.route === 'GET /api/products/');
    expect(route?.total).toBe(1);
    expect(snapshotMetrics().requestsTotal).toBe(1);
    void req;
  });

  it('counts 5xx responses as errors', () => {
    const { req, res } = runThrough();
    (res as Response & { statusCode: number }).statusCode = 500;
    (res as Response).emit('finish');
    const snap = snapshotMetrics();
    expect(snap.errors5xxTotal).toBe(1);
    expect(snap.routes[0].errors5xx).toBe(1);
    JSON.stringify(snap); // sanity: snapshot is JSON-safe
    void req;
  });

  it('does not count 4xx as 5xx errors', () => {
    const { res } = runThrough();
    (res as Response & { statusCode: number }).statusCode = 429;
    (res as Response).emit('finish');
    expect(snapshotMetrics().errors5xxTotal).toBe(0);
    expect(snapshotMetrics().routes[0].total).toBe(1);
  });

  it('computes latency percentiles from recorded durations', () => {
    const { res } = runThrough();
    (res as Response).emit('finish');
    const snap = snapshotMetrics();
    expect(snap.routes[0].latencySampled).toBe(1);
    expect(snap.routes[0].latencyMs.p50).not.toBeNull();
    expect(snap.routes[0].latencyMs.p95).not.toBeNull();
    expect(snap.routes[0].latencyMs.p50!).toBeLessThanOrEqual(snap.routes[0].latencyMs.p95!);
  });

  it('ring buffer keeps at most HISTORY=256 samples per route', () => {
    const { res } = runThrough();
    for (let i = 0; i < 300; i += 1) {
      (res as Response).emit('finish');
    }
    const snap = snapshotMetrics();
    expect(snap.routes[0].latencySampled).toBe(256);
    expect(snap.routes[0].total).toBe(300);
    void res;
  });

  it('skips /metrics and /health endpoints from tracking', () => {
    const req = makeObj<Request>({ originalUrl: '/metrics' });
    const res = makeObj<Response & { statusCode: number }>({ statusCode: 200 });
    metricsMiddleware(req, res, () => {});
    (res as Response).emit('finish');
    expect(snapshotMetrics().requestsTotal).toBe(0);
  });

  it('percentile math is exact on a known input', () => {
    expect(percentiles([10, 20, 30, 40, 50, 60, 70, 80])).toEqual({ p50: 40, p95: 80 });
    expect(percentiles([])).toEqual({ p50: null, p95: null });
  });

  it('never leaks personal data into the snapshot payload', () => {
    const { res } = runThrough();
    (res as Response & { statusCode: number }).statusCode = 200;
    (res as Response).emit('finish');
    const json = JSON.stringify(snapshotMetrics());
    const forbidden = [
      /picuh@example\.com/i,
      /hunter2/i,
      /bearer secret-token/i,
      /user-123/i,
      /useragent/i,
      /"user-agent"/i,
      /authorization/i,
      /127\.0\.0\.1/i,
      /password/i,
      /"email"/i,
    ];
    for (const pattern of forbidden) {
      expect(json).not.toMatch(pattern);
    }
    // And the snapshot must only contain the whitelisted shape.
    const snap = JSON.parse(json) as Record<string, unknown>;
    expect(Object.keys(snap).sort()).toEqual(['errors5xxTotal', 'requestsTotal', 'routes', 'uptimeSeconds']);
    for (const route of snapshotMetrics().routes) {
      expect(Object.keys(route).sort()).toEqual(['errors5xx', 'latencyMs', 'latencySampled', 'route', 'total']);
      // route label is a template — no concrete IDs
      expect(route.route).not.toMatch(/picuh|user-123/);
    }
  });
});
