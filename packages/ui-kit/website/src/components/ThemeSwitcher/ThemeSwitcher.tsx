import { useState, useEffect, useCallback } from 'react';
import { Dropdown, Segmented, useTheme } from '@ui-kit/react';
import { SunIcon } from '@ui-kit/icons/SunIcon';
import { MoonIcon } from '@ui-kit/icons/MoonIcon';
import { SunMoonIcon } from '@ui-kit/icons/SunMoonIcon';
import { generateRuntimeThemeTokens } from '@ui-kit/core';
import { getStoredThemes, getAllThemeOptions, type StoredTheme } from '../../utils/themeStorage';
import styles from './ThemeSwitcher.module.css';

const modeOptions = [
  { value: 'light', label: 'Light', icon: <SunIcon size={16} />, 'aria-label': 'Light mode' },
  { value: 'dark', label: 'Dark', icon: <MoonIcon size={16} />, 'aria-label': 'Dark mode' },
  { value: 'auto', label: 'Auto', icon: <SunMoonIcon size={16} />, 'aria-label': 'Auto mode' },
];

// Custom theme CSS style element ID
const CUSTOM_THEME_STYLE_ID = 'uikit-custom-theme';
// Storage key for active custom theme
const ACTIVE_CUSTOM_THEME_KEY = 'uikit-active-custom-theme';
// Custom event name for when themes are saved
export const THEME_SAVED_EVENT = 'uikit-theme-saved';

/**
 * Apply a custom theme by generating CSS and injecting it as OVERRIDES on top of the base theme.
 * We keep the base theme (e.g., 'default') loaded and only override the tokens we generate.
 * This way all the standard tokens (spacing, typography, etc.) remain available.
 */
function applyCustomTheme(storedTheme: StoredTheme, resolvedMode: 'light' | 'dark', currentTheme: string) {
  // Generate tokens for both modes
  const lightTokens = generateRuntimeThemeTokens(storedTheme.config, 'light');
  const darkTokens = generateRuntimeThemeTokens(storedTheme.config, 'dark');

  // Use very high specificity to override the base theme tokens
  // We target [data-theme][data-mode] which will match the current built-in theme
  // and add !important to ensure our custom values win
  const css = `
/* Custom theme overrides - applied on top of base theme */
:root[data-theme="${currentTheme}"][data-mode="light"],
:root[data-mode="light"] {
${Object.entries(lightTokens).map(([k, v]) => `  ${k}: ${v} !important;`).join('\n')}
}
:root[data-theme="${currentTheme}"][data-mode="dark"],
:root[data-mode="dark"] {
${Object.entries(darkTokens).map(([k, v]) => `  ${k}: ${v} !important;`).join('\n')}
}
  `.trim();

  // Remove existing custom theme style
  const existingStyle = document.getElementById(CUSTOM_THEME_STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Inject new style at the END of head to ensure it comes after theme CSS
  const style = document.createElement('style');
  style.id = CUSTOM_THEME_STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);

  // Keep the base theme's data-theme attribute - don't change it!
  // Just ensure mode is set correctly
  document.documentElement.dataset.mode = resolvedMode;
}

/**
 * Remove custom theme CSS overrides
 */
function removeCustomTheme() {
  const existingStyle = document.getElementById(CUSTOM_THEME_STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }
}

export function ThemeSwitcher() {
  const { theme, mode, resolvedMode, setTheme, setMode } = useTheme();
  const [customThemes, setCustomThemes] = useState<StoredTheme[]>([]);
  const [activeCustomTheme, setActiveCustomTheme] = useState<StoredTheme | null>(null);

  // Load custom themes from localStorage and restore active custom theme
  useEffect(() => {
    const loadThemes = () => {
      const themes = getStoredThemes();
      setCustomThemes(themes);
      return themes;
    };

    const themes = loadThemes();

    // Restore active custom theme if one was selected
    const activeThemeId = localStorage.getItem(ACTIVE_CUSTOM_THEME_KEY);
    if (activeThemeId) {
      const activeTheme = themes.find(t => t.id === activeThemeId);
      if (activeTheme) {
        setActiveCustomTheme(activeTheme);
        // Apply immediately on mount - don't wait for the second useEffect
        applyCustomTheme(activeTheme, resolvedMode, theme);
      }
    }

    // Listen for storage changes (in case Theme Designer saves a new theme from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'uikit-custom-themes') {
        loadThemes();
      }
    };

    // Listen for custom event when Theme Designer saves (same-tab communication)
    const handleThemeSaved = (e: Event) => {
      const customEvent = e as CustomEvent<{ themeId: string }>;
      const themes = loadThemes();

      // Auto-select the newly saved theme
      if (customEvent.detail?.themeId) {
        const savedTheme = themes.find(t => t.id === customEvent.detail.themeId);
        if (savedTheme) {
          setActiveCustomTheme(savedTheme);
          applyCustomTheme(savedTheme, resolvedMode, theme);
          localStorage.setItem(ACTIVE_CUSTOM_THEME_KEY, savedTheme.id);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(THEME_SAVED_EVENT, handleThemeSaved);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(THEME_SAVED_EVENT, handleThemeSaved);
    };
  }, [resolvedMode, theme]);

  // Reapply custom theme when mode changes
  useEffect(() => {
    if (activeCustomTheme) {
      applyCustomTheme(activeCustomTheme, resolvedMode, theme);
    }
  }, [activeCustomTheme, resolvedMode, theme]);

  // Build dropdown options from the shared source of truth
  const themeOptions = getAllThemeOptions();

  const handleModeChange = (newMode: string) => {
    setMode(newMode as 'light' | 'dark' | 'auto');
  };

  const handleThemeChange = useCallback((value: string | string[]) => {
    const newTheme = Array.isArray(value) ? value[0] : value;
    if (!newTheme || newTheme === 'separator') return;

    // Check if it's a custom theme
    if (newTheme.startsWith('custom:')) {
      const customThemeId = newTheme.replace('custom:', '');
      const customTheme = customThemes.find(t => t.id === customThemeId);

      if (customTheme) {
        setActiveCustomTheme(customTheme);
        // Apply custom theme as overrides on top of current base theme
        applyCustomTheme(customTheme, resolvedMode, theme);
        // Persist the active custom theme ID
        localStorage.setItem(ACTIVE_CUSTOM_THEME_KEY, customThemeId);
      }
    } else {
      // Built-in theme - remove custom CSS overrides and use standard theme
      setActiveCustomTheme(null);
      removeCustomTheme();
      setTheme(newTheme);
      // Clear the active custom theme from storage
      localStorage.removeItem(ACTIVE_CUSTOM_THEME_KEY);
    }
  }, [customThemes, resolvedMode, theme, setTheme]);

  // Determine the display value for the dropdown
  const displayValue = activeCustomTheme ? `custom:${activeCustomTheme.id}` : theme;

  return (
    <div className={styles.switcher}>
      <Dropdown
        options={themeOptions}
        value={displayValue}
        onChange={handleThemeChange}
        placeholder="Theme"
        position="bottom-end"
        size="sm"
      />

      <Segmented
        options={modeOptions}
        value={mode}
        onChange={handleModeChange}
        iconOnly
        aria-label="Color mode"
      />
    </div>
  );
}
