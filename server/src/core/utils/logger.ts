import pino from 'pino';

// ── Structured JSON logging (pino) ───────────────────────────────────────────
// Every line is one JSON object: { level, time, module, event, ... }.
// Set LOG_LEVEL (default "info"); in production pipe stdout to Loki/Datadog/etc.

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'optic-luxe-server' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const orderLogger = logger.child({ module: 'order' });
export const inventoryLogger = logger.child({ module: 'inventory' });
export const auditLogger = logger.child({ module: 'audit' });

/**
 * Build a logger that writes structured JSON into an arbitrary stream.
 * Used by tests to capture log output, and useful for piping log lines
 * into in-memory buffers or testing transports.
 */
export function createCaptureLogger(dest: pino.DestinationStream, module: string): pino.Logger {
  return pino(
    { level: 'info', base: { service: 'optic-luxe-server', module }, timestamp: pino.stdTimeFunctions.isoTime },
    dest,
  );
}
