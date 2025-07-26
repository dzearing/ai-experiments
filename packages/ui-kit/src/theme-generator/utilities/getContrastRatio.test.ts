import { describe, it, expect } from 'vitest';
import { getContrastRatio } from './getContrastRatio.js';

describe('getContrastRatio', () => {
  it('calculates maximum contrast for black and white', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBe(21);
    expect(getContrastRatio('#ffffff', '#000000')).toBe(21);
  });

  it('calculates minimum contrast for identical colors', () => {
    expect(getContrastRatio('#000000', '#000000')).toBe(1);
    expect(getContrastRatio('#ffffff', '#ffffff')).toBe(1);
    expect(getContrastRatio('#ff0000', '#ff0000')).toBe(1);
  });

  it('calculates WCAG AA compliant contrast', () => {
    // #767676 on white is exactly 4.54:1 (AA for large text)
    const ratio = getContrastRatio('#767676', '#ffffff');
    expect(ratio).toBeCloseTo(4.54, 1);
  });

  it('calculates WCAG AAA compliant contrast', () => {
    // #595959 on white is approximately 7:1 (AAA for normal text)
    const ratio = getContrastRatio('#595959', '#ffffff');
    expect(ratio).toBeCloseTo(7, 0);
  });

  it('returns same ratio regardless of color order', () => {
    const ratio1 = getContrastRatio('#333333', '#cccccc');
    const ratio2 = getContrastRatio('#cccccc', '#333333');
    expect(ratio1).toBe(ratio2);
  });

  it('accepts RGB objects', () => {
    expect(getContrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBe(21);
  });
});
