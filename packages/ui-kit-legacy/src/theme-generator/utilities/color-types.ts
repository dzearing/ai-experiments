/**
 * Color type definitions for theme generation
 */

/**
 * RGB color representation
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * HSL color representation
 */
export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/**
 * LAB color representation
 */
export interface LAB {
  l: number; // 0-100 (lightness)
  a: number; // -128 to 127 (green to red)
  b: number; // -128 to 127 (blue to yellow)
}

/**
 * LCH color representation (cylindrical form of LAB)
 */
export interface LCH {
  l: number; // 0-100 (lightness)
  c: number; // 0-150 (chroma/saturation)
  h: number; // 0-360 (hue)
}

/**
 * Color can be a hex string or RGB object
 */
export type Color = string | RGB;
