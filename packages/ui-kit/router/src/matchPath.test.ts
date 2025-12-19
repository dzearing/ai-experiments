import { describe, it, expect } from 'vitest';
import { matchPath } from './matchPath';

describe('matchPath', () => {
  it('returns null for non-matching paths', () => {
    expect(matchPath('/dashboard', '/settings')).toBeNull();
    expect(matchPath('/users/:id', '/posts/123')).toBeNull();
  });

  it('returns match object for matching static paths', () => {
    const match = matchPath('/dashboard', '/dashboard');
    expect(match).not.toBeNull();
    expect(match?.pattern).toBe('/dashboard');
    expect(match?.pathname).toBe('/dashboard');
    expect(match?.params).toEqual({});
  });

  it('extracts params from dynamic segments', () => {
    const match = matchPath('/users/:userId', '/users/456');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({ userId: '456' });
  });

  it('extracts multiple params', () => {
    const match = matchPath('/org/:orgId/team/:teamId', '/org/acme/team/dev');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({ orgId: 'acme', teamId: 'dev' });
  });

  it('handles URL-encoded params', () => {
    const match = matchPath('/search/:query', '/search/hello%20world');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({ query: 'hello%20world' });
  });

  it('matches root path', () => {
    const match = matchPath('/', '/');
    expect(match).not.toBeNull();
    expect(match?.params).toEqual({});
  });
});
