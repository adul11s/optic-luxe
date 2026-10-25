/**
 * Structured logging tests — order & inventory log lines must be valid JSON
 * with module tags. Writes to a temp file via a synchronous pino destination,
 * then parses the lines back.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createCaptureLogger, orderLogger, inventoryLogger } from '../core/utils/logger.js';
// (logger root instance is exercised via its children; keep import minimal)

describe('Structured logging (pino, JSON lines)', () => {
  it('default loggers expose module-tagged children for order & inventory', () => {
    expect(orderLogger).toBeTruthy();
    expect(inventoryLogger).toBeTruthy();
    // children keep the service base field
    expect((orderLogger as any).bindings().module).toBe('order');
    expect((inventoryLogger as any).bindings().module).toBe('inventory');
  });

  it('captured log lines are valid JSON with level, module, and event fields', async () => {
    const filePath = path.join(os.tmpdir(), `optic-luxe-log-test-${Date.now()}.jsonl`);
    const dest = await import('pino').then((p) => p.default.destination({ dest: filePath, sync: true }));
    const log = createCaptureLogger(dest, 'order');

    log.info({ event: 'order.created', orderNumber: 'TST-001', totalAmount: 510000 }, 'Order created');
    log.warn({ event: 'order.payment_pending', orderNumber: 'TST-002' }, 'Awaiting payment verification');
    (log as any).flush?.();

    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
    expect(lines.length).toBe(2);

    const first = JSON.parse(lines[0]);
    expect(first.level).toBe(30); // pino info
    expect(first.module).toBe('order');
    expect(first.service).toBe('optic-luxe-server');
    expect(first.event).toBe('order.created');
    expect(first.orderNumber).toBe('TST-001');
    expect(first.msg).toBe('Order created');
    expect(typeof first.time).toBe('string');

    const second = JSON.parse(lines[1]);
    expect(second.level).toBe(40); // pino warn
    expect(second.event).toBe('order.payment_pending');

    fs.unlinkSync(filePath);
  });

  it('inventory logger emits parseable JSON for stock events', async () => {
    const filePath = path.join(os.tmpdir(), `optic-luxe-inventory-log-${Date.now()}.jsonl`);
    const dest = await import('pino').then((p) => p.default.destination({ dest: filePath, sync: true }));
    const log = createCaptureLogger(dest, 'inventory');

    log.info({ event: 'inventory.reserved', variantId: 'v-1', quantity: 2 }, 'Stock reserved');
    (log as any).flush?.();

    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
    const parsed = JSON.parse(lines[0]);
    expect(parsed.module).toBe('inventory');
    expect(parsed.event).toBe('inventory.reserved');
    expect(parsed.variantId).toBe('v-1');

    fs.unlinkSync(filePath);
  });
});
