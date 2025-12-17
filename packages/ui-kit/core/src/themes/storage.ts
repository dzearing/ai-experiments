/**
 * Theme Storage Utilities
 *
 * Browser-specific utilities for localStorage persistence of custom themes.
 * These functions only work in browser environments with localStorage available.
 */

import type { RuntimeThemeConfig } from './generator';
import { type ThemeOption, getBuiltInThemeOptions } from './definitions';

export interface StoredTheme {
  id: string;              // 'default', 'arctic', 'custom-mytheme'
  name: string;            // Display name
  version: number;         // Increments on save
  baseTheme?: string;      // If derived from premade (e.g., 'default')
  baseVersion?: number;    // Version when customized
  config: RuntimeThemeConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeManifest {
  version: number;
  generatedAt: string;
  themes: Record<string, { version: number }>;
}

const STORAGE_KEY = 'uikit-custom-themes';

/**
 * Check if localStorage is available
 */
function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Get all stored custom themes from localStorage
 */
export function getStoredThemes(): StoredTheme[] {
  if (!hasLocalStorage()) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    console.error('Failed to load stored themes');
    return [];
  }
}

/**
 * Get a specific stored theme by ID
 */
export function getStoredTheme(id: string): StoredTheme | null {
  const themes = getStoredThemes();
  return themes.find((t) => t.id === id) || null;
}

/**
 * Save a theme to localStorage
 * If a theme with the same ID exists, it will be overwritten
 */
export function saveTheme(theme: StoredTheme): void {
  if (!hasLocalStorage()) {
    throw new Error('localStorage is not available');
  }

  const themes = getStoredThemes();
  const existingIndex = themes.findIndex((t) => t.id === theme.id);

  const now = new Date().toISOString();
  const updatedTheme: StoredTheme = {
    ...theme,
    updatedAt: now,
    createdAt: existingIndex >= 0 ? themes[existingIndex].createdAt : now,
    version: existingIndex >= 0 ? themes[existingIndex].version + 1 : 1,
  };

  if (existingIndex >= 0) {
    themes[existingIndex] = updatedTheme;
  } else {
    themes.push(updatedTheme);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  } catch (error) {
    console.error('Failed to save theme:', error);
    throw new Error('Failed to save theme to localStorage');
  }
}

/**
 * Delete a stored theme by ID
 */
export function deleteTheme(id: string): boolean {
  if (!hasLocalStorage()) return false;

  const themes = getStoredThemes();
  const filteredThemes = themes.filter((t) => t.id !== id);

  if (filteredThemes.length === themes.length) {
    return false; // Theme not found
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredThemes));
    return true;
  } catch {
    console.error('Failed to delete theme');
    return false;
  }
}

/**
 * Check if a stored theme exists
 */
export function hasStoredTheme(id: string): boolean {
  return getStoredTheme(id) !== null;
}

/**
 * Create a theme ID from a name
 */
export function createThemeId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Get list of custom theme names for dropdown
 */
export function getCustomThemeOptions(): Array<{ id: string; name: string; isModified: boolean }> {
  const themes = getStoredThemes();
  return themes.map((t) => ({
    id: t.id,
    name: t.name,
    isModified: t.baseTheme !== undefined,
  }));
}

/**
 * Get all theme options for dropdowns (custom themes first, then divider, then built-in)
 * Combines custom themes from localStorage with built-in themes.
 * This is the single source of truth for theme dropdown options.
 */
export function getAllThemeOptions(): ThemeOption[] {
  const customThemes = getStoredThemes();
  const options: ThemeOption[] = [];

  // Custom themes at the TOP with star prefix
  if (customThemes.length > 0) {
    for (const theme of customThemes) {
      options.push({
        value: `custom:${theme.id}`,
        label: `★ ${theme.name}`,
      });
    }
    // Add divider after custom themes
    options.push({ value: 'divider', label: '─', disabled: true, isDivider: true });
  }

  // Built-in themes (single source of truth)
  options.push(...getBuiltInThemeOptions());

  return options;
}

/**
 * Export a theme as JSON for sharing
 */
export function exportThemeAsJSON(theme: StoredTheme): string {
  const exportData = {
    id: theme.id,
    name: theme.name,
    colors: {
      primary: theme.config.primary,
      secondary: theme.config.secondary,
      accent: theme.config.accent,
      neutral: theme.config.neutral,
    },
    backgrounds: {
      light: theme.config.lightBg,
      dark: theme.config.darkBg,
    },
    config: {
      saturation: theme.config.saturation,
      temperature: theme.config.temperature,
    },
    radii: {
      style: theme.config.radiusStyle,
      scale: theme.config.radiusScale,
    },
    sizing: {
      scale: theme.config.sizeScale,
    },
    effects: {
      glowIntensity: theme.config.glowIntensity,
    },
    accessibility: {
      level: theme.config.accessibilityLevel,
    },
    version: theme.version,
    baseTheme: theme.baseTheme,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import a theme from JSON
 */
export function importThemeFromJSON(json: string): StoredTheme | null {
  try {
    const data = JSON.parse(json);

    const config: RuntimeThemeConfig = {
      primary: data.colors?.primary || '#2563eb',
      secondary: data.colors?.secondary,
      accent: data.colors?.accent,
      neutral: data.colors?.neutral,
      lightBg: data.backgrounds?.light,
      darkBg: data.backgrounds?.dark,
      saturation: data.config?.saturation ?? 0,
      temperature: data.config?.temperature ?? 0,
      radiusScale: data.radii?.scale ?? 1,
      radiusStyle: data.radii?.style ?? 'rounded',
      sizeScale: data.sizing?.scale ?? 1,
      glowIntensity: data.effects?.glowIntensity ?? 0.5,
      accessibilityLevel: data.accessibility?.level ?? 'AA',
    };

    const now = new Date().toISOString();

    return {
      id: data.id || createThemeId(data.name || 'Imported Theme'),
      name: data.name || 'Imported Theme',
      version: 1,
      baseTheme: data.baseTheme,
      baseVersion: data.version,
      config,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Failed to import theme:', error);
    return null;
  }
}
