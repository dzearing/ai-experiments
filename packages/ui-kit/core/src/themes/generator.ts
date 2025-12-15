/**
 * Theme generator - Data-driven from theme-rules.json
 *
 * Compiles theme definitions into complete CSS with all surface tokens.
 * All color relationships and derivation rules are read from the rules configuration.
 */

import type { ThemeDefinition } from './types';
import {
  containerRoles,
  feedbackRoles,
  tonalSurfaces,
  getTokenNamesForSurface,
} from '../surfaces/definitions';
import type { FeedbackSurface } from '../surfaces/types';
import {
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  lighten,
  darken,
  mix,
  getContrastingTextColor,
  ensureContrast,
} from '../colors/utils';
import { generateSpacingTokens } from '../tokens/spacing';
import { generateTypographyTokens } from '../tokens/typography';
import { generateRadiiTokens } from '../tokens/radii';
import { shadowTokens, generateDarkModeShadows } from '../tokens/shadows';
import { generateAnimationTokens } from '../tokens/animation';

// Import theme rules - this is the single source of truth
import themeRules from './schema/theme-rules.json';

// Types for theme rules
interface SurfaceTypeConfig {
  description?: string;
  tokens: string[];
  defaults?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  derivation?: Record<string, string | { light: string; dark: string }>;
}

interface SpecialTokenConfig {
  derivation?: string | { light: string; dark: string };
  default?: string | { light: string; dark: string };
}

interface ProcessedColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

interface GeneratorContext {
  colors: ProcessedColors;
  isDark: boolean;
  contrastLevel: number;
  tokens: Record<string, string>;
}

/**
 * Generate all tokens for a theme mode using rules from theme-rules.json
 */
export function generateThemeTokens(
  theme: ThemeDefinition,
  mode: 'light' | 'dark'
): Record<string, string> {
  const tokens: Record<string, string> = {};
  const isDark = mode === 'dark';

  // Get colors with adjustments
  const colors = applyColorAdjustments(theme.colors, theme.config, isDark);
  const contrastLevel = theme.accessibility?.level === 'AAA' ? 7 : 4.5;

  // Create generator context
  const ctx: GeneratorContext = {
    colors,
    isDark,
    contrastLevel,
    tokens,
  };

  // Generate static tokens
  const spacingTokens = generateSpacingTokens(theme.spacing);
  const typographyTokens = generateTypographyTokens(theme.typography);
  const radiiTokens = generateRadiiTokens(theme.radii);
  const animTokens = generateAnimationTokens(theme.animation);
  const shadows = isDark ? generateDarkModeShadows() : shadowTokens;

  Object.assign(tokens, spacingTokens, typographyTokens, radiiTokens, animTokens, shadows);

  // Generate role tokens from rules
  generateRoleTokensFromRules(ctx);

  // Generate special tokens from rules
  generateSpecialTokensFromRules(ctx);

  // Generate component shortcut tokens from rules
  generateComponentTokensFromRules(tokens);

  // Apply overrides from theme definition
  const overrides = isDark ? theme.overrides?.dark : theme.overrides?.light;
  if (overrides) {
    Object.assign(tokens, overrides);
  }

  return tokens;
}

/**
 * Apply color adjustments from theme config
 */
function applyColorAdjustments(
  colors: ThemeDefinition['colors'],
  config: ThemeDefinition['config'] = {},
  isDark: boolean
): ProcessedColors {
  const { saturation = 0, temperature = 0 } = config;

  // Derive missing colors using rules from theme-rules.json
  const rules = themeRules.colorDerivation.rules;

  let primary = colors.primary;
  let secondary = colors.secondary || applyFormula(rules['secondary-from-primary'].formula, primary);
  let accent = colors.accent || applyFormula(rules['accent-from-primary'].formula, primary);
  let neutral = colors.neutral || applyFormula(rules['neutral-from-primary'].formula, primary);

  // Apply saturation adjustment
  if (saturation !== 0) {
    primary = adjustSaturation(primary, saturation);
    secondary = adjustSaturation(secondary, saturation);
    accent = adjustSaturation(accent, saturation);
  }

  // Apply temperature adjustment
  if (temperature !== 0) {
    primary = adjustTemperature(primary, temperature);
    secondary = adjustTemperature(secondary, temperature);
    accent = adjustTemperature(accent, temperature);
    neutral = adjustTemperature(neutral, temperature);
  }

  // Get semantic colors from rules (fixed across all themes for UX clarity)
  const semanticColors = themeRules.semanticColors;

  return {
    primary,
    secondary,
    accent,
    neutral,
    success: semanticColors.success.base,
    warning: semanticColors.warning.base,
    danger: semanticColors.danger.base,
    info: semanticColors.info.base,
  };
}

/**
 * Apply a derivation formula to a color
 */
function applyFormula(formula: string | { light: string; dark: string }, baseColor: string): string {
  if (typeof formula !== 'string') {
    // This shouldn't happen for color derivation, but handle it
    return baseColor;
  }

  // Parse formula like "shiftHue(primary, 15)" or "desaturate(primary, 80)"
  const shiftHueMatch = formula.match(/shiftHue\((\w+),\s*(-?\d+)\)/);
  if (shiftHueMatch) {
    return shiftHue(baseColor, parseInt(shiftHueMatch[2], 10));
  }

  const desaturateMatch = formula.match(/desaturate\((\w+),\s*(\d+)\)/);
  if (desaturateMatch) {
    return desaturate(baseColor, parseInt(desaturateMatch[2], 10));
  }

  return baseColor;
}

/**
 * Generate role tokens from theme-rules.json
 */
function generateRoleTokensFromRules(ctx: GeneratorContext): void {
  const { colors, isDark, contrastLevel, tokens } = ctx;
  const roleRules = themeRules.roles;

  // Process container roles
  const containerTypes = roleRules.container.types as Record<string, SurfaceTypeConfig>;
  for (const [roleName, config] of Object.entries(containerTypes)) {
    generateRoleTokens(roleName, config, ctx);
  }

  // Process control roles
  const controlTypes = roleRules.control.types as Record<string, SurfaceTypeConfig>;
  for (const [roleName, config] of Object.entries(controlTypes)) {
    generateRoleTokens(roleName, config, ctx);
  }

  // Process feedback roles
  const feedbackTypes = roleRules.feedback.types as Record<string, SurfaceTypeConfig>;
  for (const [roleName, config] of Object.entries(feedbackTypes)) {
    generateRoleTokens(roleName, config, ctx);
  }
}

/**
 * Generate tokens for a single role based on its config
 */
function generateRoleTokens(
  roleName: string,
  config: SurfaceTypeConfig,
  ctx: GeneratorContext
): void {
  const { colors, isDark, contrastLevel, tokens } = ctx;
  const mode = isDark ? 'dark' : 'light';

  // Get defaults for this mode
  const defaults = config.defaults?.[mode] || {};
  const derivation = config.derivation || {};

  // Process each token for this role
  for (const tokenName of config.tokens) {
    const cssVar = `--${roleName}-${tokenName}`;

    // Check for explicit default first
    if (defaults[tokenName] !== undefined) {
      tokens[cssVar] = defaults[tokenName];
      continue;
    }

    // Check for derivation rule
    const rule = derivation[tokenName];
    if (rule !== undefined) {
      tokens[cssVar] = evaluateDerivation(rule, roleName, tokenName, ctx);
      continue;
    }

    // Apply automatic derivation based on token type
    tokens[cssVar] = deriveTokenValue(roleName, tokenName, ctx);
  }
}

/**
 * Evaluate a derivation rule
 */
function evaluateDerivation(
  rule: string | { light: string; dark: string },
  surfaceName: string,
  tokenName: string,
  ctx: GeneratorContext
): string {
  const { colors, isDark, tokens } = ctx;

  // Get the rule string for current mode
  const ruleStr = typeof rule === 'string' ? rule : (isDark ? rule.dark : rule.light);

  // Parse different derivation patterns

  // "theme:primary" - reference theme color
  if (ruleStr.startsWith('theme:')) {
    const colorName = ruleStr.slice(6) as keyof ProcessedColors;
    return colors[colorName] || ruleStr;
  }

  // "semantic:danger" - reference semantic color
  if (ruleStr.startsWith('semantic:')) {
    const colorName = ruleStr.slice(9) as keyof ProcessedColors;
    return colors[colorName] || ruleStr;
  }

  // "inherit:surface.token" - inherit from another surface
  if (ruleStr.startsWith('inherit:')) {
    const [surface, token] = ruleStr.slice(8).split('.');
    return tokens[`--${surface}-${token}`] || ruleStr;
  }

  // "transparent" - literal value
  if (ruleStr === 'transparent') {
    return 'transparent';
  }

  // "contrast(bg)" - get contrasting text color
  if (ruleStr.startsWith('contrast(')) {
    const refToken = ruleStr.slice(9, -1);
    const bgColor = tokens[`--${surfaceName}-${refToken}`] || tokens[`--${surfaceName}-bg`];
    return bgColor ? getContrastingTextColor(bgColor) : '#000000';
  }

  // "darken(color, amount)" or "lighten(color, amount)"
  const darkenMatch = ruleStr.match(/darken\(([^,]+),\s*(\d+)\)/);
  if (darkenMatch) {
    const baseColor = resolveColorRef(darkenMatch[1], ctx);
    return darken(baseColor, parseInt(darkenMatch[2], 10));
  }

  const lightenMatch = ruleStr.match(/lighten\(([^,]+),\s*(\d+)\)/);
  if (lightenMatch) {
    const baseColor = resolveColorRef(lightenMatch[1], ctx);
    return lighten(baseColor, parseInt(lightenMatch[2], 10));
  }

  // "mix(color1, color2, weight)"
  const mixMatch = ruleStr.match(/mix\(([^,]+),\s*([^,]+),\s*([\d.]+)\)/);
  if (mixMatch) {
    const color1 = resolveColorRef(mixMatch[1], ctx);
    const color2 = resolveColorRef(mixMatch[2], ctx);
    const weight = parseFloat(mixMatch[3]);
    return mix(color1, color2, weight);
  }

  // "surface.token" - reference another token
  if (ruleStr.includes('.')) {
    const [surface, token] = ruleStr.split('.');
    return tokens[`--${surface}-${token}`] || ruleStr;
  }

  // Literal value (hex color, rgba, etc.)
  return ruleStr;
}

/**
 * Resolve a color reference in a derivation formula
 */
function resolveColorRef(ref: string, ctx: GeneratorContext): string {
  const { colors, tokens } = ctx;
  const trimmed = ref.trim();

  // "theme:primary" style
  if (trimmed.startsWith('theme:')) {
    const colorName = trimmed.slice(6) as keyof ProcessedColors;
    return colors[colorName] || trimmed;
  }

  // "semantic:danger" style
  if (trimmed.startsWith('semantic:')) {
    const colorName = trimmed.slice(9) as keyof ProcessedColors;
    return colors[colorName] || trimmed;
  }

  // Token reference "surface.token"
  if (trimmed.includes('.')) {
    const [surface, token] = trimmed.split('.');
    return tokens[`--${surface}-${token}`] || trimmed;
  }

  // Simple color name from ProcessedColors
  if (trimmed in colors) {
    return colors[trimmed as keyof ProcessedColors];
  }

  // Literal hex color
  if (trimmed.startsWith('#')) {
    return trimmed;
  }

  return trimmed;
}

/**
 * Derive a token value automatically based on token type and surface
 */
function deriveTokenValue(
  surfaceName: string,
  tokenName: string,
  ctx: GeneratorContext
): string {
  const { colors, isDark, contrastLevel, tokens } = ctx;
  const rules = themeRules.colorDerivation.rules;

  // Get the background color for this surface (needed for text derivations)
  const bgToken = `--${surfaceName}-bg`;
  const bg = tokens[bgToken];

  // Get page colors for reference
  const pageBg = tokens['--page-bg'] || (isDark ? '#0f0f0f' : '#fafafa');
  const pageText = tokens['--page-text'] || (isDark ? '#e5e5e5' : '#171717');

  // Automatic derivation based on token name
  switch (tokenName) {
    case 'text':
      if (bg) {
        return ensureContrast(pageText, bg, contrastLevel);
      }
      return pageText;

    case 'text-soft': {
      const text = tokens[`--${surfaceName}-text`] || pageText;
      const background = bg || pageBg;
      const formula = rules['text-soft']?.formula;
      if (typeof formula === 'string' && formula.includes('mix')) {
        return mix(text, background, 0.3);
      }
      return mix(text, background, 0.3);
    }

    case 'text-softer': {
      const text = tokens[`--${surfaceName}-text`] || pageText;
      const background = bg || pageBg;
      return mix(text, background, 0.5);
    }

    case 'text-strong': {
      // Higher contrast text (30% toward maximum)
      const text = tokens[`--${surfaceName}-text`] || pageText;
      const background = bg || pageBg;
      const maxContrast = isDark ? '#ffffff' : '#000000';
      return mix(text, maxContrast, 0.3);
    }

    case 'text-stronger':
      return isDark ? '#ffffff' : '#000000';

    case 'border-soft': {
      const border = tokens[`--${surfaceName}-border`] || tokens['--page-border'];
      const background = bg || pageBg;
      return mix(border || (isDark ? '#333333' : '#e5e5e5'), background, 0.4);
    }

    case 'border-strong': {
      const border = tokens[`--${surfaceName}-border`] || tokens['--page-border'] || (isDark ? '#333333' : '#e5e5e5');
      return isDark ? lighten(border, 20) : darken(border, 20);
    }

    case 'border-stronger': {
      const border = tokens[`--${surfaceName}-border`] || tokens['--page-border'] || (isDark ? '#333333' : '#e5e5e5');
      const maxContrast = isDark ? '#ffffff' : '#000000';
      return mix(border, maxContrast, 0.5);
    }

    case 'border': {
      const borderDefault = rules['border-default']?.formula;
      if (typeof borderDefault === 'object') {
        return isDark ? borderDefault.dark : borderDefault.light;
      }
      return isDark ? '#333333' : '#e5e5e5';
    }

    case 'shadow':
      return 'none';

    default:
      return '';
  }
}

/**
 * Generate special tokens from theme-rules.json
 */
function generateSpecialTokensFromRules(ctx: GeneratorContext): void {
  const { colors, isDark, tokens } = ctx;
  const specialTokens = themeRules.specialTokens;

  // Process each special token category
  for (const [category, config] of Object.entries(specialTokens)) {
    const categoryConfig = config as { description?: string; tokens: Record<string, SpecialTokenConfig> };

    for (const [tokenName, tokenConfig] of Object.entries(categoryConfig.tokens)) {
      const cssVar = `--${category === 'link' ? '' : category + '-'}${tokenName}`.replace('--focus-ring', '--focus-ring');

      // Handle the naming for different categories
      let finalCssVar: string;
      if (category === 'focus') {
        finalCssVar = `--focus-${tokenName}`;
      } else if (category === 'selection') {
        finalCssVar = `--selection-${tokenName}`;
      } else if (category === 'link') {
        finalCssVar = tokenName === 'default' ? '--link' : `--link-${tokenName}`;
      } else if (category === 'scrollbar') {
        finalCssVar = `--scrollbar-${tokenName}`;
      } else if (category === 'skeleton') {
        finalCssVar = `--skeleton-${tokenName}`;
      } else if (category === 'highlight') {
        finalCssVar = `--highlight-${tokenName}`;
      } else {
        finalCssVar = `--${category}-${tokenName}`;
      }

      // Evaluate the token value
      if (tokenConfig.derivation !== undefined) {
        tokens[finalCssVar] = evaluateDerivation(tokenConfig.derivation, '', tokenName, ctx);
      } else if (tokenConfig.default !== undefined) {
        const defaultVal = tokenConfig.default;
        if (typeof defaultVal === 'string') {
          tokens[finalCssVar] = defaultVal;
        } else {
          tokens[finalCssVar] = isDark ? defaultVal.dark : defaultVal.light;
        }
      }
    }
  }
}

/**
 * Generate component shortcut tokens from theme-rules.json
 */
function generateComponentTokensFromRules(tokens: Record<string, string>): void {
  const componentTokens = themeRules.componentTokens.tokens;

  for (const [tokenName, config] of Object.entries(componentTokens)) {
    const tokenConfig = config as { default: string };
    tokens[`--${tokenName}`] = tokenConfig.default;
  }
}

// Color utility helpers
function shiftHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + degrees) % 360;
  if (hsl.h < 0) hsl.h += 360;
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function desaturate(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.max(0, hsl.s - amount);
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function adjustSaturation(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function adjustTemperature(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  // Positive = warmer (more red/yellow), negative = cooler (more blue)
  const factor = amount / 100;
  const r = Math.min(255, Math.max(0, rgb.r + factor * 20));
  const b = Math.min(255, Math.max(0, rgb.b - factor * 20));
  return rgbToHex(r, rgb.g, b);
}

/**
 * Generate CSS from tokens
 */
export function generateThemeCSS(
  theme: ThemeDefinition,
  mode: 'light' | 'dark'
): string {
  const tokens = generateThemeTokens(theme, mode);
  const themeId = theme.id || theme.name.toLowerCase().replace(/\s+/g, '-');

  const lines = [
    `/* ${theme.name} - ${mode} mode */`,
    `/* Generated by @ui-kit/core from theme-rules.json */`,
    '',
  ];

  // Generate the appropriate selector based on theme and mode
  const isDefaultTheme = themeId === 'default';

  if (isDefaultTheme) {
    // Default theme: light mode is :root, dark mode uses html selector for specificity
    // The html prefix ensures theme CSS wins over fallback tokens.css
    if (mode === 'light') {
      lines.push(':root {');
    } else {
      lines.push('html[data-mode="dark"], html.dark {');
    }
  } else {
    // Custom themes: use html prefix for higher specificity than default theme
    // This ensures non-default themes always win when multiple CSS files are loaded
    if (mode === 'light') {
      lines.push(`html[data-theme="${themeId}"], html[data-theme="${themeId}"][data-mode="light"] {`);
    } else {
      lines.push(`html[data-theme="${themeId}"][data-mode="dark"], html[data-theme="${themeId}"].dark {`);
    }
  }

  for (const [name, value] of Object.entries(tokens)) {
    if (value) {
      lines.push(`  ${name}: ${value};`);
    }
  }

  lines.push('}');
  lines.push('');

  // Add body font-family rule (only for light mode to avoid duplication)
  if (mode === 'light') {
    lines.push('/* Base typography */');
    if (isDefaultTheme) {
      lines.push('body {');
    } else {
      lines.push(`html[data-theme="${themeId}"] body, html[data-theme="${themeId}"] {`);
    }
    lines.push('  font-family: var(--font-sans);');
    lines.push('  font-size: var(--text-base);');
    lines.push('  line-height: var(--leading-normal);');
    lines.push('  color: var(--page-text);');
    lines.push('  background: var(--page-bg);');
    lines.push('}');
    lines.push('');
  }

  // Generate surface classes (only for light mode to avoid duplication)
  if (mode === 'light') {
    lines.push('/* Surface classes */');
    lines.push(...generateSurfaceClasses());
  }

  return lines.join('\n');
}

/**
 * Generate surface class CSS
 *
 * NEW SYSTEM: Tonal surfaces with reset/override pattern
 * - .surface base class resets ALL tokens to page defaults
 * - .surface.raised, .surface.sunken, etc. apply overrides
 * - Nested surfaces automatically reset - no compounding
 *
 * LEGACY SYSTEM: Kept for backward compatibility
 * - .surface-page, .surface-card, etc.
 */
function generateSurfaceClasses(): string[] {
  const lines: string[] = [];

  // ========================================================================
  // NEW TONAL SURFACE SYSTEM
  // ========================================================================

  lines.push('/* ================================================================');
  lines.push('   TONAL SURFACE SYSTEM');
  lines.push('   Usage: <div class="surface raised">...</div>');
  lines.push('   Every .surface resets tokens to page defaults, then applies overrides.');
  lines.push('   ================================================================ */');
  lines.push('');

  // Base .surface class - resets ALL scoped tokens to page values
  lines.push('.surface {');
  lines.push('  /* Surface tokens - reset to page values */');
  lines.push('  --surface-bg: var(--page-bg);');
  lines.push('  --surface-text: var(--page-text);');
  lines.push('  --surface-text-soft: var(--page-text-soft);');
  lines.push('  --surface-text-softer: var(--page-text-softer);');
  lines.push('  --surface-text-strong: var(--page-text-strong);');
  lines.push('  --surface-text-stronger: var(--page-text-stronger);');
  lines.push('  --surface-border: var(--page-border);');
  lines.push('  --surface-border-soft: var(--page-border-soft);');
  lines.push('  --surface-border-strong: var(--page-border-strong);');
  lines.push('  --surface-border-stronger: var(--page-border-stronger);');
  lines.push('  --surface-shadow: var(--page-shadow);');
  lines.push('');
  lines.push('  /* Apply surface tokens */');
  lines.push('  background: var(--surface-bg);');
  lines.push('  color: var(--surface-text);');
  lines.push('}');
  lines.push('');

  // Generate tonal surface modifiers
  const surfaceDefinitions = themeRules.surfaces?.types as Record<string, { description: string; overrides: Record<string, Record<string, string>> }> | undefined;

  if (surfaceDefinitions) {
    for (const surfaceName of tonalSurfaces) {
      const config = surfaceDefinitions[surfaceName];
      if (!config) continue;

      const lightOverrides = config.overrides?.light || {};
      const darkOverrides = config.overrides?.dark || {};

      // Skip if no overrides (base surface just uses the reset)
      if (Object.keys(lightOverrides).length === 0 && Object.keys(darkOverrides).length === 0) {
        lines.push(`/* .surface.${surfaceName} - ${config.description} */`);
        lines.push(`/* Uses base .surface reset (no additional overrides) */`);
        lines.push('');
        continue;
      }

      lines.push(`/* .surface.${surfaceName} - ${config.description} */`);

      // Light mode overrides
      if (Object.keys(lightOverrides).length > 0) {
        lines.push(`.surface.${surfaceName} {`);
        for (const [token, value] of Object.entries(lightOverrides)) {
          lines.push(`  --${token}: ${value};`);
        }
        lines.push('}');
      }

      // Dark mode overrides (use html prefix for specificity over fallback tokens)
      if (Object.keys(darkOverrides).length > 0) {
        lines.push(`html[data-mode="dark"] .surface.${surfaceName}, html.dark .surface.${surfaceName} {`);
        for (const [token, value] of Object.entries(darkOverrides)) {
          lines.push(`  --${token}: ${value};`);
        }
        lines.push('}');
      }

      lines.push('');
    }
  }

  // Generate feedback surface modifiers
  lines.push('/* Feedback surfaces */');
  const feedbackSurfaces: FeedbackSurface[] = ['success', 'warning', 'danger', 'info'];
  for (const feedback of feedbackSurfaces) {
    lines.push(`.surface.${feedback} {`);
    lines.push(`  --surface-bg: var(--${feedback}-bg);`);
    lines.push(`  --surface-text: var(--${feedback}-text);`);
    lines.push(`  --surface-border: var(--${feedback}-border);`);
    lines.push('}');
    lines.push('');
  }

  // ========================================================================
  // LEGACY SURFACE CLASSES (for backward compatibility)
  // ========================================================================

  lines.push('/* ================================================================');
  lines.push('   LEGACY SURFACE CLASSES');
  lines.push('   @deprecated Use tonal surfaces: <div class="surface raised">');
  lines.push('   ================================================================ */');
  lines.push('');

  // Only generate legacy surface classes for containers and feedback - not controls
  const surfaceRoles = [...containerRoles, ...feedbackRoles];

  for (const surface of surfaceRoles) {
    lines.push(`.surface-${surface} {`);
    lines.push(`  background: var(--${surface}-bg);`);
    lines.push(`  color: var(--${surface}-text);`);

    // Add border if surface has it
    const tokenNames = getTokenNamesForSurface(surface);
    if (tokenNames.includes('border')) {
      lines.push(`  border-color: var(--${surface}-border);`);
    }
    if (tokenNames.includes('shadow')) {
      lines.push(`  box-shadow: var(--${surface}-shadow);`);
    }

    lines.push('}');
    lines.push('');
  }

  return lines;
}

/**
 * Load and validate a theme from JSON
 */
export function validateTheme(theme: unknown): theme is ThemeDefinition {
  if (!theme || typeof theme !== 'object') return false;

  const t = theme as Record<string, unknown>;
  const schema = themeRules.themeInputSchema;

  // Check required fields
  for (const field of schema.required) {
    if (!(field in t)) return false;
  }

  // Check id pattern
  if (typeof t.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(t.id)) {
    return false;
  }

  // Check name
  if (typeof t.name !== 'string') return false;

  // Check colors
  if (!t.colors || typeof t.colors !== 'object') return false;
  const colors = t.colors as Record<string, unknown>;
  if (typeof colors.primary !== 'string') return false;

  return true;
}
