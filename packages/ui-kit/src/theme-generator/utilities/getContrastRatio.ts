import type { Color } from './color-types.js';
import { getLuminance } from './getLuminance.js';

/**
 * Calculate contrast ratio between two colors
 * Returns a value from 1 to 21 (higher is better contrast)
 * @param color1 - First color
 * @param color2 - Second color
 * @returns Contrast ratio
 *
 * @example
 * getContrastRatio('#000000', '#ffffff') // 21
 * getContrastRatio('#000000', '#000000') // 1
 * getContrastRatio('#767676', '#ffffff') // 4.54
 */
export function getContrastRatio(color1: Color, color2: Color): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}
