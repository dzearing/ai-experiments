import { describe, it, expect } from 'vitest';
import { generateLocationKey } from './generateLocationKey';

describe('generateLocationKey', () => {
  it('generates unique keys', () => {
    const key1 = generateLocationKey();
    const key2 = generateLocationKey();
    expect(key1).not.toBe(key2);
  });

  it('generates keys of expected length', () => {
    const key = generateLocationKey();
    expect(key.length).toBe(8);
  });

  it('generates alphanumeric keys', () => {
    const key = generateLocationKey();
    expect(key).toMatch(/^[a-z0-9]+$/);
  });
});
