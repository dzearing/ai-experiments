/**
 * UIKit Bootstrap
 *
 * A self-contained bootstrap script that:
 * 1. Can be inlined (zero flash) or imported (convenient)
 * 2. Reads localStorage for persisted theme/mode preferences
 * 3. Sets background color immediately to prevent flash
 * 4. Loads theme CSS files on demand (not all upfront)
 * 5. Exposes window.UIKit API for runtime theme changes
 *
 * Usage (inline in index.html for zero-flash):
 * <script>
 *   window.UIKitConfig = { basePath: '/node_modules/@ui-kit/core/dist/themes' };
 * </script>
 * <script src="/node_modules/@ui-kit/core/dist/bootstrap.js"></script>
 *
 * Or import in JS (may cause brief flash):
 * import '@ui-kit/core/bootstrap';
 *
 * API:
 * - UIKit.setTheme(theme, mode, callback) - Change theme, loads CSS, calls back when ready
 * - UIKit.getTheme() - Returns { theme, mode, resolvedMode }
 * - UIKit.subscribe(callback) - Subscribe to theme changes, returns unsubscribe function
 */

// Types
export interface UIKitConfig {
  /** Base path to theme CSS files (e.g., '/themes' or 'https://cdn.example.com/themes') */
  basePath?: string;
  /** Default theme name */
  defaultTheme?: string;
  /** Default mode: 'light', 'dark', or 'auto' */
  defaultMode?: 'light' | 'dark' | 'auto';
  /** Default background colors for immediate flash prevention */
  defaultBg?: { light: string; dark: string };
}

export interface UIKitThemeState {
  theme: string;
  mode: 'light' | 'dark' | 'auto';
  resolvedMode: 'light' | 'dark';
}

export type ThemeCallback = (state: UIKitThemeState) => void;

export interface UIKitAPI {
  /** Set theme and/or mode. Loads CSS on demand and calls back when ready. */
  setTheme: (theme: string, mode?: 'light' | 'dark' | 'auto', callback?: ThemeCallback) => void;
  /** Get current theme state */
  getTheme: () => UIKitThemeState;
  /** Subscribe to theme changes. Returns unsubscribe function. */
  subscribe: (callback: ThemeCallback) => () => void;
  /** Reconfigure UIKit (e.g., change basePath) */
  configure: (config: UIKitConfig) => void;
}

// Storage key
const STORAGE_KEY = 'uikit-theme';

// State
let config: Required<UIKitConfig> = {
  basePath: '/themes',
  defaultTheme: 'default',
  defaultMode: 'auto',
  defaultBg: { light: '#fafafa', dark: '#0f0f0f' },
};

let currentState: UIKitThemeState = {
  theme: 'default',
  mode: 'auto',
  resolvedMode: 'light',
};

const loadedCSS = new Map<string, HTMLLinkElement>();
const subscribers = new Set<ThemeCallback>();

/**
 * Resolve 'auto' mode to actual light/dark based on system preference
 */
function resolveMode(mode: 'light' | 'dark' | 'auto'): 'light' | 'dark' {
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Get stored theme settings from localStorage
 */
function getStoredSettings(): { theme?: string; mode?: 'light' | 'dark' | 'auto'; bg?: { light?: string; dark?: string } } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save theme settings to localStorage
 */
function saveSettings(state: UIKitThemeState, bgColor?: string): void {
  try {
    const existing = getStoredSettings() || {};
    const bg = existing.bg || {};
    if (bgColor) {
      bg[state.resolvedMode] = bgColor;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: state.theme,
      mode: state.mode,
      bg,
    }));
  } catch {
    // Storage not available
  }
}

/**
 * Load a theme CSS file
 */
function loadThemeCSS(theme: string, mode: 'light' | 'dark', callback?: () => void): void {
  const key = `${theme}-${mode}`;

  // Already loaded
  if (loadedCSS.has(key)) {
    callback?.();
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${config.basePath}/${key}.css`;
  link.id = `uikit-theme-${key}`;

  link.onload = () => {
    loadedCSS.set(key, link);
    callback?.();
  };

  link.onerror = () => {
    console.error(`[UIKit] Failed to load theme: ${link.href}`);
    callback?.();
  };

  document.head.appendChild(link);
}

/**
 * Apply theme state to DOM
 */
function applyToDOM(state: UIKitThemeState): void {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.mode = state.resolvedMode;
}

/**
 * Notify all subscribers of state change
 */
function notifySubscribers(): void {
  const stateCopy = { ...currentState };
  subscribers.forEach(cb => cb(stateCopy));
}

/**
 * Set theme with CSS loading and callback
 */
function setTheme(theme: string, mode?: 'light' | 'dark' | 'auto', callback?: ThemeCallback): void {
  const newMode = mode ?? currentState.mode;
  const resolvedMode = resolveMode(newMode);

  const newState: UIKitThemeState = {
    theme,
    mode: newMode,
    resolvedMode,
  };

  // Load the CSS file, then apply
  loadThemeCSS(theme, resolvedMode, () => {
    currentState = newState;
    applyToDOM(currentState);

    // Save with current background color for flash prevention
    const computedBg = getComputedStyle(document.documentElement).getPropertyValue('--page-bg').trim();
    saveSettings(currentState, computedBg || undefined);

    notifySubscribers();
    callback?.(currentState);
  });
}

/**
 * Get current theme state
 */
function getTheme(): UIKitThemeState {
  return { ...currentState };
}

/**
 * Subscribe to theme changes
 */
function subscribe(callback: ThemeCallback): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Configure UIKit
 */
function configure(newConfig: UIKitConfig): void {
  config = { ...config, ...newConfig };
}

/**
 * Initialize UIKit - called automatically when script loads
 */
function init(): void {
  // Check for user config
  const userConfig = (window as unknown as { UIKitConfig?: UIKitConfig }).UIKitConfig;
  if (userConfig) {
    configure(userConfig);
  }

  // Try to detect basePath from script src if not configured
  if (!userConfig?.basePath) {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && src.includes('bootstrap')) {
        // Extract base path from script location
        const match = src.match(/(.*)\/bootstrap/);
        if (match) {
          config.basePath = `${match[1]}/themes`;
        }
        break;
      }
    }
  }

  // Load stored settings
  const stored = getStoredSettings();

  // Determine initial theme/mode
  let theme = stored?.theme ?? config.defaultTheme;
  let mode: 'light' | 'dark' | 'auto' = stored?.mode ?? config.defaultMode;

  // Check for high-contrast preference (if no stored preference)
  if (!stored && window.matchMedia('(prefers-contrast: more)').matches) {
    theme = 'high-contrast';
  }

  const resolvedMode = resolveMode(mode);

  // Set background color IMMEDIATELY (before CSS loads) to prevent flash
  const bgColor = stored?.bg?.[resolvedMode] ?? config.defaultBg[resolvedMode];
  document.documentElement.style.backgroundColor = bgColor;

  // Set data attributes immediately
  currentState = { theme, mode, resolvedMode };
  applyToDOM(currentState);

  // Load the theme CSS
  loadThemeCSS(theme, resolvedMode);

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentState.mode === 'auto') {
      const newResolvedMode = resolveMode('auto');
      if (newResolvedMode !== currentState.resolvedMode) {
        setTheme(currentState.theme, 'auto');
      }
    }
  });
}

// Check if UIKit was already initialized by inline bootstrap
const existingUIKit = (window as unknown as { UIKit?: UIKitAPI }).UIKit;

if (existingUIKit) {
  // Inline bootstrap already initialized - sync our state from it
  const existingState = existingUIKit.getTheme();
  currentState = { ...existingState };

  // Subscribe to changes from the inline UIKit
  existingUIKit.subscribe((state) => {
    currentState = { ...state };
    notifySubscribers();
  });
} else {
  // No inline bootstrap - initialize normally
  init();
}

// Create and expose the API
const UIKit: UIKitAPI = existingUIKit ?? {
  setTheme,
  getTheme,
  subscribe,
  configure,
};

// Expose globally (may already be set by inline bootstrap)
if (!existingUIKit) {
  (window as unknown as { UIKit: UIKitAPI }).UIKit = UIKit;
}

// Export for module usage
export { UIKit, setTheme, getTheme, subscribe, configure };
export default UIKit;

// Re-export inline bootstrap generators from build module
// These are the canonical implementations - use these for generating inline scripts
export { getInlineBootstrap, getInlineBootstrapPretty } from '../build/inline-bootstrap.js';
