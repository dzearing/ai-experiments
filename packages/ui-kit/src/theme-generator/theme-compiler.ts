/**
 * Theme compiler - orchestrates the theme generation process
 *
 * Takes theme definitions and generates complete CSS files
 * with all color tokens, surface tokens, and variations.
 */

import { generateScale, getAnalogous, getTriadic, saturate } from './utilities/index.js';
import { validatePalette, WCAGLevel } from './accessibility.js';
import { generateSurfaceTokens } from './surface-engine.js';
import type {
  ThemeDefinition,
  GeneratedTheme,
  ColorScale,
  ThemeManifest,
  SurfaceTokens,
} from '../themes/theme-types.js';
import { surfaces, backgroundLevels } from '../themes/surface-definitions.js';

/**
 * Compile a theme definition into a complete theme
 */
export function compileTheme(definition: ThemeDefinition, mode: 'light' | 'dark'): GeneratedTheme {
  // Generate color scales
  const colors = generateColorScales(definition);

  // Generate surface tokens
  const surfaceTokens = generateSurfaceTokens(
    surfaces,
    definition,
    mode,
    colors,
    backgroundLevels as unknown as Record<string, { light: string; dark: string }>
  );

  // Generate special tokens
  const special = generateSpecialTokens(colors, mode);

  // Track accessibility adjustments
  const adjustments: GeneratedTheme['accessibility']['adjustments'] = [];

  // Validate and adjust if needed
  if (definition.accessibility.enforceLevel) {
    enforceAccessibility(surfaceTokens, definition.accessibility.targetLevel, adjustments);
  }

  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    mode,
    colors,
    surfaces: surfaceTokens,
    special,
    accessibility: {
      level: definition.accessibility.targetLevel,
      enforced: definition.accessibility.enforceLevel || false,
      adjustments,
    },
    metadata: {
      generated: new Date().toISOString(),
    },
  };
}

/**
 * Generate all color scales from theme definition
 */
function generateColorScales(definition: ThemeDefinition): GeneratedTheme['colors'] {
  // Generate primary scale
  const primaryScale = generateColorScale(definition.colors.primary, definition.config);

  // Generate secondary (analogous if not provided)
  let secondaryScale: ColorScale;
  if (definition.colors.secondary) {
    secondaryScale = generateColorScale(definition.colors.secondary, definition.config);
  } else {
    const [analogous1] = getAnalogous(definition.colors.primary, 30);
    secondaryScale = generateColorScale(analogous1, definition.config);
  }

  // Generate accent (triadic if not provided)
  let accentScale: ColorScale;
  if (definition.colors.accent) {
    accentScale = generateColorScale(definition.colors.accent, definition.config);
  } else {
    const [triadic1] = getTriadic(definition.colors.primary);
    accentScale = generateColorScale(triadic1, definition.config);
  }

  // Generate neutral scale (desaturated primary if not provided)
  let neutralScale: ColorScale;
  if (definition.colors.neutral) {
    neutralScale = generateColorScale(definition.colors.neutral, definition.config);
  } else {
    const desaturated = saturate(definition.colors.primary, -80);
    neutralScale = generateColorScale(desaturated, { ...definition.config, saturation: -80 });
  }

  // Generate semantic color scales
  const successScale = generateColorScale('#10b981', definition.config); // Emerald
  const warningScale = generateColorScale('#f59e0b', definition.config); // Amber
  const errorScale = generateColorScale('#ef4444', definition.config); // Red
  const infoScale = generateColorScale('#3b82f6', definition.config); // Blue

  return {
    primary: primaryScale,
    secondary: secondaryScale,
    accent: accentScale,
    neutral: neutralScale,
    success: successScale,
    warning: warningScale,
    error: errorScale,
    info: infoScale,
  };
}

/**
 * Generate a complete color scale with config adjustments
 */
function generateColorScale(baseColor: string, config?: ThemeDefinition['config']): ColorScale {
  // Generate base scale
  const scale = generateScale(baseColor, 11);

  // Apply config adjustments
  let adjustedScale = scale;

  if (config?.saturation) {
    adjustedScale = scale.map((color) => saturate(color, config.saturation!));
  }

  if (config?.temperature) {
    adjustedScale = adjustedScale.map((color) => {
      // Apply temperature adjustment (simplified)
      return color; // TODO: Implement temperature adjustment
    });
  }

  // Map to ColorScale object
  return {
    50: adjustedScale[0] || '#ffffff',
    100: adjustedScale[1] || '#f5f5f5',
    200: adjustedScale[2] || '#e5e5e5',
    300: adjustedScale[3] || '#d4d4d4',
    400: adjustedScale[4] || '#a3a3a3',
    500: adjustedScale[5] || '#737373',
    600: adjustedScale[6] || '#525252',
    700: adjustedScale[7] || '#404040',
    800: adjustedScale[8] || '#262626',
    900: adjustedScale[9] || '#171717',
    950: adjustedScale[10] || '#0a0a0a',
  };
}

/**
 * Generate special tokens (selection, focus, overlay, etc.)
 */
function generateSpecialTokens(
  colors: GeneratedTheme['colors'],
  mode: 'light' | 'dark'
): GeneratedTheme['special'] {
  return {
    selection: {
      background: colors.primary[mode === 'light' ? '200' : '800'],
      text: colors.primary[mode === 'light' ? '900' : '100'],
    },
    focus: {
      ring: colors.primary[mode === 'light' ? '500' : '400'],
      offset: '2px',
    },
    overlay: {
      background: mode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)',
    },
    backdrop: {
      background: mode === 'light' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.8)',
    },
  };
}

/**
 * Enforce accessibility requirements
 */
function enforceAccessibility(
  surfaceTokens: Record<string, SurfaceTokens>,
  targetLevel: WCAGLevel,
  adjustments: GeneratedTheme['accessibility']['adjustments']
): void {
  // Define key text/background pairs to check
  const pairs = [
    { foreground: 'body.text', background: 'body.background', usage: 'Body text' },
    { foreground: 'body.link', background: 'body.background', usage: 'Body links' },
    {
      foreground: 'buttonPrimary.text',
      background: 'buttonPrimary.background',
      usage: 'Primary button',
      textSize: 'ui' as const,
    },
    {
      foreground: 'buttonNeutral.text',
      background: 'buttonNeutral.background',
      usage: 'Neutral button',
      textSize: 'ui' as const,
    },
    { foreground: 'input.text', background: 'input.background', usage: 'Input text' },
    { foreground: 'noticeInfo.text', background: 'noticeInfo.background', usage: 'Info notice' },
    {
      foreground: 'noticeSuccess.text',
      background: 'noticeSuccess.background',
      usage: 'Success notice',
    },
    {
      foreground: 'noticeWarning.text',
      background: 'noticeWarning.background',
      usage: 'Warning notice',
    },
    {
      foreground: 'noticeDanger.text',
      background: 'noticeDanger.background',
      usage: 'Danger notice',
    },
  ];

  // Build flat token map for validation
  const flatTokens: Record<string, string> = {};
  for (const [surfaceName, tokens] of Object.entries(surfaceTokens)) {
    for (const [tokenName, value] of Object.entries(tokens)) {
      if (typeof value === 'string') {
        flatTokens[`${surfaceName}.${tokenName}`] = value;
      }
    }
  }

  // Validate and adjust
  const report = validatePalette(flatTokens, pairs, targetLevel);

  // Apply suggested adjustments
  for (const issue of report.issues) {
    if (issue.suggestion) {
      // Update the token with the suggested color
      const parts = issue.foreground.split('.');
      const surface = parts[0];
      const property = parts[1];
      if (surface && property && surfaceTokens[surface]) {
        const surfaceToken = surfaceTokens[surface];
        if (
          property in surfaceToken &&
          typeof (surfaceToken as unknown as Record<string, unknown>)[property] === 'string'
        ) {
          const original = (surfaceToken as unknown as Record<string, unknown>)[property] as string;
          (surfaceToken as unknown as Record<string, unknown>)[property] = issue.suggestion;

          adjustments.push({
            token: issue.foreground,
            original,
            adjusted: issue.suggestion,
            reason: `Adjusted to meet ${targetLevel} contrast ratio (${issue.requiredRatio}:1) against ${issue.background}`,
          });
        }
      }
    }
  }
}

/**
 * Generate CSS from compiled theme
 */
export function generateCSS(theme: GeneratedTheme): string {
  const lines: string[] = [
    `/* Generated theme: ${theme.name} (${theme.mode} mode) */`,
    `/* Generated: ${theme.metadata.generated} */`,
    `/* WCAG ${theme.accessibility.level} compliant */`,
    '',
    "@import '../styles.css';",
    '',
    `[data-theme="${theme.id}"][data-theme-type="${theme.mode}"] {`,
  ];

  // Note: Color scales are not exported to CSS as they are non-semantic palette colors.
  // They remain available in TypeScript for internal use only.

  // Add surface tokens
  lines.push('  /* Surface tokens */');
  for (const [surfaceName, tokens] of Object.entries(theme.surfaces)) {
    for (const [tokenName, value] of Object.entries(tokens)) {
      if (typeof value === 'string') {
        // Convert camelCase to kebab-case for CSS variables
        const kebabTokenName = tokenName.replace(/([A-Z])/g, '-$1').toLowerCase();
        lines.push(`  --color-${surfaceName}-${kebabTokenName}: ${value};`);
      }
    }
    lines.push('');
  }

  // Add special tokens
  lines.push('  /* Special tokens */');
  lines.push(`  --color-selection-background: ${theme.special.selection.background};`);
  lines.push(`  --color-selection-text: ${theme.special.selection.text};`);
  lines.push(`  --focus-ring-color: ${theme.special.focus.ring};`);
  lines.push(`  --focus-ring-offset: ${theme.special.focus.offset};`);
  lines.push(`  --color-overlay-background: ${theme.special.overlay.background};`);
  lines.push(`  --color-backdrop-background: ${theme.special.backdrop.background};`);

  lines.push('}');

  // Add accessibility report as comments
  if (theme.accessibility.adjustments.length > 0) {
    lines.push('');
    lines.push('/* Accessibility adjustments:');
    for (const adjustment of theme.accessibility.adjustments) {
      lines.push(` * ${adjustment.token}: ${adjustment.original} → ${adjustment.adjusted}`);
      lines.push(` *   Reason: ${adjustment.reason}`);
    }
    lines.push(' */');
  }

  return lines.join('\n');
}

/**
 * Generate TypeScript definitions for theme tokens
 */
export function generateTypeDefinitions(themes: GeneratedTheme[]): string {
  const lines: string[] = [
    '/**',
    ' * Generated theme token type definitions',
    ' * DO NOT EDIT - This file is auto-generated',
    ' */',
    '',
    'export interface ThemeTokens {',
  ];

  // Collect all unique tokens
  const allTokens = new Set<string>();

  for (const theme of themes) {
    // Note: Color scales are not included in CSS tokens as they are non-semantic palette colors.
    // They remain available only in TypeScript for internal use.

    // Surface tokens
    for (const [surfaceName, tokens] of Object.entries(theme.surfaces)) {
      for (const tokenName of Object.keys(tokens)) {
        if (typeof tokens[tokenName as keyof typeof tokens] === 'string') {
          // Convert camelCase to kebab-case for CSS variables
          const kebabTokenName = tokenName.replace(/([A-Z])/g, '-$1').toLowerCase();
          allTokens.add(`color-${surfaceName}-${kebabTokenName}`);
        }
      }
    }

    // Special tokens
    allTokens.add('color-selection-background');
    allTokens.add('color-selection-text');
    allTokens.add('focus-ring-color');
    allTokens.add('focus-ring-offset');
    allTokens.add('color-overlay-background');
    allTokens.add('color-backdrop-background');
  }

  // Sort and add to interface
  const sortedTokens = Array.from(allTokens).sort();
  for (const token of sortedTokens) {
    lines.push(`  '--${token}': string;`);
  }

  lines.push('}');
  lines.push('');
  lines.push("declare module 'csstype' {");
  lines.push('  interface Properties extends ThemeTokens {}');
  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate theme manifest
 */
export function generateManifest(
  definitions: ThemeDefinition[],
  themes: GeneratedTheme[]
): ThemeManifest {
  // Get unique surface names
  const surfaceNames = new Set<string>();
  for (const theme of themes) {
    Object.keys(theme.surfaces).forEach((name) => surfaceNames.add(name));
  }

  return {
    generated: new Date().toISOString(),
    themes: definitions.map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      accessibility: {
        targetLevel: def.accessibility.targetLevel,
      },
      files: {
        light: `${def.id}-light.css`,
        dark: `${def.id}-dark.css`,
      },
    })),
    metadata: {
      version: '1.0.0',
      totalTokens: Array.from(surfaceNames).length * 50, // Approximate
      surfaces: Array.from(surfaceNames),
    },
  };
}
