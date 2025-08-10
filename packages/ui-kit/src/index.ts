/**
 * @claude-flow/ui-kit
 *
 * Framework-agnostic UI foundation with CSS variables and themes
 * 
 * Note: Theme utilities (theme.js and theme-switcher.js) are designed to be loaded
 * separately via script tags to avoid waterfall loading. They register their APIs
 * on the window object.
 */

// Export web components (framework-agnostic)
export { ThemePreview } from './components/index';

// Export types for TypeScript consumers
export type { ThemeMode, ThemeConfig, ThemePreferences, ThemeInfo, ThemeChangeEvent } from './theme.js';
export type { UIKitThemeAPI, ThemeSwitcherOptions } from './globals';