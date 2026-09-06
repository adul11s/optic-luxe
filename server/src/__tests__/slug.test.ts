import { describe, it, expect } from 'vitest';
import { generateSlug, generateOrderNumber, generateInvoiceNumber } from '../core/utils/slug.js';

describe('Slug Utils', () => {
  describe('generateSlug', () => {
    it('should convert text to lowercase slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Ray-Ban® Classic')).toBe('ray-ban-classic');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('  Too   Many   Spaces  ')).toBe('-too-many-spaces-');
    });

    it('should handle underscores as spaces', () => {
      expect(generateSlug('underscores_here')).toBe('underscores-here');
    });

    it('should collapse multiple hyphens', () => {
      expect(generateSlug('already---hyphenated')).toBe('already-hyphenated');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate order number in ORD-YYMMDD-XXXX format', () => {
      const orderNum = generateOrderNumber();
      expect(orderNum).toMatch(/^ORD-\d{6}-[A-Z0-9]{4}$/);
    });

    it('should generate unique order numbers', () => {
      const nums = new Set(Array.from({ length: 100 }, () => generateOrderNumber()));
      expect(nums.size).toBe(100);
    });
  });

  describe('generateInvoiceNumber', () => {
    it('should generate invoice number in INV-YYMMDD-XXXX format', () => {
      const invoiceNum = generateInvoiceNumber();
      expect(invoiceNum).toMatch(/^INV-\d{6}-[A-Z0-9]{4}$/);
    });

    it('should generate unique invoice numbers', () => {
      const nums = new Set(Array.from({ length: 100 }, () => generateInvoiceNumber()));
      expect(nums.size).toBe(100);
    });
  });
});
