import type { LAB, RGB } from './color-types.js';

/**
 * Convert LAB to RGB color space
 * @param lab - LAB color object
 * @returns RGB color object
 */
export function labToRgb(lab: LAB): RGB {
  // Convert LAB to XYZ
  const fy = (lab.l + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const x = 0.95047 * (fx * fx * fx > 0.008856 ? fx * fx * fx : (fx - 16 / 116) / 7.787);
  const y = 1.0 * (fy * fy * fy > 0.008856 ? fy * fy * fy : (fy - 16 / 116) / 7.787);
  const z = 1.08883 * (fz * fz * fz > 0.008856 ? fz * fz * fz : (fz - 16 / 116) / 7.787);

  // Convert XYZ to RGB
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  // Apply inverse gamma correction
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  return {
    r: Math.round(Math.max(0, Math.min(255, r * 255))),
    g: Math.round(Math.max(0, Math.min(255, g * 255))),
    b: Math.round(Math.max(0, Math.min(255, b * 255))),
  };
}
