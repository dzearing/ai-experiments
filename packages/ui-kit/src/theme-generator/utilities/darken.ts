import type { Color } from './color-types.js';
import { parseColor } from './parseColor.js';
import { rgbToHsl } from './rgbToHsl.js';
import { hslToRgb } from './hslToRgb.js';
import { rgbToHex } from './rgbToHex.js';

/**
 * Darken a color by a given percentage
 * @param color - Color to darken
 * @param amount - Percentage to darken (0-100)
 * @returns Darkened color as hex string
 *
 * @example
 * darken('#ff0000', 20) // '#cc0000'
 * darken('#ffffff', 50) // '#808080'
 */
export function darken(color: Color, amount: number): string {
  // Handle transparent
  if (typeof color === 'string' && color === 'transparent') {
    return 'transparent';
  }

  const rgb = parseColor(color);
  const hsl = rgbToHsl(rgb);

  hsl.l = Math.max(0, hsl.l - amount);

  return rgbToHex(hslToRgb(hsl));
}
