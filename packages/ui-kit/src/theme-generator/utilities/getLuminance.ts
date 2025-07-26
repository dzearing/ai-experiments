import type { Color } from './color-types.js';
import { parseColor } from './parseColor.js';

/**
 * Calculate relative luminance of a color
 * Used for contrast ratio calculations
 * @param color - Color to calculate luminance for
 * @returns Luminance value between 0 and 1
 *
 * @example
 * getLuminance('#ffffff') // 1
 * getLuminance('#000000') // 0
 * getLuminance('#ff0000') // 0.2126
 */
export function getLuminance(color: Color): number {
  const rgb = parseColor(color);

  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
