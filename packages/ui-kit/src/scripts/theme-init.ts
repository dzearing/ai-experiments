/**
 * Theme Initialization Script
 *
 * This script should be included in the <head> of your HTML document
 * to prevent flash of unstyled content (FOUC) on page load.
 *
 * It reads theme preferences from localStorage and applies them
 * immediately, before the page renders.
 *
 * Enhanced version that dynamically loads theme CSS files.
 */

// Type definitions
interface ThemePreferences {
  theme: string;
  type: ThemeType;
  timestamp: number;
}

type ThemeType = 'light' | 'dark' | 'auto';

interface ThemeChangeEventDetail {
  theme: string;
  type: 'light' | 'dark';
  requestedType: ThemeType;
  reason?: string;
}

interface PreloadThemeSpec {
  name: string;
  type: 'light' | 'dark';
}

interface ThemeManifest {
  themes: Array<{
    id: string;
    name: string;
    modes: string[];
  }>;
}

// Extend the window object for this IIFE context
interface ThemeAPI {
  loadTheme: (themeName: string, themeType?: ThemeType, element?: HTMLElement) => Promise<boolean>;
  preloadThemes: (themes: Array<string | PreloadThemeSpec>) => Promise<void>;
  applyThemeToElement: (element: HTMLElement, theme: string, type?: ThemeType) => Promise<boolean>;
  getTheme: (element?: HTMLElement) => string | null;
  getThemeType: (element?: HTMLElement) => 'light' | 'dark' | null;
  setThemeType: (type: ThemeType) => Promise<boolean>;
  toggleThemeType: () => Promise<boolean>;
  isThemeFileLoaded: (themeName: string, themeType: 'light' | 'dark') => boolean;
  getLoadedThemeFiles: () => string[];
  getAvailableThemes: () => Promise<Array<{ id: string; name: string; modes: string[] }>>;
  reset: () => Promise<boolean>;
}

(function () {
  'use strict';

  // Configuration
  const STORAGE_KEY = 'claude-flow-theme';
  const DEFAULT_THEME = 'default';
  const DEFAULT_TYPE: ThemeType = 'auto';
  const THEME_BASE_PATH = '/themes/';

  // Track loaded theme files
  const loadedThemeFiles = new Set<string>();

  // Helper to get system preference
  function getSystemThemeType(): 'light' | 'dark' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Get current effective theme type
  function getEffectiveThemeType(requestedType?: ThemeType): 'light' | 'dark' {
    // If not specified or 'auto', use system preference
    if (!requestedType || requestedType === 'auto') {
      return getSystemThemeType();
    }
    return requestedType;
  }

  // Get default theme from HTML attribute
  function getDefaultTheme(): string {
    const htmlElement = document.documentElement;
    return htmlElement.getAttribute('data-default-theme') || DEFAULT_THEME;
  }

  // Load specific theme file if not already loaded
  async function ensureThemeFileLoaded(
    themeName: string,
    themeType: 'light' | 'dark'
  ): Promise<boolean> {
    const themeFile = `${themeName}-${themeType}`;

    if (loadedThemeFiles.has(themeFile)) {
      return true;
    }

    try {
      // Check if already in DOM
      const existingLink = document.querySelector<HTMLLinkElement>(
        `link[data-theme-file="${themeFile}"]`
      );
      if (existingLink) {
        loadedThemeFiles.add(themeFile);
        return true;
      }

      // Create and inject theme CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${THEME_BASE_PATH}${themeFile}.css`;
      link.setAttribute('data-theme-file', themeFile);

      // Add to head
      document.head.appendChild(link);

      // Mark as loaded immediately for sync behavior
      loadedThemeFiles.add(themeFile);

      // Return promise for async loading
      return new Promise((resolve) => {
        link.onload = () => resolve(true);
        link.onerror = () => {
          loadedThemeFiles.delete(themeFile);
          console.error(`Failed to load theme file: ${themeFile}`);
          resolve(false);
        };
      });
    } catch (error) {
      console.error(`Failed to load theme "${themeName}" (${themeType}):`, error);
      return false;
    }
  }

  // Apply theme attributes to element
  function applyTheme(themeName: string, themeType: 'light' | 'dark', element?: HTMLElement): void {
    element = element || document.documentElement;

    // Add transitioning class to prevent flash
    element.classList.add('theme-transitioning');

    element.setAttribute('data-theme', themeName);
    element.setAttribute('data-theme-type', themeType);

    // Remove transitioning class after a frame
    requestAnimationFrame(() => {
      setTimeout(() => {
        element.classList.remove('theme-transitioning');
      }, 50);
    });
  }

  // Main theme loading function
  async function loadTheme(
    themeName: string,
    themeType?: ThemeType,
    element?: HTMLElement
  ): Promise<boolean> {
    element = element || document.documentElement;

    // Get effective theme type (handles auto/undefined)
    const effectiveType = getEffectiveThemeType(themeType);

    // Ensure theme file is loaded
    const loaded = await ensureThemeFileLoaded(themeName, effectiveType);
    if (!loaded && themeName !== DEFAULT_THEME) {
      // Fallback to default theme if loading fails
      console.warn(`Falling back to default theme`);
      await ensureThemeFileLoaded(DEFAULT_THEME, effectiveType);
      themeName = DEFAULT_THEME;
    }

    // Apply theme attributes
    applyTheme(themeName, effectiveType, element);

    // Save preference if applying to root
    if (element === document.documentElement) {
      try {
        const preferences: ThemePreferences = {
          theme: themeName,
          type: themeType || 'auto', // Store original value, not resolved
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (e) {
        console.warn('Failed to save theme preferences:', e);
      }

      // Dispatch event
      const detail: ThemeChangeEventDetail = {
        theme: themeName,
        type: effectiveType,
        requestedType: themeType || 'auto',
      };
      window.dispatchEvent(new CustomEvent('themechange', { detail }));
    }

    return true;
  }

  // Initialize theme
  async function initTheme(): Promise<void> {
    // Get default from HTML attribute
    const defaultTheme = getDefaultTheme();

    // Get stored preferences
    let preferences: ThemePreferences | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        preferences = JSON.parse(stored) as ThemePreferences;
      }
    } catch (e) {
      console.warn('Failed to read theme preferences:', e);
    }

    // Determine theme and type
    const theme = preferences?.theme || defaultTheme;
    const type = preferences?.type; // undefined will use system default

    // Load and apply theme
    await loadTheme(theme, type);
  }

  // Set immediate attributes to prevent FOUC
  const defaultTheme = getDefaultTheme();
  const immediateType = getSystemThemeType();
  document.documentElement.setAttribute('data-theme', defaultTheme);
  document.documentElement.setAttribute('data-theme-type', immediateType);

  // Try to load theme file immediately (sync check only)
  const themeFile = `${defaultTheme}-${immediateType}`;
  const existingLink = document.querySelector<HTMLLinkElement>(
    `link[data-theme-file="${themeFile}"]`
  );
  if (existingLink) {
    loadedThemeFiles.add(themeFile);
  }

  // Listen for system theme changes
  function setupSystemThemeListener(): void {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = async function (): Promise<void> {
        const currentPrefs = JSON.parse(
          localStorage.getItem(STORAGE_KEY) || '{}'
        ) as Partial<ThemePreferences>;
        if (!currentPrefs.type || currentPrefs.type === 'auto') {
          const newType = getSystemThemeType();
          const theme = currentPrefs.theme || getDefaultTheme();

          // Load new theme file and apply
          await ensureThemeFileLoaded(theme, newType);
          applyTheme(theme, newType);

          // Dispatch event for system change
          const detail: ThemeChangeEventDetail = {
            theme: theme,
            type: newType,
            requestedType: 'auto',
            reason: 'system-change',
          };
          window.dispatchEvent(new CustomEvent('themechange', { detail }));
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if ('addListener' in mediaQuery) {
        // Fallback for older browsers
        // Type assertion for older browsers that don't have addEventListener
        (
          mediaQuery as MediaQueryList & { addListener: (listener: () => void) => void }
        ).addListener(handleChange);
      }
    }
  }

  // Initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initTheme();
      setupSystemThemeListener();
    });
  } else {
    initTheme();
    setupSystemThemeListener();
  }

  // Preload theme files
  async function preloadThemes(themes: Array<string | PreloadThemeSpec>): Promise<void> {
    const promises: Promise<boolean>[] = [];
    for (const theme of themes) {
      if (typeof theme === 'string') {
        // Preload both light and dark
        promises.push(ensureThemeFileLoaded(theme, 'light'));
        promises.push(ensureThemeFileLoaded(theme, 'dark'));
      } else {
        // Preload specific combination
        promises.push(ensureThemeFileLoaded(theme.name, theme.type));
      }
    }
    await Promise.all(promises);
  }

  // Global API
  const themeAPI: ThemeAPI = {
    // Main theme loading function (type is optional, uses system default)
    loadTheme: loadTheme,

    // Preload themes for instant switching
    preloadThemes: preloadThemes,

    // Apply theme to specific element
    applyThemeToElement: function (
      element: HTMLElement,
      theme: string,
      type?: ThemeType
    ): Promise<boolean> {
      return loadTheme(theme, type, element);
    },

    // Get current theme
    getTheme: function (element?: HTMLElement): string | null {
      element = element || document.documentElement;
      return element.getAttribute('data-theme');
    },

    // Get current type
    getThemeType: function (element?: HTMLElement): 'light' | 'dark' | null {
      element = element || document.documentElement;
      return element.getAttribute('data-theme-type') as 'light' | 'dark' | null;
    },

    // Set theme type only (light/dark/auto)
    setThemeType: function (type: ThemeType): Promise<boolean> {
      const currentTheme = this.getTheme();
      return loadTheme(currentTheme || DEFAULT_THEME, type);
    },

    // Toggle between light and dark
    toggleThemeType: async function (): Promise<boolean> {
      const currentType = this.getThemeType();
      const newType: 'light' | 'dark' = currentType === 'light' ? 'dark' : 'light';
      const currentTheme = this.getTheme();
      return loadTheme(currentTheme || DEFAULT_THEME, newType);
    },

    // Check if theme file is loaded
    isThemeFileLoaded: function (themeName: string, themeType: 'light' | 'dark'): boolean {
      return loadedThemeFiles.has(`${themeName}-${themeType}`);
    },

    // Get all loaded theme files
    getLoadedThemeFiles: function (): string[] {
      return Array.from(loadedThemeFiles);
    },

    // Get available themes
    getAvailableThemes: async function (): Promise<
      Array<{ id: string; name: string; modes: string[] }>
    > {
      try {
        const response = await fetch(`${THEME_BASE_PATH}theme-manifest.json`);
        const manifest: ThemeManifest = await response.json();
        return manifest.themes;
      } catch (e) {
        console.error('Failed to load theme manifest:', e);
        return [];
      }
    },

    // Reset to default
    reset: function (): Promise<boolean> {
      const defaultTheme = getDefaultTheme();
      return loadTheme(defaultTheme, DEFAULT_TYPE);
    },
  };

  // Assign to window with proper type casting
  (
    window as unknown as { __claudeFlowTheme: ThemeAPI; loadTheme: ThemeAPI['loadTheme'] }
  ).__claudeFlowTheme = themeAPI;

  // Expose loadTheme as global for convenience
  (
    window as unknown as { __claudeFlowTheme: ThemeAPI; loadTheme: ThemeAPI['loadTheme'] }
  ).loadTheme = themeAPI.loadTheme;
})();
