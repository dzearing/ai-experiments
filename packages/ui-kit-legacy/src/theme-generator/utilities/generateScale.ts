import type { Color } from './color-types.js';
import { parseColor } from './parseColor.js';
import { rgbToHsl } from './rgbToHsl.js';
import { hslToRgb } from './hslToRgb.js';
import { rgbToHex } from './rgbToHex.js';

/**
 * Generate a color scale with perceptually uniform steps
 * Returns an array of colors from lightest to darkest
 * @param baseColor - Base color to generate scale from
 * @param steps - Number of steps in the scale
 * @returns Array of hex color strings
 *
 * @example
 * generateScale('#0078d4', 5) // ['#e6f2ff', '#99ccff', '#0078d4', '#003d6a', '#001f35']
 */
export function generateScale(baseColor: Color, steps: number = 11): string[] {
  const rgb = parseColor(baseColor);
  const hsl = rgbToHsl(rgb);

  const scale: string[] = [];

  // Define lightness values for common scale (50-950)
  const lightnessValues = [95, 90, 85, 75, 65, 55, 45, 35, 25, 15, 8];

  for (let i = 0; i < steps; i++) {
    const targetL = lightnessValues[i] ?? 50; // Default to 50 if undefined

    // Adjust saturation based on lightness to maintain vibrancy
    let targetS = hsl.s;
    if (targetL > 90) {
      targetS *= 0.3; // Very light colors need low saturation
    } else if (targetL > 70) {
      targetS *= 0.6;
    } else if (targetL < 20) {
      targetS *= 0.7; // Very dark colors need reduced saturation
    }

    const newHsl = {
      h: hsl.h,
      s: Math.round(targetS),
      l: targetL,
    };

    scale.push(rgbToHex(hslToRgb(newHsl)));
  }

  return scale;
}
