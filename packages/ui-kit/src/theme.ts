/**
 * UI Kit Theme System
 * 
 * Single source of truth for theme management.
 * This module handles theme loading, persistence, and switching.
 */

// ============================================================================
// Types
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  theme: string;
  mode: ThemeMode;
}

export interface ThemePreferences extends ThemeConfig {
  timestamp: number;
}

export interface ThemeInfo {
  id: string;
  name: string;
  description?: string;
  modes: ThemeMode[];
}

export interface ThemeChangeEvent {
  theme: string;
  mode: ThemeMode;
  effectiveMode: 'light' | 'dark';
  reason?: 'manual' | 'system' | 'storage';
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'ui-kit-theme';
const DEFAULT_THEME = 'default';
const DEFAULT_MODE: ThemeMode = 'auto';

// Make theme base path configurable for different environments
const getThemeBasePath = (): string => {
  // Check if we're being served from a local directory with assets folder
  // (mockups use assets/ symlink to ui-kit dist)
  if (typeof window !== 'undefined') {
    // Check if a custom base path is defined
    if ((window as any).__uiKitBasePath) {
      // Safely append themes/ to the base path
      const basePath = (window as any).__uiKitBasePath;
      return basePath.endsWith('/') ? `${basePath}themes/` : `${basePath}/themes/`;
    }
    
    // Check if assets/themes exists (mockup environment)
    const pathname = window.location.pathname;
    const isLocalMockup = pathname.endsWith('.html') && 
                          !pathname.startsWith('/themes/') &&
                          !pathname.startsWith('/assets/');
    if (isLocalMockup) {
      // For mockups, always use assets/themes/
      return 'assets/themes/';
    }
  }
  // Default to root themes directory
  return '/themes/';
};

// ============================================================================
// Internal State
// ============================================================================

const loadedThemeFiles = new Set<string>();
const listeners = new Set<(event: ThemeChangeEvent) => void>();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the system's preferred color scheme
 */
function getSystemColorScheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Resolve 'auto' mode to actual light/dark
 */
function resolveEffectiveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') {
    return getSystemColorScheme();
  }
  return mode;
}

/**
 * Get default theme from HTML attribute
 */
function getDefaultTheme(): string {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-default-theme') || DEFAULT_THEME;
  }
  return DEFAULT_THEME;
}

/**
 * Load a theme CSS file
 */
async function loadThemeFile(theme: string, mode: 'light' | 'dark'): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  
  const themeFile = `${theme}-${mode}`;
  
  // Already loaded
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
    
    // Create and inject CSS link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${getThemeBasePath()}${themeFile}.css`;
    link.setAttribute('data-theme-file', themeFile);
    
    document.head.appendChild(link);
    loadedThemeFiles.add(themeFile);
    
    // Wait for load
    return new Promise((resolve) => {
      link.onload = () => resolve(true);
      link.onerror = () => {
        loadedThemeFiles.delete(themeFile);
        console.error(`Failed to load theme file: ${themeFile}`);
        resolve(false);
      };
    });
  } catch (error) {
    console.error(`Failed to load theme "${theme}" (${mode}):`, error);
    return false;
  }
}

/**
 * Apply theme attributes to DOM
 */
function applyThemeToDOM(theme: string, mode: ThemeMode, effectiveMode: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  
  const element = document.documentElement;
  
  // Add transitioning class
  element.classList.add('theme-transitioning');
  
  // Set attributes
  element.setAttribute('data-theme', theme);
  element.setAttribute('data-theme-mode', mode); // Original mode preference
  element.setAttribute('data-theme-type', effectiveMode); // Actual light/dark
  
  // Remove transitioning class after animation frame
  requestAnimationFrame(() => {
    setTimeout(() => {
      element.classList.remove('theme-transitioning');
    }, 50);
  });
}

/**
 * Save preferences to localStorage
 */
function savePreferences(theme: string, mode: ThemeMode): void {
  if (typeof localStorage === 'undefined') return;
  
  try {
    const preferences: ThemePreferences = {
      theme,
      mode,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save theme preferences:', error);
  }
}

/**
 * Load preferences from localStorage
 */
function loadPreferences(): ThemePreferences | null {
  if (typeof localStorage === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Handle both old and new formats for backwards compatibility
      return {
        theme: parsed.theme || DEFAULT_THEME,
        mode: parsed.mode || parsed.type || DEFAULT_MODE,
        timestamp: parsed.timestamp || Date.now(),
      };
    }
  } catch (error) {
    console.warn('Failed to load theme preferences:', error);
  }
  
  return null;
}

/**
 * Notify all listeners of theme change
 */
function notifyListeners(event: ThemeChangeEvent): void {
  listeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in theme change listener:', error);
    }
  });
  
  // Also dispatch a DOM event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('themechange', { detail: event }));
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Set the current theme
 */
export async function setTheme(config: Partial<ThemeConfig>): Promise<boolean> {
  const current = getTheme();
  const theme = config.theme ?? current.theme;
  const mode = config.mode ?? current.mode;
  const effectiveMode = resolveEffectiveMode(mode);
  
  // Load theme CSS file
  const loaded = await loadThemeFile(theme, effectiveMode);
  if (!loaded && theme !== DEFAULT_THEME) {
    // Fallback to default theme
    console.warn(`Failed to load theme "${theme}", falling back to default`);
    await loadThemeFile(DEFAULT_THEME, effectiveMode);
  }
  
  // Apply to DOM
  applyThemeToDOM(loaded ? theme : DEFAULT_THEME, mode, effectiveMode);
  
  // Save preferences
  savePreferences(loaded ? theme : DEFAULT_THEME, mode);
  
  // Notify listeners
  notifyListeners({
    theme: loaded ? theme : DEFAULT_THEME,
    mode,
    effectiveMode,
    reason: 'manual',
  });
  
  return loaded;
}

/**
 * Get the current theme configuration
 */
export function getTheme(): ThemeConfig {
  if (typeof document === 'undefined') {
    return { theme: DEFAULT_THEME, mode: DEFAULT_MODE };
  }
  
  const theme = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  const mode = (document.documentElement.getAttribute('data-theme-mode') as ThemeMode) || DEFAULT_MODE;
  
  return { theme, mode };
}

/**
 * Get the effective mode (resolved auto to light/dark)
 */
export function getEffectiveMode(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  
  const mode = document.documentElement.getAttribute('data-theme-type') as 'light' | 'dark';
  return mode || getSystemColorScheme();
}

/**
 * Get available themes
 */
export async function getAvailableThemes(): Promise<ThemeInfo[]> {
  try {
    const response = await fetch(`${getThemeBasePath()}theme-manifest.json`);
    const manifest = await response.json();
    return manifest.themes || [];
  } catch (error) {
    console.error('Failed to load theme manifest:', error);
    // Return default list
    return [
      { id: 'default', name: 'Default', modes: ['light', 'dark'] },
      { id: 'ocean', name: 'Ocean', modes: ['light', 'dark'] },
      { id: 'forest', name: 'Forest', modes: ['light', 'dark'] },
      { id: 'sunset', name: 'Sunset', modes: ['light', 'dark'] },
      { id: 'corporate', name: 'Corporate', modes: ['light', 'dark'] },
      { id: 'vibrant', name: 'Vibrant', modes: ['light', 'dark'] },
      { id: 'minimal', name: 'Minimal', modes: ['light', 'dark'] },
      { id: 'nature', name: 'Nature', modes: ['light', 'dark'] },
      { id: 'monochrome', name: 'Monochrome', modes: ['light', 'dark'] },
      { id: 'high-contrast', name: 'High Contrast', modes: ['light', 'dark'] },
      { id: 'midnight', name: 'Midnight', modes: ['light', 'dark'] },
      { id: 'spring', name: 'Spring', modes: ['light', 'dark'] },
      { id: 'autumn', name: 'Autumn', modes: ['light', 'dark'] },
      { id: 'arctic', name: 'Arctic', modes: ['light', 'dark'] },
      { id: 'retro', name: 'Retro', modes: ['light', 'dark'] },
    ];
  }
}

/**
 * Initialize theme from stored preferences
 */
export async function init(): Promise<void> {
  const preferences = loadPreferences();
  const theme = preferences?.theme || getDefaultTheme();
  const mode = preferences?.mode || DEFAULT_MODE;
  
  await setTheme({ theme, mode });
}

/**
 * Reset to default theme
 */
export async function reset(): Promise<void> {
  await setTheme({ theme: getDefaultTheme(), mode: DEFAULT_MODE });
}

/**
 * Toggle between light and dark modes
 */
export async function toggleMode(): Promise<void> {
  const effectiveMode = getEffectiveMode();
  const newMode: ThemeMode = effectiveMode === 'light' ? 'dark' : 'light';
  await setTheme({ mode: newMode });
}

/**
 * Subscribe to theme changes
 */
export function subscribe(listener: (event: ThemeChangeEvent) => void): () => void {
  listeners.add(listener);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Preload theme files for faster switching
 */
export async function preloadThemes(themes: string[]): Promise<void> {
  const promises: Promise<boolean>[] = [];
  
  for (const theme of themes) {
    promises.push(loadThemeFile(theme, 'light'));
    promises.push(loadThemeFile(theme, 'dark'));
  }
  
  await Promise.all(promises);
}

// ============================================================================
// Auto-initialization
// ============================================================================

// Listen for system color scheme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleSystemChange = async () => {
    const { mode } = getTheme();
    if (mode === 'auto') {
      // Re-apply current theme with auto mode to pick up system change
      const { theme } = getTheme();
      const effectiveMode = getSystemColorScheme();
      
      // Load new theme file if needed
      await loadThemeFile(theme, effectiveMode);
      
      // Apply to DOM
      applyThemeToDOM(theme, 'auto', effectiveMode);
      
      // Notify listeners
      notifyListeners({
        theme,
        mode: 'auto',
        effectiveMode,
        reason: 'system',
      });
    }
  };
  
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemChange);
  } else if ('addListener' in mediaQuery) {
    // Fallback for older browsers
    (mediaQuery as any).addListener(handleSystemChange);
  }
}

// Listen for storage changes (theme changes in other tabs)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', async (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const preferences: ThemePreferences = JSON.parse(event.newValue);
        const effectiveMode = resolveEffectiveMode(preferences.mode);
        
        // Load and apply theme
        await loadThemeFile(preferences.theme, effectiveMode);
        applyThemeToDOM(preferences.theme, preferences.mode, effectiveMode);
        
        // Notify listeners
        notifyListeners({
          theme: preferences.theme,
          mode: preferences.mode,
          effectiveMode,
          reason: 'storage',
        });
      } catch (error) {
        console.error('Failed to apply theme from storage event:', error);
      }
    }
  });
}

// ============================================================================
// Global API for backwards compatibility
// ============================================================================

if (typeof window !== 'undefined') {
  // Import types for proper typing
  /// <reference path="./globals.d.ts" />
  
  // Create global API object
  const globalAPI = {
    setTheme,
    getTheme,
    getEffectiveMode,
    getAvailableThemes,
    init,
    reset,
    toggleMode,
    subscribe,
    preloadThemes,
    
    // Backwards compatibility aliases
    loadTheme: (theme: string, mode?: ThemeMode) => setTheme({ theme, mode }),
    setThemeType: (mode: ThemeMode) => setTheme({ mode }),
    toggleThemeType: toggleMode,
    getThemeType: getEffectiveMode,
  };
  
  // Expose as global with proper typing
  window.__uiKitTheme = globalAPI;
  window.uiKitTheme = globalAPI; // Alternative global name
}

// ============================================================================
// Auto-initialization on module load
// ============================================================================

// Auto-initialize theme from stored preferences when module loads
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
    });
  } else {
    // DOM is already ready, initialize immediately
    init();
  }
}