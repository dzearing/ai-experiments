/**
 * Theme loader for Storybook
 * Dynamically loads theme CSS files based on the selected theme and mode
 */

export interface ThemeConfig {
  theme: string;
  mode: 'light' | 'dark';
}

// Track all loaded stylesheets (keep them loaded to prevent font reload)
const loadedThemes = new Map<string, HTMLLinkElement>();
let currentThemeKey: string | null = null;

/**
 * Preload a theme CSS file without applying it
 */
async function preloadTheme(themeKey: string): Promise<HTMLLinkElement> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const [theme, mode] = themeKey.split('-');
    link.href = `./themes/${theme}-${mode}.css`;
    link.setAttribute('data-theme-css', themeKey);
    // Keep it disabled initially to prevent flash
    link.disabled = true;
    
    link.onload = () => {
      loadedThemes.set(themeKey, link);
      resolve(link);
    };
    
    link.onerror = () => {
      reject(new Error(`Failed to load theme: ${themeKey}`));
    };
    
    document.head.appendChild(link);
  });
}

/**
 * Load a theme CSS file dynamically without removing old themes
 * This prevents font reload jank by keeping all themes loaded but disabled
 */
export async function loadTheme({ theme, mode }: ThemeConfig) {
  const themeKey = `${theme}-${mode}`;
  
  // If it's the same theme, do nothing
  if (currentThemeKey === themeKey) {
    return;
  }
  
  try {
    let themeLink = loadedThemes.get(themeKey);
    
    // If theme not loaded yet, load it first
    if (!themeLink) {
      themeLink = await preloadTheme(themeKey);
    }
    
    // Disable all other theme stylesheets
    loadedThemes.forEach((link, key) => {
      link.disabled = key !== themeKey;
    });
    
    // Enable the new theme stylesheet
    if (themeLink) {
      themeLink.disabled = false;
    }
    
    // Update current theme tracking
    currentThemeKey = themeKey;
    
    // Set the data attributes
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme-type', mode);
    
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
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