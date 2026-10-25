import { Request, Response, NextFunction } from 'express';

// ── In-process metrics (no external deps) ────────────────────────────────────
// Counters per route + a fixed-size ring buffer of request latencies per route.
// Designed to be honest about its scope:
//   - single-process only (Map-backed, same trade-off as the rate limiter);
//   - snapshots contain NO personal data: route template, method, status
//     class, duration. Never request bodies, headers, IPs or user ids.
// If the server is scaled horizontally, replace the Map with Prometheus/OTel.

interface RouteStats {
  total: number;
  errors5xx: number;
  /** Ring buffer of recent request durations (ms), oldest is overwritten. */
  durations: number[];
  /** Next write index in the ring buffer. */
  head: number;
}

const HISTORY = 256;

const store = new Map<string, RouteStats>();

const START = performance.now();

function routeKeyOf(req: Request): string {
  // Route TEMPLATE only (e.g. "/api/products/:id") — never the concrete URL,
  // so real IDs/usernames can't leak into metrics.
  if (req.route) {
    const base = (req.baseUrl || '').replace(/\/+$/, '');
    return `${req.method} ${base}${req.route.path}`;
  }
  return `${req.method} unmatched`;
}

function percentiles(durations: number[]): { p50: number | null; p95: number | null } {
  if (durations.length === 0) return { p50: null, p95: null };
  const sorted = [...durations].sort((a, b) => a - b);
  const pick = (p: number) => sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)];
  return { p50: pick(0.5), p95: pick(0.95) };
}

export { percentiles };

export interface RouteSnapshot {
  route: string;
  total: number;
  errors5xx: number;
  /** Latency percentiles in ms over the ring-buffered samples. */
  latencyMs: { p50: number | null; p95: number | null };
  /** How many samples the percentiles were computed over (≤ 256 ring buffer). */
  latencySampled: number;
}

export interface MetricsSnapshot {
  uptimeSeconds: number;
  requestsTotal: number;
  errors5xxTotal: number;
  routes: RouteSnapshot[];
}

export function snapshotMetrics(): MetricsSnapshot {
  let requestsTotal = 0;
  let errors5xxTotal = 0;
  const routes: RouteSnapshot[] = [];
  for (const [key, stats] of store) {
    const sorted = [...stats.durations].sort((a, b) => a - b);
    const pick = (p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1)] : null);
    routes.push({
      route: key,
      total: stats.total,
      errors5xx: stats.errors5xx,
      latencyMs: { p50: pick(0.5), p95: pick(0.95) },
      latencySampled: stats.durations.length,
    });
    requestsTotal += stats.total;
    errors5xxTotal += stats.errors5xx;
  }
  routes.sort((a, b) => a.route.localeCompare(b.route));
  return {
    uptimeSeconds: Math.round((performance.now() - START) / 1000),
    requestsTotal,
    errors5xxTotal,
    routes,
  };
}

/** Test helper: clear all tracked routes. */
export function resetMetricsStore(): void {
  store.clear();
}

// ── Express middleware ───────────────────────────────────────────────────────

const SKIP_LABELS = ['/metrics', '/health'];

/**
 * Records request counters + latency into the in-process metrics store.
 * Must be mounted BEFORE the routers so the res 'finish' handler sees the
 * matched route template (req.route is undefined before `next()`).
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl.split('?')[0];
  if (SKIP_LABELS.some((l) => path === l || path.startsWith(l + '/'))) {
    next();
    return;
  }
  const startAt = performance.now();
  res.on('finish', () => {
    try {
      const routeKey = routeKeyOf(req);
      let stats = store.get(routeKey);
      if (!stats) {
        stats = { total: 0, errors5xx: 0, durations: [], head: 0 };
        store.set(routeKey, stats);
      }
      stats.total += 1;
      if (res.statusCode >= 500) stats.errors5xx += 1;
      const durationMs = Math.round(performance.now() - startAt);
      if (stats.durations.length < HISTORY) {
        stats.durations.push(durationMs);
      } else {
        stats.durations[stats.head] = durationMs;
        stats.head = (stats.head + 1) % HISTORY;
      }
    } catch {
      // Metrics must never take the request path down with them.
    }
  });
  next();
}
