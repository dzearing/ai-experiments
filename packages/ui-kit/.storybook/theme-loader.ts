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
  
  console.log('loadTheme called with:', { theme, mode, themeKey });
  
  // If it's the same theme, do nothing
  if (currentThemeKey === themeKey) {
    console.log('Theme already active, skipping:', themeKey);
    return;
  }
  
  try {
    let themeLink = loadedThemes.get(themeKey);
    
    // If theme not loaded yet, load it first
    if (!themeLink) {
      console.log('Theme not loaded, preloading:', themeKey);
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
    
    // Set the data attributes on parent document
    console.log('Setting main document attributes:', { theme, mode });
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme-type', mode);
    
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
  
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
 * Preload all available themes for instant switching
 */
async function preloadAllThemes() {
  const themes = ['default', 'corporate', 'vibrant', 'minimal', 'nature', 'ocean', 'sunset', 'monochrome'];
  const modes = ['light', 'dark'];
  
  const preloadPromises: Promise<any>[] = [];
  
  for (const theme of themes) {
    for (const mode of modes) {
      const themeKey = `${theme}-${mode}`;
      if (!loadedThemes.has(themeKey)) {
        preloadPromises.push(
          preloadTheme(themeKey).catch(err => {
            console.warn(`Failed to preload theme ${themeKey}:`, err);
          })
        );
      }
    }
  }
  
  await Promise.all(preloadPromises);
  console.log('All themes preloaded');
}

/**
 * Initialize theme system with base styles
 */
export function initializeThemes() {
  // Set the base path for theme files to override the default logic
  (window as any).__uiKitBasePath = '';
  
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
  
  // Preload all themes in the background for instant switching
  preloadAllThemes();
  
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