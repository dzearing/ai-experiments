import type { RGB } from './color-types.js';

/**
 * Convert hex color to RGB
 * @param hex - Hex color string (e.g., '#ff0000' or 'ff0000')
 * @returns RGB color object
 * @throws Error if hex color is invalid
 *
 * @example
 * hexToRgb('#ff0000') // { r: 255, g: 0, b: 0 }
 * hexToRgb('00ff00') // { r: 0, g: 255, b: 0 }
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  };
}
