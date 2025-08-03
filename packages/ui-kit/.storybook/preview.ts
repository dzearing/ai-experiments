import type { Preview } from '@storybook/react';
import { loadTheme, initializeThemes } from './theme-loader';
import '../src/styles/storybook.css';

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
          'Getting Started', 
          'Theme Explorer',
          'Token Guidance',
          'Token Browser',
          'Foundations',
          'Theming',
          '*'
        ],
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#121212' },
        { name: 'surface', value: 'var(--color-surface)' },
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
  docs: {
    toc: true,
  },
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
