import { describe, it, expect, vi } from 'vitest';
import { sendSuccess, sendError, sendPaginated } from '../core/utils/response.js';
import type { Response } from 'express';

function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('Response Utils', () => {
  describe('sendSuccess', () => {
    it('should send success response with default status 200', () => {
      const res = createMockResponse();
      sendSuccess(res, { id: 1 }, 'OK');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'OK',
        data: { id: 1 },
      });
    });

    it('should send success response with custom status', () => {
      const res = createMockResponse();
      sendSuccess(res, null, 'Created', 201);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data: null,
      });
    });

    it('should include meta when provided', () => {
      const res = createMockResponse();
      const meta = { total: 100, page: 1, limit: 10, totalPages: 10 };
      sendSuccess(res, [], 'Success', 200, meta);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: [],
        meta,
      });
    });

    it('should not include meta when undefined', () => {
      const res = createMockResponse();
      sendSuccess(res, 'data');

      const call = (res.json as any).mock.calls[0][0];
      expect(call).not.toHaveProperty('meta');
    });
  });

  describe('sendError', () => {
    it('should send error response with default status 500', () => {
      const res = createMockResponse();
      sendError(res, 'Something went wrong');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
      });
    });

    it('should send error response with custom status', () => {
      const res = createMockResponse();
      sendError(res, 'Not found', 404);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not found',
      });
    });

    it('should include error detail when provided', () => {
      const res = createMockResponse();
      sendError(res, 'Validation failed', 400, 'Invalid email');

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        error: 'Invalid email',
      });
    });
  });

  describe('sendPaginated', () => {
    it('should send paginated response with correct meta', () => {
      const res = createMockResponse();
      const data = [{ id: 1 }, { id: 2 }];
      sendPaginated(res, data, 50, 1, 10);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
        meta: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
        },
      });
    });

    it('should calculate totalPages correctly for exact division', () => {
      const res = createMockResponse();
      sendPaginated(res, [], 20, 2, 10);

      const call = (res.json as any).mock.calls[0][0];
      expect(call.meta.totalPages).toBe(2);
    });

    it('should calculate totalPages correctly with remainder', () => {
      const res = createMockResponse();
      sendPaginated(res, [], 25, 1, 10);

      const call = (res.json as any).mock.calls[0][0];
      expect(call.meta.totalPages).toBe(3);
    });
  });
});
