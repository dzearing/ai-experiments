/**
 * Theme Switcher Dev Overlay
 *
 * A floating UI for quickly testing themes during development.
 */

import { getTheme, setTheme, toggleMode, subscribe, getThemes } from '../runtime/theme-api';

interface ThemeSwitcherOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showModeToggle?: boolean;
  showThemeList?: boolean;
  collapsed?: boolean;
}

/**
 * Create and mount the theme switcher overlay
 */
export function createThemeSwitcher(options: ThemeSwitcherOptions = {}): () => void {
  const {
    position = 'bottom-right',
    showModeToggle = true,
    showThemeList = true,
    collapsed = false,
  } = options;

  // Create container
  const container = document.createElement('div');
  container.id = 'uikit-theme-switcher';
  container.innerHTML = getStyles() + getMarkup(position, collapsed);
  document.body.appendChild(container);

  // State
  let isCollapsed = collapsed;
  let currentTheme = getTheme();

  // Get DOM elements
  const panel = container.querySelector('.uikit-switcher-panel') as HTMLElement;
  const collapseBtn = container.querySelector('.uikit-switcher-collapse') as HTMLElement;
  const themeSelect = container.querySelector('.uikit-switcher-theme-select') as HTMLSelectElement;
  const modeToggle = container.querySelector('.uikit-switcher-mode-toggle') as HTMLElement;
  const modeLabel = container.querySelector('.uikit-switcher-mode-label') as HTMLElement;

  // Populate theme options
  if (themeSelect) {
    getThemes().then((themes) => {
      themeSelect.innerHTML = themes
        .map((t) => `<option value="${t.id}"${t.id === currentTheme.theme ? ' selected' : ''}>${t.name}</option>`)
        .join('');
    });

    themeSelect.addEventListener('change', () => {
      setTheme({ theme: themeSelect.value });
    });
  }

  // Mode toggle
  if (modeToggle) {
    modeToggle.addEventListener('click', () => {
      toggleMode();
    });
  }

  // Collapse toggle
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      panel.classList.toggle('collapsed', isCollapsed);
      collapseBtn.textContent = isCollapsed ? '+' : '−';
    });
  }

  // Subscribe to theme changes
  const unsubscribe = subscribe((state) => {
    currentTheme = state;
    if (themeSelect) {
      themeSelect.value = state.theme;
    }
    if (modeLabel) {
      const resolvedMode = state.mode === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : state.mode;
      modeLabel.textContent = resolvedMode === 'dark' ? '🌙' : '☀️';
    }
  });

  // Return cleanup function
  return () => {
    unsubscribe();
    container.remove();
  };
}

function getStyles(): string {
  return `
<style>
#uikit-theme-switcher {
  --switcher-bg: rgba(30, 30, 30, 0.95);
  --switcher-text: #e5e5e5;
  --switcher-border: rgba(255, 255, 255, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
}

.uikit-switcher-panel {
  position: fixed;
  z-index: 999999;
  background: var(--switcher-bg);
  color: var(--switcher-text);
  border: 1px solid var(--switcher-border);
  border-radius: 8px;
  padding: 12px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
}

.uikit-switcher-panel.top-left { top: 16px; left: 16px; }
.uikit-switcher-panel.top-right { top: 16px; right: 16px; }
.uikit-switcher-panel.bottom-left { bottom: 16px; left: 16px; }
.uikit-switcher-panel.bottom-right { bottom: 16px; right: 16px; }

.uikit-switcher-panel.collapsed {
  padding: 8px;
}

.uikit-switcher-panel.collapsed .uikit-switcher-content {
  display: none;
}

.uikit-switcher-collapse {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: var(--switcher-text);
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.uikit-switcher-collapse:hover {
  background: rgba(255, 255, 255, 0.2);
}

.uikit-switcher-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.uikit-switcher-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}

.uikit-switcher-theme-select {
  background: rgba(255, 255, 255, 0.1);
  color: var(--switcher-text);
  border: 1px solid var(--switcher-border);
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 13px;
  cursor: pointer;
}

.uikit-switcher-theme-select:hover {
  background: rgba(255, 255, 255, 0.15);
}

.uikit-switcher-mode-toggle {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.uikit-switcher-mode-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
`;
}

function getMarkup(position: string, collapsed: boolean): string {
  const currentTheme = getTheme();
  const resolvedMode = currentTheme.mode === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : currentTheme.mode;

  return `
<div class="uikit-switcher-panel ${position}${collapsed ? ' collapsed' : ''}">
  <button class="uikit-switcher-collapse" title="Toggle panel">${collapsed ? '+' : '−'}</button>
  <div class="uikit-switcher-content">
    <span class="uikit-switcher-label">Theme</span>
    <select class="uikit-switcher-theme-select"></select>
    <button class="uikit-switcher-mode-toggle" title="Toggle light/dark mode">
      <span class="uikit-switcher-mode-label">${resolvedMode === 'dark' ? '🌙' : '☀️'}</span>
    </button>
  </div>
</div>
`;
}
