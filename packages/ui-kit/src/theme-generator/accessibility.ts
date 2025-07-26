/**
 * Accessibility utilities for WCAG compliance
 *
 * Ensures all generated color combinations meet
 * Web Content Accessibility Guidelines (WCAG) standards.
 */

import type { Color } from './utilities/color-types.js';
import {
  parseColor,
  getContrastRatio,
  getLuminance,
  lighten,
  darken,
  rgbToHex,
  rgbToLab,
  labToRgb,
  mix,
} from './utilities/index.js';

/**
 * WCAG compliance levels and their requirements
 */
export const WCAG_REQUIREMENTS = {
  AA: {
    normalText: 4.5, // Regular text (< 18pt or < 14pt bold)
    largeText: 3.0, // Large text (>= 18pt or >= 14pt bold)
    ui: 3.0, // UI components and graphics
  },
  AAA: {
    normalText: 7.0,
    largeText: 4.5,
    ui: 4.5,
  },
} as const;

export type WCAGLevel = keyof typeof WCAG_REQUIREMENTS;
export type TextSize = 'normal' | 'large' | 'ui';

/**
 * Color adjustment strategies for meeting contrast requirements
 */
export type AdjustmentStrategy = 'lighten' | 'darken' | 'auto' | 'vibrant';

/**
 * Check if two colors meet WCAG contrast requirements
 */
export function meetsContrast(
  foreground: Color,
  background: Color,
  level: WCAGLevel = 'AA',
  textSize: TextSize = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const textSizeKey = textSize === 'large' ? 'largeText' : textSize === 'ui' ? 'ui' : 'normalText';
  const required = WCAG_REQUIREMENTS[level][textSizeKey];

  return ratio >= required;
}

/**
 * Get the required contrast ratio for given parameters
 */
export function getRequiredContrast(
  level: WCAGLevel = 'AA',
  textSize: TextSize = 'normal'
): number {
  const textSizeKey = textSize === 'large' ? 'largeText' : textSize === 'ui' ? 'ui' : 'normalText';
  return WCAG_REQUIREMENTS[level][textSizeKey];
}

/**
 * Determine the best adjustment strategy based on background luminance
 */
function determineStrategy(background: Color): 'lighten' | 'darken' {
  const luminance = getLuminance(background);
  // If background is dark (luminance < 0.5), lighten the foreground
  // If background is light (luminance >= 0.5), darken the foreground
  return luminance < 0.5 ? 'lighten' : 'darken';
}

/**
 * Adjust color to meet contrast requirements
 * Returns the adjusted color that meets the target contrast ratio
 */
export function adjustForContrast(
  foreground: Color,
  background: Color,
  targetRatio: number,
  strategy: AdjustmentStrategy = 'auto',
  maxIterations: number = 50
): string {
  // Check if already meets contrast
  const currentRatio = getContrastRatio(foreground, background);
  if (currentRatio >= targetRatio) {
    return typeof foreground === 'string' ? foreground : rgbToHex(parseColor(foreground));
  }

  // Determine adjustment direction
  const adjustmentDirection =
    strategy === 'auto'
      ? determineStrategy(background)
      : strategy === 'vibrant'
        ? determineStrategy(background)
        : strategy;

  if (strategy === 'vibrant') {
    // Try to maintain color vibrancy while meeting contrast
    return adjustVibrant(foreground, background, targetRatio, adjustmentDirection);
  }

  // Binary search for the right adjustment
  let low = 0;
  let high = 100;
  let bestColor = typeof foreground === 'string' ? foreground : rgbToHex(parseColor(foreground));
  let bestRatio = currentRatio;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const adjusted =
      adjustmentDirection === 'lighten' ? lighten(foreground, mid) : darken(foreground, mid);

    const ratio = getContrastRatio(adjusted, background);

    if (Math.abs(ratio - targetRatio) < 0.1) {
      return adjusted;
    }

    if (ratio < targetRatio) {
      low = mid;
    } else {
      high = mid;
      if (ratio >= targetRatio && ratio < bestRatio) {
        bestColor = adjusted;
        bestRatio = ratio;
      }
    }
  }

  return bestColor;
}

/**
 * Adjust color while trying to maintain vibrancy
 * Uses LAB color space to adjust lightness while preserving chroma
 */
function adjustVibrant(
  foreground: Color,
  background: Color,
  targetRatio: number,
  direction: 'lighten' | 'darken'
): string {
  const rgb = parseColor(foreground);
  const lab = rgbToLab(rgb);
  const bgLuminance = getLuminance(background);

  // Try adjusting in LAB space first
  let bestColor = rgbToHex(rgb);
  let bestRatio = getContrastRatio(foreground, background);

  // Adjust lightness in steps
  const step = direction === 'lighten' ? 2 : -2;
  const limit = direction === 'lighten' ? 95 : 5;

  let l = lab.l;
  while (direction === 'lighten' ? l <= limit : l >= limit) {
    l += step;
    const newLab = { ...lab, l };
    const newRgb = labToRgb(newLab);
    const newHex = rgbToHex(newRgb);
    const ratio = getContrastRatio(newHex, background);

    if (ratio >= targetRatio) {
      return newHex;
    }

    if (ratio > bestRatio) {
      bestColor = newHex;
      bestRatio = ratio;
    }
  }

  // If we couldn't meet the target while maintaining chroma,
  // fall back to mixing with white/black
  const mixTarget = bgLuminance < 0.5 ? '#ffffff' : '#000000';
  for (let i = 0.1; i <= 1; i += 0.1) {
    const mixed = mix(foreground, mixTarget, i);
    const ratio = getContrastRatio(mixed, background);

    if (ratio >= targetRatio) {
      return mixed;
    }
  }

  return bestColor;
}

/**
 * Find the best text color for a given background
 * Considers multiple options and picks the one with best contrast
 */
export function findBestTextColor(
  background: Color,
  options: Color[],
  level: WCAGLevel = 'AA',
  textSize: TextSize = 'normal'
): string | null {
  const requiredRatio = getRequiredContrast(level, textSize);
  let bestColor: string | null = null;
  let bestRatio = 0;

  for (const option of options) {
    const ratio = getContrastRatio(option, background);

    if (ratio >= requiredRatio && ratio > bestRatio) {
      bestColor = typeof option === 'string' ? option : rgbToHex(parseColor(option));
      bestRatio = ratio;
    }
  }

  return bestColor;
}

/**
 * Generate a text color that meets contrast requirements
 * Tries preferred color first, then adjusts if needed
 */
export function generateTextColor(
  background: Color,
  preferred: Color = '#000000',
  level: WCAGLevel = 'AA',
  textSize: TextSize = 'normal'
): string {
  const requiredRatio = getRequiredContrast(level, textSize);

  // Check if preferred color already works
  if (meetsContrast(preferred, background, level, textSize)) {
    return typeof preferred === 'string' ? preferred : rgbToHex(parseColor(preferred));
  }

  // Try to adjust the preferred color
  return adjustForContrast(preferred, background, requiredRatio, 'auto');
}

/**
 * Color blindness simulation types
 */
export type ColorBlindnessType =
  | 'protanopia' // Red-blind
  | 'deuteranopia' // Green-blind
  | 'tritanopia' // Blue-blind
  | 'protanomaly' // Red-weak
  | 'deuteranomaly' // Green-weak
  | 'tritanomaly'; // Blue-weak

/**
 * Simulate how a color appears to someone with color blindness
 * Based on research by Brettel, Viénot and Mollon
 */
export function simulateColorBlindness(color: Color, type: ColorBlindnessType): string {
  const rgb = parseColor(color);
  const { r, g, b } = rgb;

  // Normalize to 0-1
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;

  let newR: number, newG: number, newB: number;

  switch (type) {
    case 'protanopia': // No red cones
      newR = 0.567 * R + 0.433 * G;
      newG = 0.558 * R + 0.442 * G;
      newB = 0.242 * G + 0.758 * B;
      break;

    case 'deuteranopia': // No green cones
      newR = 0.625 * R + 0.375 * G;
      newG = 0.7 * R + 0.3 * G;
      newB = 0.3 * G + 0.7 * B;
      break;

    case 'tritanopia': // No blue cones
      newR = 0.95 * R + 0.05 * G;
      newG = 0.433 * G + 0.567 * B;
      newB = 0.475 * G + 0.525 * B;
      break;

    case 'protanomaly': // Weak red
      newR = 0.817 * R + 0.183 * G;
      newG = 0.333 * R + 0.667 * G;
      newB = 0.125 * G + 0.875 * B;
      break;

    case 'deuteranomaly': // Weak green
      newR = 0.8 * R + 0.2 * G;
      newG = 0.258 * R + 0.742 * G;
      newB = 0.142 * G + 0.858 * B;
      break;

    case 'tritanomaly': // Weak blue
      newR = 0.967 * R + 0.033 * G;
      newG = 0.183 * G + 0.817 * B;
      newB = 0.183 * G + 0.817 * B;
      break;

    default:
      newR = R;
      newG = G;
      newB = B;
  }

  return rgbToHex({
    r: Math.round(Math.max(0, Math.min(255, newR * 255))),
    g: Math.round(Math.max(0, Math.min(255, newG * 255))),
    b: Math.round(Math.max(0, Math.min(255, newB * 255))),
  });
}

/**
 * Check if two colors are distinguishable for color blind users
 * Colors should have sufficient contrast even when simulated
 */
export function isColorBlindSafe(color1: Color, color2: Color, minContrast: number = 3.0): boolean {
  const types: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia'];

  for (const type of types) {
    const sim1 = simulateColorBlindness(color1, type);
    const sim2 = simulateColorBlindness(color2, type);
    const contrast = getContrastRatio(sim1, sim2);

    if (contrast < minContrast) {
      return false;
    }
  }

  return true;
}

/**
 * Validate a color palette for accessibility
 * Returns detailed report of contrast ratios and issues
 */
export interface AccessibilityReport {
  level: WCAGLevel;
  passes: boolean;
  issues: Array<{
    foreground: string;
    background: string;
    usage: string;
    currentRatio: number;
    requiredRatio: number;
    suggestion?: string;
  }>;
  colorBlindness: {
    safe: boolean;
    issues: Array<{
      color1: string;
      color2: string;
      type: ColorBlindnessType;
      contrast: number;
    }>;
  };
}

export function validatePalette(
  palette: Record<string, string>,
  usagePairs: Array<{
    foreground: string;
    background: string;
    textSize?: TextSize;
    usage: string;
  }>,
  level: WCAGLevel = 'AA'
): AccessibilityReport {
  const issues: AccessibilityReport['issues'] = [];
  const colorBlindnessIssues: AccessibilityReport['colorBlindness']['issues'] = [];

  // Check each usage pair
  for (const pair of usagePairs) {
    const fg = palette[pair.foreground];
    const bg = palette[pair.background];

    if (!fg || !bg) {
      continue;
    }

    const textSize = pair.textSize || 'normal';
    const requiredRatio = getRequiredContrast(level, textSize);
    const currentRatio = getContrastRatio(fg, bg);

    if (currentRatio < requiredRatio) {
      const suggestion = adjustForContrast(fg, bg, requiredRatio);

      issues.push({
        foreground: pair.foreground,
        background: pair.background,
        usage: pair.usage,
        currentRatio,
        requiredRatio,
        suggestion,
      });
    }
  }

  // Check color blindness safety for key color pairs
  const keyColors = Object.entries(palette)
    .filter(([key]) => key.includes('primary') || key.includes('accent'))
    .map(([, value]) => value);

  for (let i = 0; i < keyColors.length; i++) {
    for (let j = i + 1; j < keyColors.length; j++) {
      const color1 = keyColors[i];
      const color2 = keyColors[j];
      if (color1 && color2 && !isColorBlindSafe(color1, color2)) {
        const types: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia'];

        for (const type of types) {
          const sim1 = simulateColorBlindness(color1, type);
          const sim2 = simulateColorBlindness(color2, type);
          const contrast = getContrastRatio(sim1, sim2);

          if (contrast < 3.0) {
            colorBlindnessIssues.push({
              color1: color1,
              color2: color2,
              type,
              contrast,
            });
          }
        }
      }
    }
  }

  return {
    level,
    passes: issues.length === 0,
    issues,
    colorBlindness: {
      safe: colorBlindnessIssues.length === 0,
      issues: colorBlindnessIssues,
    },
  };
}
