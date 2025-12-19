import { describe, it, expect } from 'vitest';
import { parseUrl } from './parseUrl';

describe('parseUrl', () => {
  it('parses pathname', () => {
    const { pathname, search, hash } = parseUrl('/dashboard');
    expect(pathname).toBe('/dashboard');
    expect(search).toBe('');
    expect(hash).toBe('');
  });

  it('parses search params', () => {
    const { pathname, search, hash } = parseUrl('/search?q=test&page=1');
    expect(pathname).toBe('/search');
    expect(search).toBe('?q=test&page=1');
    expect(hash).toBe('');
  });

  it('parses hash', () => {
    const { pathname, search, hash } = parseUrl('/docs#section-1');
    expect(pathname).toBe('/docs');
    expect(search).toBe('');
    expect(hash).toBe('#section-1');
  });

  it('parses all components', () => {
    const { pathname, search, hash } = parseUrl('/page?foo=bar#anchor');
    expect(pathname).toBe('/page');
    expect(search).toBe('?foo=bar');
    expect(hash).toBe('#anchor');
  });

  it('handles root path', () => {
    const { pathname } = parseUrl('/');
    expect(pathname).toBe('/');
  });

  it('handles complex paths', () => {
    const { pathname, search } = parseUrl('/workspace/123/doc/456?edit=true');
    expect(pathname).toBe('/workspace/123/doc/456');
    expect(search).toBe('?edit=true');
  });
});
