/**
 * Theme Manager
 *
 * TypeScript API for managing themes programmatically
 */

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    // Add more as needed
  };
}

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemePreferences {
  theme: string;
  mode: ThemeMode;
  timestamp: number;
}

export interface ThemeChangeEvent {
  theme: string;
  mode: ThemeMode;
}

export class ThemeManager {
  private static STORAGE_KEY = 'claude-flow-theme';
  private static DEFAULT_THEME = 'default';
  private static DEFAULT_MODE: ThemeMode = 'auto';

  private listeners: Array<(event: ThemeChangeEvent) => void> = [];

  constructor() {
    // Listen for theme changes from other tabs/windows
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      window.addEventListener('themechange', this.handleThemeChange.bind(this));
    }
  }

  /**
   * Get the current theme ID
   */
  get currentTheme(): string {
    if (typeof document === 'undefined') return ThemeManager.DEFAULT_THEME;
    return document.documentElement.getAttribute('data-theme') || ThemeManager.DEFAULT_THEME;
  }

  /**
   * Get the current mode
   */
  get currentMode(): ThemeMode {
    if (typeof document === 'undefined') return ThemeManager.DEFAULT_MODE;
    const mode = document.documentElement.getAttribute('data-mode');
    return (mode as ThemeMode) || this.getEffectiveMode();
  }

  /**
   * Get list of available themes
   */
  get themes(): Theme[] {
    return [
      {
        id: 'default',
        name: 'Default',
        description: 'Clean and professional',
        colors: { primary: '#03a9f4', secondary: '#9c27b0' },
      },
      {
        id: 'corporate',
        name: 'Corporate',
        description: 'Business-focused design',
        colors: { primary: '#0078d4', secondary: '#40587c' },
      },
      {
        id: 'vibrant',
        name: 'Vibrant',
        description: 'Bold and energetic',
        colors: { primary: '#ff4081', secondary: '#7c4dff' },
      },
      {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple and understated',
        colors: { primary: '#607d8b', secondary: '#795548' },
      },
      {
        id: 'nature',
        name: 'Nature',
        description: 'Earth tones and greens',
        colors: { primary: '#4caf50', secondary: '#8bc34a' },
      },
      {
        id: 'ocean',
        name: 'Ocean',
        description: 'Cool blues and aquas',
        colors: { primary: '#00bcd4', secondary: '#0097a7' },
      },
      {
        id: 'sunset',
        name: 'Sunset',
        description: 'Warm oranges and reds',
        colors: { primary: '#ff5722', secondary: '#ff9800' },
      },
      {
        id: 'monochrome',
        name: 'Monochrome',
        description: 'Grayscale only',
        colors: { primary: '#616161', secondary: '#424242' },
      },
    ];
  }

  /**
   * Set the current theme
   */
  setTheme(themeId: string): void {
    const mode = this.getStoredPreferences()?.mode || ThemeManager.DEFAULT_MODE;
    this.applyTheme(themeId, mode);
  }

  /**
   * Set the current mode
   */
  setMode(mode: ThemeMode): void {
    const theme = this.currentTheme;
    this.applyTheme(theme, mode);
  }

  /**
   * Reset to default theme and mode
   */
  reset(): void {
    this.applyTheme(ThemeManager.DEFAULT_THEME, ThemeManager.DEFAULT_MODE);
  }

  /**
   * Subscribe to theme changes
   */
  on(_event: 'themechange', callback: (event: ThemeChangeEvent) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Unsubscribe from theme changes
   */
  off(_event: 'themechange', callback: (event: ThemeChangeEvent) => void): void {
    this.listeners = this.listeners.filter((cb) => cb !== callback);
  }

  /**
   * Export current theme as CSS
   */
  exportAsCSS(): string {
    const theme = this.currentTheme;
    const mode = this.currentMode;

    // This would generate CSS based on current computed styles
    // For now, return a placeholder
    return `/* Theme: ${theme}, Mode: ${mode} */\n/* Generated CSS would go here */`;
  }

  /**
   * Create a custom theme
   */
  createCustomTheme(config: Partial<Theme>): Theme {
    const theme: Theme = {
      id: config.id || `custom-${Date.now()}`,
      name: config.name || 'Custom Theme',
      description: config.description || 'A custom theme',
      colors: config.colors || { primary: '#03a9f4', secondary: '#9c27b0' },
    };

    // In a real implementation, this would save the theme
    return theme;
  }

  private applyTheme(theme: string, mode: ThemeMode): void {
    if (typeof window === 'undefined') return;

    // Use the global theme utilities
    const themeUtils = (
      window as unknown as {
        __claudeFlowTheme?: { setTheme: (theme: string, mode: string) => void };
      }
    ).__claudeFlowTheme;
    if (themeUtils) {
      themeUtils.setTheme(theme, mode);
    }

    // Notify listeners
    this.notifyListeners({ theme, mode });
  }

  private getStoredPreferences(): ThemePreferences | null {
    if (typeof localStorage === 'undefined') return null;

    try {
      const stored = localStorage.getItem(ThemeManager.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private getEffectiveMode(): ThemeMode {
    const stored = this.getStoredPreferences();
    if (stored?.mode && stored.mode !== 'auto') {
      return stored.mode;
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return isDark ? 'dark' : 'light';
    }

    return 'light';
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key === ThemeManager.STORAGE_KEY && event.newValue) {
      try {
        const preferences: ThemePreferences = JSON.parse(event.newValue);
        this.applyTheme(preferences.theme, preferences.mode);
      } catch {
        // Ignore parse errors
      }
    }
  }

  private handleThemeChange(event: Event): void {
    const customEvent = event as CustomEvent<ThemeChangeEvent>;
    this.notifyListeners(customEvent.detail);
  }

  private notifyListeners(event: ThemeChangeEvent): void {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();
