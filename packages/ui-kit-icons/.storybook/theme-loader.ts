/**
 * Theme loader for ui-kit-icons Storybook
 * Reuses the theme system from @claude-flow/ui-kit
 */

export interface ThemeConfig {
  theme: string;
  mode: 'light' | 'dark';
}

// Track loaded stylesheets to avoid duplicates
const loadedThemes = new Map<string, HTMLLinkElement>();

/**
 * Load a theme CSS file dynamically from ui-kit
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
  
  // Create and insert the theme stylesheet from ui-kit
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/themes/${theme}-${mode}.css`;
  link.setAttribute('data-theme-css', themeKey);
  
  document.head.appendChild(link);
  loadedThemes.set(themeKey, link);
  
  // Set the data attributes on document
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-theme-type', mode);
  
  // Also set on iframe if present (for docs pages)
  const applyToIframe = () => {
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
    if (iframe?.contentDocument) {
      iframe.contentDocument.documentElement.setAttribute('data-theme', theme);
      iframe.contentDocument.documentElement.setAttribute('data-theme-type', mode);
    }
  };
  
  // Apply immediately and after delays
  applyToIframe();
  setTimeout(applyToIframe, 100);
  setTimeout(applyToIframe, 500);
}

/**
 * Initialize theme system with base styles from ui-kit
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
  script.src = '/theme-init.js';
  script.async = true;
  document.head.appendChild(script);
  
  // Function to apply theme to iframe
  const applyThemeToIframe = () => {
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
    if (iframe?.contentDocument) {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const currentMode = document.documentElement.getAttribute('data-theme-type');
      if (currentTheme && currentMode) {
        iframe.contentDocument.documentElement.setAttribute('data-theme', currentTheme);
        iframe.contentDocument.documentElement.setAttribute('data-theme-type', currentMode);
        
        // Also load the theme CSS in the iframe if it's not already loaded
        const themeKey = `${currentTheme}-${currentMode}`;
        const existingThemeLink = iframe.contentDocument.querySelector(`link[data-theme-css="${themeKey}"]`);
        if (!existingThemeLink) {
          // Remove old theme links
          iframe.contentDocument.querySelectorAll('link[data-theme-css]').forEach(link => link.remove());
          
          // Add new theme link
          const themeLink = iframe.contentDocument.createElement('link');
          themeLink.rel = 'stylesheet';
          themeLink.href = `/themes/${currentTheme}-${currentMode}.css`;
          themeLink.setAttribute('data-theme-css', themeKey);
          iframe.contentDocument.head.appendChild(themeLink);
        }
      }
    }
  };

  // Watch for iframe changes
  const observer = new MutationObserver(() => {
    applyThemeToIframe();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });

  // Also listen for iframe load events
  window.addEventListener('load', () => {
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.addEventListener('load', applyThemeToIframe);
      applyThemeToIframe();
    }
  });

  // Apply theme periodically as a fallback
  setInterval(applyThemeToIframe, 1000);
}