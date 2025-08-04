import type { Preview } from '@storybook/react';
import { loadTheme, initializeThemes } from './theme-loader';
import '@claude-flow/ui-kit/dist/styles.css';

// Initialize theme system on load
if (typeof window !== 'undefined') {
  initializeThemes();
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    options: {
      storySort: {
        order: [
          'Overview',
          'Icons',
          ['Icon Catalog', 'Showcase', 'Usage', 'By Category'],
          '*'
        ],
      },
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: 'var(--color-surface)' },
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#121212' },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      // Apply theme based on toolbar selection
      const theme = context.globals.theme || 'default';
      const mode = context.globals.mode || 'light';

      // Load the theme CSS dynamically
      if (typeof document !== 'undefined') {
        loadTheme({ theme, mode });
      }

      return Story();
    },
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'UI theme',
      defaultValue: 'default',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'default', title: 'Default' },
          { value: 'corporate', title: 'Corporate' },
          { value: 'vibrant', title: 'Vibrant' },
          { value: 'minimal', title: 'Minimal' },
          { value: 'nature', title: 'Nature' },
          { value: 'ocean', title: 'Ocean' },
          { value: 'sunset', title: 'Sunset' },
          { value: 'monochrome', title: 'Monochrome' },
        ],
        showName: true,
      },
    },
    mode: {
      name: 'Mode',
      description: 'Color mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;