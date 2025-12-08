import type { Color } from './color-types.js';
import { parseColor } from './parseColor.js';
import { rgbToHsl } from './rgbToHsl.js';
import { hslToRgb } from './hslToRgb.js';
import { rgbToHex } from './rgbToHex.js';

/**
 * Generate analogous colors (adjacent on color wheel)
 * @param color - Base color
 * @param angle - Angle offset in degrees (default: 30)
 * @returns Tuple of two analogous colors
 *
 * @example
 * getAnalogous('#ff0000', 30) // ['#ff0080', '#ff8000'] (red -> magenta and orange)
 */
export function getAnalogous(color: Color, angle: number = 30): [string, string] {
  const rgb = parseColor(color);
  const hsl = rgbToHsl(rgb);

  const hsl1 = { ...hsl, h: (hsl.h + angle) % 360 };
  const hsl2 = { ...hsl, h: (hsl.h - angle + 360) % 360 };

  return [rgbToHex(hslToRgb(hsl1)), rgbToHex(hslToRgb(hsl2))];
}
