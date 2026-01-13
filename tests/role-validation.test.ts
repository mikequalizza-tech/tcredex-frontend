/**
 * Unit Tests for Role Validation Functions
 * Tests validation helpers from lib/roles/config.ts
 */

import { describe, it, expect } from '@jest/globals';
import { 
  isValidOrgType, 
  isValidAllOrgType, 
  validateOrgType,
  type OrgType,
  type AllOrgTypes 
} from '../lib/roles/config';

describe('Role Validation Functions', () => {
  describe('isValidOrgType', () => {
    it('should return true for valid organization types', () => {
      expect(isValidOrgType('sponsor')).toBe(true);
      expect(isValidOrgType('cde')).toBe(true);
      expect(isValidOrgType('investor')).toBe(true);
    });

    it('should return false for admin type', () => {
      expect(isValidOrgType('admin')).toBe(false);
    });

    it('should return false for invalid types', () => {
      expect(isValidOrgType('invalid')).toBe(false);
      expect(isValidOrgType('')).toBe(false);
      expect(isValidOrgType('SPONSOR')).toBe(false); // Case sensitive
    });

    it('should return false for null, undefined, and non-string values', () => {
      expect(isValidOrgType(null)).toBe(false);
      expect(isValidOrgType(undefined)).toBe(false);
      expect(isValidOrgType(123)).toBe(false);
      expect(isValidOrgType({})).toBe(false);
      expect(isValidOrgType([])).toBe(false);
    });
  });

  describe('isValidAllOrgType', () => {
    it('should return true for all valid organization types including admin', () => {
      expect(isValidAllOrgType('sponsor')).toBe(true);
      expect(isValidAllOrgType('cde')).toBe(true);
      expect(isValidAllOrgType('investor')).toBe(true);
      expect(isValidAllOrgType('admin')).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(isValidAllOrgType('invalid')).toBe(false);
      expect(isValidAllOrgType('')).toBe(false);
      expect(isValidAllOrgType('ADMIN')).toBe(false); // Case sensitive
    });

    it('should return false for null, undefined, and non-string values', () => {
      expect(isValidAllOrgType(null)).toBe(false);
      expect(isValidAllOrgType(undefined)).toBe(false);
      expect(isValidAllOrgType(123)).toBe(false);
      expect(isValidAllOrgType({})).toBe(false);
      expect(isValidAllOrgType([])).toBe(false);
    });
  });

  describe('validateOrgType', () => {
    it('should return the type for valid organization types', () => {
      expect(validateOrgType('sponsor')).toBe('sponsor');
      expect(validateOrgType('cde')).toBe('cde');
      expect(validateOrgType('investor')).toBe('investor');
    });

    it('should throw error for admin type', () => {
      expect(() => validateOrgType('admin')).toThrow('Invalid organization type: admin');
    });

    it('should throw error for invalid types', () => {
      expect(() => validateOrgType('invalid')).toThrow('Invalid organization type: invalid');
      expect(() => validateOrgType('')).toThrow('Invalid organization type: ');
      expect(() => validateOrgType('SPONSOR')).toThrow('Invalid organization type: SPONSOR');
    });

    it('should throw error for null, undefined, and non-string values', () => {
      expect(() => validateOrgType(null)).toThrow('Invalid organization type: null');
      expect(() => validateOrgType(undefined)).toThrow('Invalid organization type: undefined');
      expect(() => validateOrgType(123)).toThrow('Invalid organization type: 123');
      expect(() => validateOrgType({})).toThrow('Invalid organization type: [object Object]');
    });

    it('should have the correct error message format', () => {
      try {
        validateOrgType('test');
        // If we get here, the test failed
        throw new Error('validateOrgType should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Invalid organization type');
        expect((error as Error).message).toContain('Must be sponsor, cde, or investor');
      }
    });
  });

  describe('Type Guards', () => {
    it('isValidOrgType should narrow type correctly', () => {
      const value: unknown = 'sponsor';
      
      if (isValidOrgType(value)) {
        // TypeScript should recognize value as OrgType here
        const typed: OrgType = value;
        expect(typed).toBe('sponsor');
      }
    });

    it('isValidAllOrgType should narrow type correctly', () => {
      const value: unknown = 'admin';
      
      if (isValidAllOrgType(value)) {
        // TypeScript should recognize value as AllOrgTypes here
        const typed: AllOrgTypes = value;
        expect(typed).toBe('admin');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace', () => {
      expect(isValidOrgType(' sponsor ')).toBe(false);
      expect(isValidOrgType('sponsor ')).toBe(false);
      expect(isValidOrgType(' sponsor')).toBe(false);
    });

    it('should handle special characters', () => {
      expect(isValidOrgType('sponsor\n')).toBe(false);
      expect(isValidOrgType('sponsor\t')).toBe(false);
      expect(isValidOrgType('sponsor\0')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isValidOrgType('Sponsor')).toBe(false);
      expect(isValidOrgType('CDE')).toBe(false);
      expect(isValidOrgType('INVESTOR')).toBe(false);
      expect(isValidAllOrgType('Admin')).toBe(false);
    });

    it('should handle similar but invalid strings', () => {
      expect(isValidOrgType('sponsors')).toBe(false);
      expect(isValidOrgType('cdes')).toBe(false);
      expect(isValidOrgType('investors')).toBe(false);
      expect(isValidAllOrgType('admins')).toBe(false);
    });
  });
});
