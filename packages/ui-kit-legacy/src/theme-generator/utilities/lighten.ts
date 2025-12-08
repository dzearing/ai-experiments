import type { Color } from './color-types.js';
import { parseColor } from './parseColor.js';
import { rgbToHsl } from './rgbToHsl.js';
import { hslToRgb } from './hslToRgb.js';
import { rgbToHex } from './rgbToHex.js';

/**
 * Lighten a color by a given percentage
 * @param color - Color to lighten
 * @param amount - Percentage to lighten (0-100)
 * @returns Lightened color as hex string
 *
 * @example
 * lighten('#ff0000', 20) // '#ff6666'
 * lighten('#000000', 50) // '#808080'
 */
export function lighten(color: Color, amount: number): string {
  // Handle transparent
  if (typeof color === 'string' && color === 'transparent') {
    return 'transparent';
  }

  const rgb = parseColor(color);
  const hsl = rgbToHsl(rgb);

  hsl.l = Math.min(100, hsl.l + amount);

  return rgbToHex(hslToRgb(hsl));
}
