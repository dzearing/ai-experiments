import type { Color } from './color-types.js';
import { parseColor } from './parseColor.js';
import { rgbToHsl } from './rgbToHsl.js';
import { hslToRgb } from './hslToRgb.js';
import { rgbToHex } from './rgbToHex.js';

/**
 * Generate triadic colors (120 degrees apart on color wheel)
 * @param color - Base color
 * @returns Tuple of two triadic colors
 *
 * @example
 * getTriadic('#ff0000') // ['#00ff00', '#0000ff'] (red -> green and blue)
 */
export function getTriadic(color: Color): [string, string] {
  const rgb = parseColor(color);
  const hsl = rgbToHsl(rgb);

  const hsl1 = { ...hsl, h: (hsl.h + 120) % 360 };
  const hsl2 = { ...hsl, h: (hsl.h + 240) % 360 };

  return [rgbToHex(hslToRgb(hsl1)), rgbToHex(hslToRgb(hsl2))];
}
