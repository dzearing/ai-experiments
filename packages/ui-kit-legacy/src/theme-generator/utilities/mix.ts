import type { Color } from './color-types.js';
import { parseColor } from './parseColor.js';
import { rgbToHex } from './rgbToHex.js';

/**
 * Mix two colors together
 * @param color1 - First color
 * @param color2 - Second color
 * @param ratio - Mix ratio (0 = 100% color1, 1 = 100% color2)
 * @returns Mixed color as hex string
 *
 * @example
 * mix('#ff0000', '#0000ff', 0.5) // '#800080' (purple)
 * mix('#000000', '#ffffff', 0.5) // '#808080' (gray)
 * mix('#ff0000', '#00ff00', 0.25) // '#bf4000' (more red than green)
 */
export function mix(color1: Color, color2: Color, ratio: number = 0.5): string {
  // Handle transparent
  if (typeof color1 === 'string' && color1 === 'transparent') {
    if (typeof color2 === 'string' && color2 === 'transparent') {
      return 'transparent';
    }
    // Mix transparent with a color by using the color with adjusted opacity
    const rgb2 = parseColor(color2);
    return `rgba(${rgb2.r}, ${rgb2.g}, ${rgb2.b}, ${ratio})`;
  }
  if (typeof color2 === 'string' && color2 === 'transparent') {
    const rgb1 = parseColor(color1);
    return `rgba(${rgb1.r}, ${rgb1.g}, ${rgb1.b}, ${1 - ratio})`;
  }

  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  const mixed = {
    r: Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio),
    g: Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio),
    b: Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio),
  };

  return rgbToHex(mixed);
}
