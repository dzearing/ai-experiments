import type { Color } from './color-types.js';
import { parseColor } from './parseColor.js';
import { rgbToHex } from './rgbToHex.js';

/**
 * Adjust color temperature (warmer/cooler)
 * @param color - Color to adjust
 * @param amount - Amount to adjust (-100 to 100, negative = cooler, positive = warmer)
 * @returns Adjusted color as hex string
 *
 * @example
 * adjustTemperature('#808080', 20) // Warmer gray
 * adjustTemperature('#808080', -20) // Cooler gray
 */
export function adjustTemperature(color: Color, amount: number): string {
  const rgb = parseColor(color);

  // Simplified temperature adjustment
  // Warm: increase red, decrease blue
  // Cool: decrease red, increase blue
  const factor = amount / 100;

  const adjusted = {
    r: Math.round(Math.max(0, Math.min(255, rgb.r + (255 - rgb.r) * factor * 0.3))),
    g: rgb.g,
    b: Math.round(Math.max(0, Math.min(255, rgb.b - rgb.b * factor * 0.3))),
  };

  return rgbToHex(adjusted);
}
