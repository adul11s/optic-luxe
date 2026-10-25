import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken, getJwtSecret } from '../core/utils/jwt.js';

describe('JWT Utils', () => {
  const testPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'ADMIN',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token string', () => {
      const token = generateToken(testPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(testPayload);
      const token2 = generateToken({ ...testPayload, userId: 'user-456' });
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should decode a valid token', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw for an invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw for a token signed with wrong secret', () => {
      const jwt = require('jsonwebtoken');
      const wrongToken = jwt.sign(testPayload, 'wrong-secret');
      expect(() => verifyToken(wrongToken)).toThrow();
    });
  });

  describe('fail-fast secret handling', () => {
    it('should throw when JWT_SECRET is not set', () => {
      const original = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      try {
        expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/);
        expect(() => generateToken(testPayload)).toThrow(/JWT_SECRET is not set/);
      } finally {
        process.env.JWT_SECRET = original;
      }
    });

    it('should treat whitespace-only JWT_SECRET as missing', () => {
      const original = process.env.JWT_SECRET;
      process.env.JWT_SECRET = '   ';
      try {
        expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/);
      } finally {
        process.env.JWT_SECRET = original;
      }
    });
  });
});
