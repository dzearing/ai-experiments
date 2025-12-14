import type { Preview, Decorator } from '@storybook/react';
import { useEffect } from 'react';
import '@ui-kit/core/tokens.css';
import '@ui-kit/react/style.css';
import './preview.css';

// Dynamically load theme CSS
const loadThemeCSS = (theme: string, mode: string) => {
  const themeId = 'ui-kit-theme-css';
  const existingLink = document.getElementById(themeId) as HTMLLinkElement | null;

  // Build the theme CSS filename (served from staticDirs /themes)
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

// Theme decorator that applies theme, mode, and direction from toolbar
const withTheme: Decorator = (Story, context) => {
  const { theme, mode, direction } = context.globals;

  useEffect(() => {
    loadThemeCSS(theme, mode);
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(mode);
    document.documentElement.dir = direction;
    document.body.dir = direction;
    document.body.dataset.theme = theme;
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
    actions: { argTypesRegex: '^on[A-Z].*' },
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
        items: [
          { value: 'default', title: 'Default' },
          { value: 'minimal', title: 'Minimal' },
          { value: 'high-contrast', title: 'High Contrast' },
          { value: 'github', title: 'GitHub' },
          { value: 'terminal', title: 'Terminal' },
        ],
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
