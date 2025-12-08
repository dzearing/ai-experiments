/**
 * Theme type definitions
 */

import type { RadiiStyle } from '../tokens/radii';

/**
 * Accessibility level
 */
export type AccessibilityLevel = 'AA' | 'AAA';

/**
 * Theme color definition
 */
export interface ThemeColors {
  /** Primary brand color */
  primary: string;
  /** Secondary color (optional, computed if omitted) */
  secondary?: string;
  /** Accent color (optional, computed if omitted) */
  accent?: string;
  /** Neutral/gray base (optional, derived from primary) */
  neutral?: string;
}

/**
 * Typography configuration
 */
export interface ThemeTypography {
  /** Sans-serif font family */
  fontSans?: string;
  /** Monospace font family */
  fontMono?: string;
  /** Serif font family */
  fontSerif?: string;
  /** Scale multiplier for all font sizes (0.8 = compact, 1.2 = spacious) */
  scale?: number;
  /** Base font size in pixels */
  baseSize?: number;
}

/**
 * Spacing configuration
 */
export interface ThemeSpacing {
  /** Scale multiplier for all spacing */
  scale?: number;
  /** Base spacing unit in pixels */
  baseUnit?: number;
}

/**
 * Border radius configuration
 */
export interface ThemeRadii {
  /** Scale multiplier for all radii */
  scale?: number;
  /** Style preset: 'sharp' (0), 'subtle' (2px), 'rounded' (4px), 'pill' (8px) */
  style?: RadiiStyle;
}

/**
 * Animation configuration
 */
export interface ThemeAnimation {
  /** Scale multiplier for all durations */
  scale?: number;
  /** If true, minimizes animations */
  reduceMotion?: boolean;
}

/**
 * Accessibility configuration
 */
export interface ThemeAccessibility {
  /** Target contrast level */
  level?: AccessibilityLevel;
}

/**
 * Color adjustment configuration
 */
export interface ThemeConfig {
  /** Adjust color saturation (-100 to 100) */
  saturation?: number;
  /** Warm (positive) or cool (negative) shift (-100 to 100) */
  temperature?: number;
  /** Increase contrast between elements (0 to 100) */
  contrastBoost?: number;
}

/**
 * Custom surface definition
 */
export interface CustomSurface {
  /** Background color or gradient */
  background: string;
  /** Text color (auto-computed if omitted) */
  text?: string;
  /** Border color */
  border?: string;
}

/**
 * Token overrides for specific modes
 */
export interface ThemeOverrides {
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

/**
 * Complete theme definition
 */
export interface ThemeDefinition {
  /** Unique theme identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;

  /** Color palette */
  colors: ThemeColors;

  /** Typography settings */
  typography?: ThemeTypography;

  /** Spacing settings */
  spacing?: ThemeSpacing;

  /** Border radius settings */
  radii?: ThemeRadii;

  /** Animation settings */
  animation?: ThemeAnimation;

  /** Accessibility settings */
  accessibility?: ThemeAccessibility;

  /** Color adjustments */
  config?: ThemeConfig;

  /** Custom surfaces */
  surfaces?: Record<string, CustomSurface>;

  /** Direct token overrides */
  overrides?: ThemeOverrides;
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Runtime theme state
 */
export interface ThemeState {
  theme: string;
  mode: ThemeMode;
}

/**
 * Theme manifest entry (for listing available themes)
 */
export interface ThemeManifestEntry {
  id: string;
  name: string;
  description?: string;
  accessibility: AccessibilityLevel;
  hasLight: boolean;
  hasDark: boolean;
}
