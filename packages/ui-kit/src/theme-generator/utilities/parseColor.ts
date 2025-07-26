import type { RGB, Color } from './color-types.js';
import { hexToRgb } from './hexToRgb.js';
import { hslToRgb } from './hslToRgb.js';

/**
 * Parse a color into RGB format
 * Accepts hex strings, rgb() strings, hsl() strings, or RGB objects
 * @param color - Color in various formats
 * @returns RGB color object
 *
 * @example
 * parseColor('#ff0000') // { r: 255, g: 0, b: 0 }
 * parseColor({ r: 255, g: 0, b: 0 }) // { r: 255, g: 0, b: 0 }
 * parseColor('rgb(255, 0, 0)') // { r: 255, g: 0, b: 0 }
 * parseColor('hsl(0, 100%, 50%)') // { r: 255, g: 0, b: 0 }
 */
export function parseColor(color: Color): RGB {
  if (typeof color === 'object') {
    return color;
  }

  // Handle transparent
  if (color === 'transparent') {
    return { r: 0, g: 0, b: 0 };
  }

  // Try hex format
  if (color.startsWith('#') || /^[a-fA-F0-9]{6}$/.test(color)) {
    return hexToRgb(color);
  }

  // Try rgb() format
  const rgbMatch = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]!, 10),
      g: parseInt(rgbMatch[2]!, 10),
      b: parseInt(rgbMatch[3]!, 10),
    };
  }

  // Try hsl() format
  const hslMatch = color.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]!);
    const s = parseFloat(hslMatch[2]!);
    const l = parseFloat(hslMatch[3]!);
    return hslToRgb({ h, s, l });
  }

  // Try rgba() format
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]!, 10),
      g: parseInt(rgbaMatch[2]!, 10),
      b: parseInt(rgbaMatch[3]!, 10),
    };
  }

  // Try hsla() format
  const hslaMatch = color.match(/hsla\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)\)/);
  if (hslaMatch) {
    const h = parseFloat(hslaMatch[1]!);
    const s = parseFloat(hslaMatch[2]!);
    const l = parseFloat(hslaMatch[3]!);
    return hslToRgb({ h, s, l });
  }

  throw new Error(`Unsupported color format: ${color}`);
}
