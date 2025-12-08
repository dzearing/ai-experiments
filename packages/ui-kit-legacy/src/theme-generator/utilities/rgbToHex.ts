import type { RGB } from './color-types.js';

/**
 * Convert RGB color to hex
 * @param rgb - RGB color object
 * @returns Hex color string (e.g., '#ff0000')
 *
 * @example
 * rgbToHex({ r: 255, g: 0, b: 0 }) // '#ff0000'
 * rgbToHex({ r: 0, g: 255, b: 0 }) // '#00ff00'
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}
