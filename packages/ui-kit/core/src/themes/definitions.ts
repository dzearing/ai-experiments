/**
 * Built-in theme definitions
 *
 * This file re-exports theme definitions that are loaded from JSON files.
 * The JSON files in ./definitions/ are the single source of truth.
 *
 * For adding new themes:
 * 1. Create a new JSON file in ./definitions/ (e.g., my-theme.json)
 * 2. Run `pnpm build` to generate the CSS
 *
 * Theme JSON files are validated against the schema in ./schema/theme-rules.json
 */

import type { ThemeDefinition } from './types';

// Import all theme definitions from JSON
import defaultThemeJson from './definitions/default.json';
import minimalThemeJson from './definitions/minimal.json';
import highContrastThemeJson from './definitions/high-contrast.json';
import githubThemeJson from './definitions/github.json';
import oceanThemeJson from './definitions/ocean.json';
import forestThemeJson from './definitions/forest.json';
import sunsetThemeJson from './definitions/sunset.json';
import terminalThemeJson from './definitions/terminal.json';
import cyberpunkThemeJson from './definitions/cyberpunk.json';
import linkedinThemeJson from './definitions/linkedin.json';
import teamsThemeJson from './definitions/teams.json';
import onedriveThemeJson from './definitions/onedrive.json';
import fluentThemeJson from './definitions/fluent.json';
import matrixThemeJson from './definitions/matrix.json';
import sketchyThemeJson from './definitions/sketchy.json';
import artDecoThemeJson from './definitions/art-deco.json';
import retroThemeJson from './definitions/retro.json';
import midnightThemeJson from './definitions/midnight.json';
import arcticThemeJson from './definitions/arctic.json';
import lavenderThemeJson from './definitions/lavender.json';

// Export typed theme definitions
export const defaultTheme = defaultThemeJson as ThemeDefinition;
export const minimalTheme = minimalThemeJson as ThemeDefinition;
export const highContrastTheme = highContrastThemeJson as ThemeDefinition;
export const githubTheme = githubThemeJson as ThemeDefinition;
export const oceanTheme = oceanThemeJson as ThemeDefinition;
export const forestTheme = forestThemeJson as ThemeDefinition;
export const sunsetTheme = sunsetThemeJson as ThemeDefinition;
export const terminalTheme = terminalThemeJson as ThemeDefinition;
export const cyberpunkTheme = cyberpunkThemeJson as ThemeDefinition;
export const linkedinTheme = linkedinThemeJson as ThemeDefinition;
export const teamsTheme = teamsThemeJson as ThemeDefinition;
export const onedriveTheme = onedriveThemeJson as ThemeDefinition;
export const fluentTheme = fluentThemeJson as ThemeDefinition;
export const matrixTheme = matrixThemeJson as ThemeDefinition;
export const sketchyTheme = sketchyThemeJson as ThemeDefinition;
export const artDecoTheme = artDecoThemeJson as ThemeDefinition;
export const retroTheme = retroThemeJson as ThemeDefinition;
export const midnightTheme = midnightThemeJson as ThemeDefinition;
export const arcticTheme = arcticThemeJson as ThemeDefinition;
export const lavenderTheme = lavenderThemeJson as ThemeDefinition;

/**
 * All built-in themes
 */
export const builtInThemes: ThemeDefinition[] = [
  defaultTheme,
  minimalTheme,
  highContrastTheme,
  githubTheme,
  oceanTheme,
  forestTheme,
  sunsetTheme,
  terminalTheme,
  cyberpunkTheme,
  linkedinTheme,
  teamsTheme,
  onedriveTheme,
  fluentTheme,
  matrixTheme,
  sketchyTheme,
  artDecoTheme,
  retroTheme,
  midnightTheme,
  arcticTheme,
  lavenderTheme,
];

/**
 * Get a theme by ID
 */
export function getThemeById(id: string): ThemeDefinition | undefined {
  return builtInThemes.find((theme) => theme.id === id);
}

/**
 * Get theme IDs
 */
export function getThemeIds(): string[] {
  return builtInThemes.map((theme) => theme.id);
}
