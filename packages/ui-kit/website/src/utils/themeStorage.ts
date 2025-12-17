/**
 * Theme Storage Utilities
 *
 * Re-exports theme storage utilities from @ui-kit/core.
 * All localStorage persistence for custom themes is handled by core.
 */

// Re-export everything from core's storage module
export {
  // Types
  type StoredTheme,
  type ThemeManifest,
  type ThemeOption,
  // Storage functions
  getStoredThemes,
  getStoredTheme,
  saveTheme,
  deleteTheme,
  hasStoredTheme,
  createThemeId,
  // Theme options
  getCustomThemeOptions,
  getAllThemeOptions,
  getBuiltInThemeOptions,
  // Import/export
  exportThemeAsJSON,
  importThemeFromJSON,
  // Built-in theme utilities
  getThemeIds,
} from '@ui-kit/core';

/**
 * Built-in theme IDs type (derived from core)
 */
export type BuiltInThemeId = ReturnType<typeof import('@ui-kit/core').getThemeIds>[number];

/**
 * Fetch the theme manifest for version checking
 */
export async function fetchThemeManifest(): Promise<import('@ui-kit/core').ThemeManifest | null> {
  try {
    const response = await fetch('/themes/manifest.json');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    console.warn('Failed to fetch theme manifest');
    return null;
  }
}

/**
 * Check if a stored theme has updates available from the server
 */
export async function checkThemeUpdates(
  storedTheme: import('@ui-kit/core').StoredTheme
): Promise<{ hasUpdate: boolean; serverVersion?: number }> {
  if (!storedTheme.baseTheme) {
    return { hasUpdate: false };
  }

  const manifest = await fetchThemeManifest();
  if (!manifest) {
    return { hasUpdate: false };
  }

  const serverTheme = manifest.themes[storedTheme.baseTheme];
  if (!serverTheme) {
    return { hasUpdate: false };
  }

  const hasUpdate = storedTheme.baseVersion !== undefined &&
    serverTheme.version > storedTheme.baseVersion;

  return {
    hasUpdate,
    serverVersion: serverTheme.version,
  };
}
