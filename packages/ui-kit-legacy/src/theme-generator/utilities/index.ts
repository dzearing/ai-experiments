/**
 * Color utilities for theme generation
 *
 * Re-exports all individual utilities for convenient importing
 */

// Types
export type { RGB, HSL, LAB, LCH, Color } from './color-types.js';

// Core conversions
export { hexToRgb } from './hexToRgb.js';
export { rgbToHex } from './rgbToHex.js';
export { rgbToHsl } from './rgbToHsl.js';
export { hslToRgb } from './hslToRgb.js';
export { rgbToLab } from './rgbToLab.js';
export { labToRgb } from './labToRgb.js';
export { parseColor } from './parseColor.js';

// Color analysis
export { getLuminance } from './getLuminance.js';
export { getContrastRatio } from './getContrastRatio.js';

// Color manipulation
export { lighten } from './lighten.js';
export { darken } from './darken.js';
export { saturate } from './saturate.js';
export { mix } from './mix.js';
export { adjustTemperature } from './adjustTemperature.js';

// Color generation
export { generateScale } from './generateScale.js';
export { getAnalogous } from './getAnalogous.js';
export { getTriadic } from './getTriadic.js';
