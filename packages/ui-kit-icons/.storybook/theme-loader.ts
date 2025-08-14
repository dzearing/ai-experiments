/**
 * Theme loader for ui-kit-icons Storybook
 * Reuses the theme system from @claude-flow/ui-kit
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
 * Load a theme CSS file dynamically from ui-kit without removing old themes
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
    
    // Set the data attributes on document
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme-type', mode);
    
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
  
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
  script.src = '/theme.js';
  script.type = 'module';
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
        
        // Load theme CSS in iframe using the same disable/enable approach
        const themeKey = `${currentTheme}-${currentMode}`;
        const existingThemeLink = iframe.contentDocument.querySelector(`link[data-theme-css="${themeKey}"]`) as HTMLLinkElement;
        
        if (!existingThemeLink) {
          // Add new theme link (disabled initially)
          const themeLink = iframe.contentDocument.createElement('link');
          themeLink.rel = 'stylesheet';
          themeLink.href = `./themes/${currentTheme}-${currentMode}.css`;
          themeLink.setAttribute('data-theme-css', themeKey);
          themeLink.disabled = false;
          iframe.contentDocument.head.appendChild(themeLink);
        }
        
        // Disable all other theme links, enable the current one
        iframe.contentDocument.querySelectorAll('link[data-theme-css]').forEach((link: any) => {
          link.disabled = link.getAttribute('data-theme-css') !== themeKey;
        });
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