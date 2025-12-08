/**
 * Theme Switcher UI Component
 * 
 * This provides a UI control for switching themes and modes in mockups and demos.
 * It leverages the theme.js module API exposed on window for complete decoupling.
 */

// Use type-only imports to ensure no runtime dependency
import type { UIKitThemeAPI, ThemeChangeEvent, ThemeSwitcherOptions } from './globals';

// Get theme API from window (set by theme.js)
const getThemeAPI = (): UIKitThemeAPI => {
  const api = window.__uiKitTheme || window.uiKitTheme;
  if (!api) {
    throw new Error('Theme API not found. Please ensure theme.js is loaded before theme-switcher.js');
  }
  return api;
};

// Available themes (hardcoded for now, could be loaded from manifest)
const AVAILABLE_THEMES = [
  'default', 'ocean', 'sunset', 'nature', 'minimal', 'vibrant', 'corporate', 
  'monochrome', 'forest', 'arctic', 'autumn', 'spring', 'midnight', 'retro', 'high-contrast'
];

/**
 * Create and inject theme switcher UI into the page
 */
export function createThemeSwitcher(options: Omit<ThemeSwitcherOptions, 'autoInit'> = {}): HTMLElement {
  const { position = 'top-right', compact = false } = options;
  
  // Create container
  const container = document.createElement('div');
  container.id = 'ui-kit-theme-switcher';
  container.innerHTML = `
    <style>
      #ui-kit-theme-switcher {
        position: fixed;
        ${getPositionStyles(position)}
        z-index: 10000;
        background: var(--color-panel-background, rgba(255, 255, 255, 0.95));
        border: 1px solid var(--color-panel-border, #e0e0e0);
        border-radius: var(--radius, 8px);
        padding: var(--spacing-small10, 8px) var(--spacing, 12px);
        box-shadow: var(--shadow-card, 0 2px 10px rgba(0, 0, 0, 0.1));
        display: flex;
        gap: var(--spacing-small10, 8px);
        align-items: center;
        font-family: var(--font-family-ui, system-ui, -apple-system, sans-serif);
        font-size: var(--font-size-small10, 13px);
        transition: all 0.2s ease;
        ${compact ? 'flex-direction: column; align-items: stretch; width: 200px;' : ''}
      }
      
      [data-theme-type="dark"] #ui-kit-theme-switcher {
        background: var(--color-panel-background, rgba(30, 30, 30, 0.95));
        border-color: var(--color-panel-border, #444);
        color: var(--color-panel-text, #fff);
      }
      
      #ui-kit-theme-switcher select,
      #ui-kit-theme-switcher button {
        padding: var(--spacing-small20, 4px) var(--spacing-small10, 6px);
        border: 1px solid var(--color-input-border, #ddd);
        border-radius: var(--radius-small10, 4px);
        background: var(--color-input-background, white);
        color: var(--color-input-text, #333);
        font-size: inherit;
        cursor: pointer;
        transition: all 0.2s;
        flex: ${compact ? '1' : '0 1 auto'};
        min-width: 0;
        max-width: ${compact ? '100%' : '150px'};
      }
      
      [data-theme-type="dark"] #ui-kit-theme-switcher select,
      [data-theme-type="dark"] #ui-kit-theme-switcher button {
        background: var(--color-input-background, #444);
        border-color: var(--color-input-border, #555);
        color: var(--color-input-text, #fff);
      }
      
      #ui-kit-theme-switcher select:hover,
      #ui-kit-theme-switcher button:hover {
        background: var(--color-input-backgroundHover, #f5f5f5);
        border-color: var(--color-input-borderHover, #999);
      }
      
      [data-theme-type="dark"] #ui-kit-theme-switcher select:hover,
      [data-theme-type="dark"] #ui-kit-theme-switcher button:hover {
        background: var(--color-input-backgroundHover, #555);
        border-color: var(--color-input-borderHover, #777);
      }
      
      #ui-kit-theme-switcher button:active {
        transform: translateY(1px);
      }
      
      #ui-kit-theme-switcher label {
        font-weight: var(--font-weight-medium, 500);
        margin-right: var(--spacing-small20, 4px);
        color: var(--color-panel-text, inherit);
        white-space: nowrap;
        font-size: var(--font-size-small20, 12px);
        ${compact ? 'margin-bottom: 2px;' : ''}
      }
      
      ${compact ? `
        #ui-kit-theme-switcher .control-group {
          display: flex;
          align-items: center;
          gap: var(--spacing-small20, 4px);
        }
        #ui-kit-theme-switcher .control-group select {
          flex: 1;
        }
      ` : ''}
      
      @media (max-width: 768px) {
        #ui-kit-theme-switcher {
          flex-direction: column;
          align-items: stretch;
          width: 160px;
          gap: var(--spacing-small20, 4px);
        }
        #ui-kit-theme-switcher select {
          max-width: 100%;
        }
        #ui-kit-theme-switcher label {
          font-size: var(--font-size-small20, 11px);
        }
      }
    </style>
    
    ${compact ? `
      <div class="control-group">
        <label for="theme-selector">Theme:</label>
        <select id="theme-selector">
          ${AVAILABLE_THEMES.map(t => 
            `<option value="${t}">${formatThemeName(t)}</option>`
          ).join('')}
        </select>
      </div>
      
      <div class="control-group">
        <label for="mode-selector">Mode:</label>
        <select id="mode-selector">
          <option value="auto">System theme</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    ` : `
      <label for="theme-selector">Theme:</label>
      <select id="theme-selector">
        ${AVAILABLE_THEMES.map(t => 
          `<option value="${t}">${formatThemeName(t)}</option>`
        ).join('')}
      </select>
      
      <label for="mode-selector">Mode:</label>
      <select id="mode-selector">
        <option value="auto">System theme</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    `}
  `;
  
  // Add to page
  document.body.appendChild(container);
  
  // Set initial values
  const themeAPI = getThemeAPI();
  const current = themeAPI.getTheme();
  const themeSelect = container.querySelector('#theme-selector') as HTMLSelectElement;
  const modeSelect = container.querySelector('#mode-selector') as HTMLSelectElement;
  
  if (themeSelect) themeSelect.value = current.theme;
  if (modeSelect) modeSelect.value = current.mode;
  
  // Add event listeners
  if (themeSelect) {
    themeSelect.addEventListener('change', async (e) => {
      const target = e.target as HTMLSelectElement;
      const themeAPI = getThemeAPI();
      await themeAPI.setTheme({ theme: target.value });
    });
  }
  
  if (modeSelect) {
    modeSelect.addEventListener('change', async (e) => {
      const target = e.target as HTMLSelectElement;
      const themeAPI = getThemeAPI();
      await themeAPI.setTheme({ mode: target.value as any });
    });
  }
  
  // Listen for external theme changes to update UI
  const themeAPIForSubscribe = getThemeAPI();
  themeAPIForSubscribe.subscribe((event: ThemeChangeEvent) => {
    if (themeSelect && themeSelect.value !== event.theme) {
      themeSelect.value = event.theme;
    }
    if (modeSelect && modeSelect.value !== event.mode) {
      modeSelect.value = event.mode;
    }
  });
  
  return container;
}

/**
 * Auto-initialize theme switcher when DOM is ready
 */
export async function initThemeSwitcher(options?: ThemeSwitcherOptions): Promise<void> {
  const { autoInit = true, ...switcherOptions } = options || {};
  
  if (!autoInit) return;
  
  // Wait for theme.js to be available on window
  const waitForThemeAPI = (): Promise<UIKitThemeAPI> => {
    return new Promise((resolve) => {
      const check = () => {
        const api = window.__uiKitTheme || window.uiKitTheme;
        if (api) {
          resolve(api);
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  };
  
  // Wait for theme API and initialize
  const themeAPI = await waitForThemeAPI();
  await themeAPI.init();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createThemeSwitcher(switcherOptions);
    });
  } else {
    createThemeSwitcher(switcherOptions);
  }
}

// Helper functions
function getPositionStyles(position: string): string {
  switch (position) {
    case 'top-left':
      return 'top: 10px; left: 10px;';
    case 'bottom-left':
      return 'bottom: 10px; left: 10px;';
    case 'bottom-right':
      return 'bottom: 10px; right: 10px;';
    case 'top-right':
    default:
      return 'top: 10px; right: 10px;';
  }
}

function formatThemeName(theme: string): string {
  return theme.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Global API for backwards compatibility and easy access
if (typeof window !== 'undefined') {
  (window as any).createThemeSwitcher = createThemeSwitcher;
  (window as any).initThemeSwitcher = initThemeSwitcher;
}

// Auto-initialize if this script is loaded directly (not as a module)
if (typeof window !== 'undefined' && document) {
  // Use async IIFE to handle the async initialization
  (async () => {
    await initThemeSwitcher();
  })();
}