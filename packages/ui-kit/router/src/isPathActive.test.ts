import { describe, it, expect } from 'vitest';
import { isPathActive } from './isPathActive';

describe('isPathActive', () => {
  describe('non-exact matching', () => {
    it('returns true for exact match', () => {
      expect(isPathActive('/dashboard', '/dashboard')).toBe(true);
    });

    it('returns true for prefix match', () => {
      expect(isPathActive('/dashboard/settings', '/dashboard')).toBe(true);
      expect(isPathActive('/users/123/profile', '/users')).toBe(true);
    });

    it('returns false for non-matching paths', () => {
      expect(isPathActive('/settings', '/dashboard')).toBe(false);
      expect(isPathActive('/dashboard-other', '/dashboard')).toBe(false);
    });

    it('handles root path', () => {
      expect(isPathActive('/', '/')).toBe(true);
      expect(isPathActive('/dashboard', '/')).toBe(false);
    });

    it('normalizes trailing slashes', () => {
      expect(isPathActive('/dashboard/', '/dashboard')).toBe(true);
      expect(isPathActive('/dashboard', '/dashboard/')).toBe(true);
    });
  });

  describe('exact matching', () => {
    it('returns true only for exact match', () => {
      expect(isPathActive('/dashboard', '/dashboard', true)).toBe(true);
      expect(isPathActive('/dashboard/settings', '/dashboard', true)).toBe(false);
    });

    it('normalizes trailing slashes for exact match', () => {
      expect(isPathActive('/dashboard/', '/dashboard', true)).toBe(true);
    });
  });
});
