/**
 * @claude-flow/ui-kit
 *
 * Framework-agnostic UI foundation with CSS variables and themes
 */

// Export theme manager and types
export {
  ThemeManager,
  themeManager,
  type Theme,
  type ThemeMode,
  type ThemePreferences,
  type ThemeChangeEvent,
} from './scripts/theme-manager.js';

// Export web components (framework-agnostic)
export { ThemePreview } from './components/index';

// Web component types are automatically available via TypeScript ambient declarations

// Export utility functions
export const UIKit = {
  /**
   * Initialize the UI kit (applies theme from localStorage)
   */
  init(): void {
    // The theme-init.js script handles this automatically
    // This method is here for explicit initialization if needed
    if (
      typeof window !== 'undefined' &&
      (
        window as unknown as {
          __claudeFlowTheme?: { setTheme: (theme: string, mode: string) => void };
        }
      ).__claudeFlowTheme
    ) {
      const stored = localStorage.getItem('claude-flow-theme');
      if (stored) {
        try {
          const prefs = JSON.parse(stored);
          (
            window as unknown as {
              __claudeFlowTheme: { setTheme: (theme: string, mode: string) => void };
            }
          ).__claudeFlowTheme.setTheme(prefs.theme, prefs.mode);
        } catch {
          // Use defaults
        }
      }
    }
  },

  /**
   * Get current theme
   */
  getCurrentTheme(): string {
    if (typeof document === 'undefined') return 'default';
    return document.documentElement.getAttribute('data-theme') || 'default';
  },

  /**
   * Get current mode
   */
  getCurrentMode(): string {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.getAttribute('data-mode') || 'light';
  },

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Check if user prefers dark mode
   */
  prefersDarkMode(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  /**
   * Get CSS variable value
   */
  getCSSVariable(name: string): string {
    if (typeof window === 'undefined') return '';
    const computed = window.getComputedStyle(document.documentElement);
    return computed.getPropertyValue(name).trim();
  },

  /**
   * Set CSS variable value
   */
  setCSSVariable(name: string, value: string): void {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty(name, value);
  },
};