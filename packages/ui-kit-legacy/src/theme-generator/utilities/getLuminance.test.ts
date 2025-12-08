import { describe, it, expect } from 'vitest';
import { getLuminance } from './getLuminance.js';

describe('getLuminance', () => {
  it('calculates luminance for black and white', () => {
    expect(getLuminance('#000000')).toBe(0);
    expect(getLuminance('#ffffff')).toBe(1);
  });

  it('calculates luminance for primary colors', () => {
    // Red has lower luminance than green which has lower than blue
    const redLum = getLuminance('#ff0000');
    const greenLum = getLuminance('#00ff00');
    const blueLum = getLuminance('#0000ff');

    expect(redLum).toBeCloseTo(0.2126, 4);
    expect(greenLum).toBeCloseTo(0.7152, 4);
    expect(blueLum).toBeCloseTo(0.0722, 4);

    expect(greenLum).toBeGreaterThan(redLum);
    expect(redLum).toBeGreaterThan(blueLum);
  });

  it('calculates luminance for gray colors', () => {
    const gray50 = getLuminance('#808080');
    expect(gray50).toBeCloseTo(0.2159, 3);

    // Lighter grays have higher luminance
    const gray25 = getLuminance('#404040');
    const gray75 = getLuminance('#c0c0c0');

    expect(gray75).toBeGreaterThan(gray50);
    expect(gray50).toBeGreaterThan(gray25);
  });

  it('accepts RGB objects', () => {
    expect(getLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(getLuminance({ r: 255, g: 255, b: 255 })).toBe(1);
  });
});
