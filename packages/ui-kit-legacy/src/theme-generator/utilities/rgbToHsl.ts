import type { RGB, HSL } from './color-types.js';

/**
 * Convert RGB to HSL
 * @param rgb - RGB color object
 * @returns HSL color object
 *
 * @example
 * rgbToHsl({ r: 255, g: 0, b: 0 }) // { h: 0, s: 100, l: 50 }
 * rgbToHsl({ r: 0, g: 255, b: 0 }) // { h: 120, s: 100, l: 50 }
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / delta + 2) / 6;
        break;
      case b:
        h = ((r - g) / delta + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
