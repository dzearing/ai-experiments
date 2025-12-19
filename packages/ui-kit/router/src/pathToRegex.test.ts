import { describe, it, expect } from 'vitest';
import { pathToRegex } from './pathToRegex';

describe('pathToRegex', () => {
  it('converts static paths to regex', () => {
    const { regex, paramNames } = pathToRegex('/dashboard');
    expect(regex.test('/dashboard')).toBe(true);
    expect(regex.test('/dashboard/')).toBe(false);
    expect(regex.test('/dashboard/settings')).toBe(false);
    expect(paramNames).toEqual([]);
  });

  it('handles root path', () => {
    const { regex } = pathToRegex('/');
    expect(regex.test('/')).toBe(true);
    expect(regex.test('/dashboard')).toBe(false);
  });

  it('extracts dynamic segments', () => {
    const { regex, paramNames } = pathToRegex('/users/:userId');
    expect(regex.test('/users/123')).toBe(true);
    expect(regex.test('/users/abc')).toBe(true);
    expect(regex.test('/users/')).toBe(false);
    expect(regex.test('/users')).toBe(false);
    expect(paramNames).toEqual(['userId']);
  });

  it('handles multiple dynamic segments', () => {
    const { regex, paramNames } = pathToRegex('/workspace/:workspaceId/doc/:docId');
    expect(regex.test('/workspace/abc/doc/123')).toBe(true);
    expect(regex.test('/workspace/abc/doc/')).toBe(false);
    expect(paramNames).toEqual(['workspaceId', 'docId']);
  });

  it('handles wildcard patterns', () => {
    const { regex } = pathToRegex('/files/*');
    expect(regex.test('/files/')).toBe(true);
    expect(regex.test('/files/a')).toBe(true);
    expect(regex.test('/files/a/b/c')).toBe(true);
  });

  it('handles catch-all wildcard', () => {
    const { regex } = pathToRegex('*');
    expect(regex.test('/')).toBe(true);
    expect(regex.test('/anything')).toBe(true);
    expect(regex.test('/any/nested/path')).toBe(true);
  });

  it('escapes special regex characters', () => {
    const { regex } = pathToRegex('/path.with.dots');
    expect(regex.test('/path.with.dots')).toBe(true);
    expect(regex.test('/pathXwithXdots')).toBe(false);
  });
});
