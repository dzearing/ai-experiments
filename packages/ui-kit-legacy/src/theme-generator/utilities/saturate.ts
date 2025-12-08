import type { Color } from './color-types.js';
import { parseColor } from './parseColor.js';
import { rgbToHsl } from './rgbToHsl.js';
import { hslToRgb } from './hslToRgb.js';
import { rgbToHex } from './rgbToHex.js';

/**
 * Adjust saturation of a color
 * @param color - Color to adjust
 * @param amount - Amount to adjust (-100 to 100, negative desaturates)
 * @returns Adjusted color as hex string
 *
 * @example
 * saturate('#ff0000', 20) // More saturated red
 * saturate('#ff0000', -50) // Desaturated red
 * saturate('#808080', 100) // Gray stays gray (no hue to saturate)
 */
export function saturate(color: Color, amount: number): string {
  // Handle transparent
  if (typeof color === 'string' && color === 'transparent') {
    return 'transparent';
  }

  const rgb = parseColor(color);
  const hsl = rgbToHsl(rgb);

  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));

  return rgbToHex(hslToRgb(hsl));
}
