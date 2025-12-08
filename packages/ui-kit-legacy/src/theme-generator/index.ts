/**
 * Theme generator public API
 *
 * Exports the main functions needed for theme generation
 */

export * from './utilities/index.js';
export * from './accessibility.js';
export * from './surface-engine.js';
export * from './theme-compiler.js';

// Re-export types
export type {
  ThemeDefinition,
  GeneratedTheme,
  ColorScale,
  SurfaceTokens,
  ThemeManifest,
  WCAGLevel,
} from '../themes/theme-types.js';
