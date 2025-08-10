/**
 * Type definitions for the theme generation system
 */

import type { WCAGLevel } from '../theme-generator/accessibility.js';
export type { WCAGLevel };

/**
 * Theme definition - minimal configuration for generating a complete theme
 */
export interface ThemeDefinition {
  /** Unique identifier for the theme */
  id: string;

  /** Display name */
  name: string;

  /** Description of the theme */
  description: string;

  /** Base colors for the theme */
  colors: {
    /** Primary brand color (required) */
    primary: string;

    /** Secondary color (optional - computed if not provided) */
    secondary?: string;

    /** Accent color (optional - computed if not provided) */
    accent?: string;

    /** Neutral color base (optional - derived from primary if not provided) */
    neutral?: string;
  };

  /** Accessibility configuration */
  accessibility: {
    /** Target WCAG compliance level */
    targetLevel: WCAGLevel;

    /** If true, automatically adjust colors to meet target level */
    enforceLevel?: boolean;

    /** Large text can have a lower compliance level */
    largeTextLevel?: WCAGLevel;
  };

  /** Theme configuration options */
  config?: {
    /** Overall saturation adjustment (-100 to 100) */
    saturation?: number;

    /** Temperature adjustment (-100 to 100, negative = cooler, positive = warmer) */
    temperature?: number;

    /** Contrast boost (0 to 100) - increases contrast between elements */
    contrastBoost?: number;
  };
}

/**
 * Color computation types for dynamic color generation
 */
export type ColorComputation =
  | string // Direct hex color
  | ColorReference // Reference to another token
  | ColorFunction; // Computed color

/**
 * Reference to another color token
 */
export interface ColorReference {
  ref: string; // e.g., 'body.text', 'primary.500'
}

/**
 * Computed color using a function
 */
export interface ColorFunction {
  fn: 'contrast' | 'mix' | 'adjust' | 'scale' | 'auto';
  args:
    | ContrastFunctionArgs
    | MixFunctionArgs
    | AdjustFunctionArgs
    | AutoFunctionArgs
    | Record<string, unknown>; // Function-specific arguments
}

/**
 * Contrast function arguments
 */
export interface ContrastFunctionArgs {
  /** Background color to contrast against */
  against: string;

  /** Target WCAG level (uses theme default if not specified) */
  target?: WCAGLevel;

  /** Text size for contrast calculation */
  textSize?: 'normal' | 'large' | 'ui';

  /** Preferred base color */
  prefer?: string | ColorReference;

  /** Adjustment strategy */
  strategy?: 'lighten' | 'darken' | 'auto' | 'vibrant';
}

/**
 * Mix function arguments
 */
export interface MixFunctionArgs {
  /** First color */
  color1: string | ColorReference;

  /** Second color */
  color2: string | ColorReference;

  /** Mix ratio (0 = 100% color1, 1 = 100% color2) */
  ratio: number;
}

/**
 * Adjust function arguments
 */
export interface AdjustFunctionArgs {
  /** Base color to adjust */
  color: string | ColorReference;

  /** Lightness adjustment (-100 to 100) */
  lightness?: number | { light: number; dark: number };

  /** Saturation adjustment (-100 to 100) */
  saturation?: number | { light: number; dark: number };

  /** Hue adjustment (-360 to 360) */
  hue?: number;

  /** Alpha/opacity adjustment (0 to 1) */
  alpha?: number;
}

/**
 * Auto function arguments - different values for light/dark modes
 */
export interface AutoFunctionArgs {
  /** Value for light mode */
  light: string | ColorReference | ColorFunction;

  /** Value for dark mode */
  dark: string | ColorReference | ColorFunction;
}

/**
 * State modifier for interactive states
 */
export interface StateModifier {
  /** Lightness adjustment */
  lightness?: number | { light: number; dark: number };

  /** Saturation adjustment */
  saturation?: number | { light: number; dark: number };

  /** Opacity adjustment */
  opacity?: number;

  /** Mix with another color */
  mix?: {
    color: string;
    ratio: number;
  };
}

/**
 * Gradient definition for a surface
 */
export interface GradientDefinition {
  /** Gradient direction in degrees (default: 135) */
  direction?: number;
  
  /** Gradient stops */
  stops: Array<{
    /** Color at this stop (can reference surface colors) */
    color: ColorComputation | 'transparent';
    /** Position percentage (0-100) */
    position: number;
  }>;
}

/**
 * Surface definition for generating surface-specific tokens
 */
export interface SurfaceDefinition {
  /** Surface name (e.g., 'body', 'panel', 'button') */
  name: string;

  /** Base color properties */
  base: {
    background: ColorComputation;
    text: ColorComputation;
    border: ColorComputation;
    link?: ColorComputation;
    linkVisited?: ColorComputation; // Separate concept from link, not a state
    icon?: ColorComputation;
    textSuccess?: ColorComputation; // Success text color
    textWarning?: ColorComputation; // Warning text color
    textDanger?: ColorComputation; // Danger/error text color
    outline?: ColorComputation; // Focus outline color
    shadow?: string; // CSS shadow value
  };

  /** Gradient definitions for this surface */
  gradients?: {
    primary?: GradientDefinition;
    success?: GradientDefinition;
    warning?: GradientDefinition;
    danger?: GradientDefinition;
    info?: GradientDefinition;
    accent?: GradientDefinition;
    [key: string]: GradientDefinition | undefined; // Allow custom gradient names
  };

  /** Variant generation configuration */
  variants?: {
    /** Soft variations (lighter/less contrast) */
    soft?: number[]; // e.g., [10, 20, 30, 40]

    /** Hard variations (darker/more contrast) */
    hard?: number[]; // e.g., [10, 20]
  };

  /** Interactive state variations */
  states?: {
    hover?: StateModifier;
    active?: StateModifier;
    focus?: StateModifier;
    disabled?: StateModifier;
  };
}

/**
 * Background level system for elevation hierarchy
 */
export interface BackgroundLevels {
  /** Level -2: Deepest recess */
  '-2': { light: string; dark: string };

  /** Level -1: Recessed */
  '-1': { light: string; dark: string };

  /** Level 0: Base surface */
  '0': { light: string; dark: string };

  /** Level +1: Raised */
  '+1': { light: string; dark: string };

  /** Level +2: Elevated */
  '+2': { light: string; dark: string };

  /** Level +3: Floating */
  '+3': { light: string; dark: string };
}

/**
 * Complete color scale definition
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // Base color
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/**
 * Generated theme output
 */
export interface GeneratedTheme {
  /** Theme ID */
  id: string;

  /** Theme name */
  name: string;

  /** Theme description */
  description: string;

  /** Light or dark mode */
  mode: 'light' | 'dark';

  /** Color scales */
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    neutral: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    info: ColorScale;
  };

  /** Surface tokens */
  surfaces: Record<string, SurfaceTokens>;

  /** Special tokens */
  special: {
    selection: { background: string; text: string };
    focus: { ring: string; offset: string };
    overlay: { background: string };
    backdrop: { background: string };
  };

  /** Accessibility info */
  accessibility: {
    level: WCAGLevel;
    enforced: boolean;
    adjustments: Array<{
      token: string;
      original: string;
      adjusted: string;
      reason: string;
    }>;
  };

  /** Metadata */
  metadata: {
    generated: string;
  };
}

/**
 * Generated tokens for a surface
 */
export interface SurfaceTokens {
  background: string;
  backgroundSoft10?: string;
  backgroundSoft20?: string;
  backgroundHard10?: string;
  backgroundHard20?: string;

  text: string;
  textSoft10?: string;
  textSoft20?: string;
  textHard10?: string;
  textHard20?: string;

  border: string;
  borderSoft10?: string;
  borderSoft20?: string;
  borderHard10?: string;
  borderHard20?: string;

  link?: string;
  'link-hover'?: string;
  'link-active'?: string;
  'link-focus'?: string;
  'link-disabled'?: string;

  linkVisited?: string;
  'linkVisited-hover'?: string;
  'linkVisited-active'?: string;
  'linkVisited-focus'?: string;

  icon?: string;
  iconSoft10?: string;
  iconSoft20?: string;
  iconHard10?: string;
  iconHard20?: string;
  'icon-hover'?: string;
  'icon-active'?: string;
  'icon-focus'?: string;
  'icon-disabled'?: string;

  shadow?: string;
  shadowSoft?: string;
  shadowHard?: string;

  // Semantic text concepts
  textSuccess?: string;
  textWarning?: string;
  textDanger?: string;

  // Focus outline
  outline?: string;

  // State variations
  'background-hover'?: string;
  'background-active'?: string;
  'background-focus'?: string;
  'background-disabled'?: string;

  'text-hover'?: string;
  'text-active'?: string;
  'text-focus'?: string;
  'text-disabled'?: string;

  'border-hover'?: string;
  'border-active'?: string;
  'border-focus'?: string;
  'border-disabled'?: string;
}

/**
 * Theme manifest for tracking available themes
 */
export interface ThemeManifest {
  /** Generation timestamp */
  generated: string;

  /** List of available themes */
  themes: Array<{
    id: string;
    name: string;
    description: string;
    accessibility: {
      targetLevel: WCAGLevel;
    };
    files: {
      light: string;
      dark: string;
    };
  }>;

  /** Generation metadata */
  metadata: {
    version: string;
    totalTokens: number;
    surfaces: string[];
  };
}
