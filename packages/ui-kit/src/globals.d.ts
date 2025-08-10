/**
 * Global type declarations for UI Kit window APIs
 * 
 * These types are for utilities exposed on the window object by theme.js and theme-switcher.js
 * Import this file in your TypeScript project to get proper typing for these APIs.
 */

declare global {
  interface Window {
    /**
     * UI Kit Theme API
     * Exposed by theme.js for managing themes and modes
     */
    __uiKitTheme?: UIKitThemeAPI;
    uiKitTheme?: UIKitThemeAPI;
    
    /**
     * Theme Switcher UI helpers
     * Exposed by theme-switcher.js for creating theme switcher UI
     */
    createThemeSwitcher?: typeof createThemeSwitcher;
    initThemeSwitcher?: typeof initThemeSwitcher;
    
    /**
     * Custom base path configuration
     * Set to 'assets/' for mockups, themes will be loaded from assets/themes/
     */
    __uiKitBasePath?: string;
  }
}

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

export interface UIKitThemeAPI {
  // Core functions
  setTheme(config: Partial<ThemeConfig>): Promise<boolean>;
  getTheme(): ThemeConfig;
  getEffectiveMode(): 'light' | 'dark';
  getAvailableThemes(): Promise<ThemeInfo[]>;
  init(): Promise<void>;
  reset(): Promise<void>;
  toggleMode(): Promise<void>;
  subscribe(listener: (event: ThemeChangeEvent) => void): () => void;
  preloadThemes(themes: string[]): Promise<void>;
  
  // Backwards compatibility aliases
  loadTheme(theme: string, mode?: ThemeMode): Promise<boolean>;
  setThemeType(mode: ThemeMode): Promise<boolean>;
  toggleThemeType(): Promise<void>;
  getThemeType(): 'light' | 'dark';
}

export interface ThemeSwitcherOptions {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
  autoInit?: boolean;
}

export declare function createThemeSwitcher(options?: Omit<ThemeSwitcherOptions, 'autoInit'>): HTMLElement;
export declare function initThemeSwitcher(options?: ThemeSwitcherOptions): Promise<void>;

export {};