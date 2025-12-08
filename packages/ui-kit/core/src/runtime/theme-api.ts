/**
 * Runtime Theme API
 *
 * Provides runtime theme switching capabilities.
 */

import type { ThemeMode, ThemeState } from '../themes/types';

const STORAGE_KEY = 'uikit-theme';

type ThemeSubscriber = (state: ThemeState) => void;

let currentState: ThemeState = {
  theme: 'default',
  mode: 'auto',
};

const subscribers = new Set<ThemeSubscriber>();

/**
 * Get the current theme state
 */
export function getTheme(): ThemeState {
  return { ...currentState };
}

/**
 * Set the theme and/or mode
 */
export async function setTheme(
  options: Partial<ThemeState>
): Promise<void> {
  const newState: ThemeState = {
    ...currentState,
    ...options,
  };

  // Don't update if nothing changed
  if (newState.theme === currentState.theme && newState.mode === currentState.mode) {
    return;
  }

  currentState = newState;

  // Persist to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  } catch {
    // Storage not available
  }

  // Update DOM
  applyThemeToDOM(currentState);

  // Notify subscribers
  for (const subscriber of subscribers) {
    subscriber(currentState);
  }
}

/**
 * Toggle between light and dark mode
 */
export async function toggleMode(): Promise<void> {
  const resolvedMode = resolveMode(currentState.mode);
  const newMode = resolvedMode === 'light' ? 'dark' : 'light';
  await setTheme({ mode: newMode });
}

/**
 * Subscribe to theme changes
 */
export function subscribe(callback: ThemeSubscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Initialize the theme system
 */
export function initTheme(): void {
  // Load from storage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<ThemeState>;
      if (parsed.theme) currentState.theme = parsed.theme;
      if (parsed.mode) currentState.mode = parsed.mode;
    }
  } catch {
    // Storage not available or invalid
  }

  // Check for high contrast preference
  if (currentState.theme === 'default' && window.matchMedia('(prefers-contrast: more)').matches) {
    currentState.theme = 'high-contrast';
  }

  // Apply to DOM
  applyThemeToDOM(currentState);

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentState.mode === 'auto') {
      applyThemeToDOM(currentState);
      for (const subscriber of subscribers) {
        subscriber(currentState);
      }
    }
  });
}

/**
 * Resolve 'auto' mode to actual light/dark
 */
function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/**
 * Apply theme state to the DOM
 */
function applyThemeToDOM(state: ThemeState): void {
  const resolvedMode = resolveMode(state.mode);

  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.mode = resolvedMode;

  // Load theme CSS if not already loaded
  const themeId = `uikit-theme-${state.theme}-${resolvedMode}`;
  if (!document.getElementById(themeId)) {
    const link = document.createElement('link');
    link.id = themeId;
    link.rel = 'stylesheet';
    link.href = `/themes/${state.theme}-${resolvedMode}.css`;
    document.head.appendChild(link);
  }
}

/**
 * Get available themes
 */
export function getThemes(): Promise<Array<{ id: string; name: string; category: string }>> {
  return Promise.resolve([
    // Core themes
    { id: 'default', name: 'Default', category: 'Core' },
    { id: 'minimal', name: 'Minimal', category: 'Core' },
    { id: 'high-contrast', name: 'High Contrast', category: 'Core' },
    // Microsoft family
    { id: 'github', name: 'GitHub', category: 'Microsoft' },
    { id: 'linkedin', name: 'LinkedIn', category: 'Microsoft' },
    { id: 'teams', name: 'Teams', category: 'Microsoft' },
    { id: 'onedrive', name: 'OneDrive', category: 'Microsoft' },
    { id: 'fluent', name: 'Fluent', category: 'Microsoft' },
    // Creative/Novelty
    { id: 'terminal', name: 'Terminal', category: 'Creative' },
    { id: 'matrix', name: 'Matrix', category: 'Creative' },
    { id: 'cyberpunk', name: 'Cyberpunk', category: 'Creative' },
    { id: 'sketchy', name: 'Sketchy', category: 'Creative' },
    { id: 'art-deco', name: 'Art Deco', category: 'Creative' },
    { id: 'retro', name: 'Retro', category: 'Creative' },
    // Nature/Mood
    { id: 'ocean', name: 'Ocean', category: 'Nature' },
    { id: 'forest', name: 'Forest', category: 'Nature' },
    { id: 'sunset', name: 'Sunset', category: 'Nature' },
    { id: 'midnight', name: 'Midnight', category: 'Nature' },
    { id: 'arctic', name: 'Arctic', category: 'Nature' },
  ]);
}
