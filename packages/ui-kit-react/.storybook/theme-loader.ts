/**
 * Theme loader for Storybook
 * Dynamically loads theme CSS files based on the selected theme and mode
 */

export interface ThemeConfig {
  theme: string;
  mode: 'light' | 'dark';
}

// Track loaded stylesheets to avoid duplicates
const loadedThemes = new Map<string, HTMLLinkElement>();

/**
 * Load a theme CSS file dynamically
 */
export function loadTheme({ theme, mode }: ThemeConfig) {
  const themeKey = `${theme}-${mode}`;
  
  // Remove any previously loaded theme
  loadedThemes.forEach((link, key) => {
    if (key !== themeKey) {
      link.remove();
      loadedThemes.delete(key);
    }
  });
  
  // Check if this theme is already loaded
  if (loadedThemes.has(themeKey)) {
    return;
  }
  
  // Create and insert the theme stylesheet
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/themes/${theme}-${mode}.css`;
  link.setAttribute('data-theme-css', themeKey);
  
  document.head.appendChild(link);
  loadedThemes.set(themeKey, link);
  
  // Set the data attributes
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-theme-type', mode);
}

/**
 * Initialize theme system with base styles
 */
export function initializeThemes() {
  // Load base styles if not already loaded
  if (!document.querySelector('link[data-base-styles]')) {
    const baseLink = document.createElement('link');
    baseLink.rel = 'stylesheet';
    baseLink.href = '/styles.css';
    baseLink.setAttribute('data-base-styles', 'true');
    document.head.appendChild(baseLink);
  }
  
  // Load theme init script
  const script = document.createElement('script');
  script.src = '/theme.js';
  script.type = 'module';
  script.async = true;
  document.head.appendChild(script);
}