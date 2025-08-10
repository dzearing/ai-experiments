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
  
  console.log('loadTheme called with:', { theme, mode, themeKey });
  
  // Remove any previously loaded theme
  loadedThemes.forEach((link, key) => {
    if (key !== themeKey) {
      link.remove();
      loadedThemes.delete(key);
    }
  });
  
  // Check if this theme is already loaded
  if (loadedThemes.has(themeKey)) {
    console.log('Theme already loaded, skipping:', themeKey);
    return;
  }
  
  // Create and insert the theme stylesheet
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/themes/${theme}-${mode}.css`;
  link.setAttribute('data-theme-css', themeKey);
  
  document.head.appendChild(link);
  loadedThemes.set(themeKey, link);
  
  // Set the data attributes on parent document
  console.log('Setting main document attributes:', { theme, mode });
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-theme-type', mode);
  
  // Also set on iframe if present (for docs pages)
  const applyToIframe = () => {
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
    if (iframe?.contentDocument) {
      console.log('Applying theme to iframe:', { theme, mode });
      iframe.contentDocument.documentElement.setAttribute('data-theme', theme);
      iframe.contentDocument.documentElement.setAttribute('data-theme-type', mode);
    } else {
      console.log('Iframe not ready or not found');
    }
  };
  
  // Apply immediately
  applyToIframe();
  
  // Apply again after a short delay to ensure iframe is ready
  setTimeout(applyToIframe, 100);
  setTimeout(applyToIframe, 500);
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

  // Watch for iframe changes to ensure theme attributes are applied
  const observer = new MutationObserver(() => {
    applyThemeToIframe();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });

  // Also listen for iframe load events
  window.addEventListener('load', () => {
    const iframe = document.querySelector('#storybook-preview-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.addEventListener('load', applyThemeToIframe);
      // Apply immediately if already loaded
      applyThemeToIframe();
    }
  });

  // Listen for Storybook global changes
  const setupGlobalsListener = () => {
    // Try multiple ways to access the Storybook channel
    const getChannel = () => {
      return (window as any).__STORYBOOK_ADDONS_CHANNEL__ || 
             (window as any).__STORYBOOK_CHANNEL__ ||
             (window as any).parent?.__STORYBOOK_ADDONS_CHANNEL__ ||
             (window as any).parent?.__STORYBOOK_CHANNEL__;
    };

    const trySetupListener = () => {
      const channel = getChannel();
      if (channel) {
        console.log('Setting up globals listener with channel:', channel);
        
        // Listen for globals updates
        channel.on('globalsUpdated', ({ globals }: { globals: any }) => {
          console.log('Globals updated:', globals);
          if (globals.theme || globals.mode) {
            const theme = globals.theme || 'default';
            const mode = globals.mode || 'light';
            console.log('Applying theme from globals:', { theme, mode });
            loadTheme({ theme, mode });
          }
        });

        // Also listen for storybook/global/updated (alternative event name)
        channel.on('storybook/global/updated', ({ globals }: { globals: any }) => {
          console.log('Global updated (alternative):', globals);
          if (globals.theme || globals.mode) {
            const theme = globals.theme || 'default';
            const mode = globals.mode || 'light';
            console.log('Applying theme from globals (alternative):', { theme, mode });
            loadTheme({ theme, mode });
          }
        });

        return true;
      }
      return false;
    };

    // Try to set up immediately
    if (!trySetupListener()) {
      // If not available, try again periodically
      const interval = setInterval(() => {
        if (trySetupListener()) {
          clearInterval(interval);
        }
      }, 100);
      
      // Stop trying after 10 seconds
      setTimeout(() => clearInterval(interval), 10000);
    }
  };

  setupGlobalsListener();

  // Apply theme periodically as a fallback
  setInterval(applyThemeToIframe, 1000);
}