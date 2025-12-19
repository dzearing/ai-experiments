import type { Preview, Decorator } from '@storybook/react';
import { useEffect } from 'react';
import {
  getAllThemeOptions,
  getStoredTheme,
  generateRuntimeThemeTokens,
  type StoredTheme,
} from '@ui-kit/core';
import './preview.css';

// Custom theme CSS style element ID
const CUSTOM_THEME_STYLE_ID = 'uikit-custom-theme';

// Get theme options (includes custom themes from localStorage)
const getThemeItems = () =>
  getAllThemeOptions()
    .filter((opt) => !opt.isDivider)
    .map((opt) => ({
      value: opt.value,
      title: opt.label,
    }));

// Initial theme items
let themeItems = getThemeItems();

// Listen for theme save events from the Theme Designer
if (typeof window !== 'undefined') {
  window.addEventListener('uikit-theme-saved', () => {
    themeItems = getThemeItems();
  });
}

// Dynamically load theme CSS file
const loadThemeCSS = (theme: string, mode: string) => {
  const themeId = 'ui-kit-theme-css';
  const existingLink = document.getElementById(themeId) as HTMLLinkElement | null;

  const filename = `${theme}-${mode}.css`;
  const href = `/themes/${filename}`;

  if (existingLink) {
    existingLink.href = href;
  } else {
    const link = document.createElement('link');
    link.id = themeId;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
};

// Apply custom theme overrides on top of base theme
const applyCustomTheme = (storedTheme: StoredTheme, mode: 'light' | 'dark', baseTheme: string) => {
  const lightTokens = generateRuntimeThemeTokens(storedTheme.config, 'light');
  const darkTokens = generateRuntimeThemeTokens(storedTheme.config, 'dark');

  const css = `
/* Custom theme overrides - applied on top of base theme */
:root[data-theme="${baseTheme}"][data-mode="light"],
:root[data-mode="light"] {
${Object.entries(lightTokens).map(([k, v]) => `  ${k}: ${v} !important;`).join('\n')}
}
:root[data-theme="${baseTheme}"][data-mode="dark"],
:root[data-mode="dark"] {
${Object.entries(darkTokens).map(([k, v]) => `  ${k}: ${v} !important;`).join('\n')}
}
  `.trim();

  // Remove existing custom theme style
  const existingStyle = document.getElementById(CUSTOM_THEME_STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Inject new style
  const style = document.createElement('style');
  style.id = CUSTOM_THEME_STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
};

// Remove custom theme CSS overrides
const removeCustomTheme = () => {
  const existingStyle = document.getElementById(CUSTOM_THEME_STYLE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }
};

// Theme decorator that applies theme, mode, and direction from toolbar
const withTheme: Decorator = (Story, context) => {
  const { theme, mode, direction } = context.globals;

  useEffect(() => {
    // Check if it's a custom theme
    if (theme.startsWith('custom:')) {
      const customThemeId = theme.replace('custom:', '');
      const customTheme = getStoredTheme(customThemeId);

      if (customTheme) {
        // Load the base theme CSS (use custom theme's baseTheme or 'default')
        const baseTheme = customTheme.baseTheme || 'default';
        loadThemeCSS(baseTheme, mode);

        // Apply custom theme overrides
        applyCustomTheme(customTheme, mode as 'light' | 'dark', baseTheme);

        // Set data attributes for base theme
        document.documentElement.dataset.theme = baseTheme;
      }
    } else {
      // Built-in theme - load CSS and remove any custom overrides
      loadThemeCSS(theme, mode);
      removeCustomTheme();
      document.documentElement.dataset.theme = theme;
    }

    // Common settings
    document.documentElement.dataset.mode = mode;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(mode);
    document.documentElement.dir = direction;
    document.body.dir = direction;
    document.body.dataset.theme = document.documentElement.dataset.theme;
    document.body.dataset.mode = mode;
  }, [theme, mode, direction]);

  return (
    <div className="storyWrapper" dir={direction}>
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true,
    },
    options: {
      storySort: {
        order: ['Icon Catalog', 'Font Subset Generator', 'Usage Examples'],
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'UI-Kit theme',
      defaultValue: 'default',
      toolbar: {
        icon: 'paintbrush',
        items: themeItems,
        dynamicTitle: true,
      },
    },
    mode: {
      name: 'Mode',
      description: 'Light/Dark mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'sun',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    direction: {
      name: 'Direction',
      description: 'Text direction (LTR/RTL)',
      defaultValue: 'ltr',
      toolbar: {
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'LTR', icon: 'arrowrightalt' },
          { value: 'rtl', title: 'RTL', icon: 'arrowleftalt' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
