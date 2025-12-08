import type { Preview, Decorator } from '@storybook/react';
import { useEffect } from 'react';
import '../src/styles/global.css';

// Theme decorator that applies theme and mode from toolbar
const withTheme: Decorator = (Story, context) => {
  const { theme, mode } = context.globals;

  useEffect(() => {
    // Set data attributes on the document root
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;

    // Apply mode-specific class for CSS targeting
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(mode);

    // Also apply to body for stories rendered in iframe
    document.body.dataset.theme = theme;
    document.body.dataset.mode = mode;
  }, [theme, mode]);

  return <Story />;
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
    layout: 'fullscreen',
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'UI-Kit theme',
      defaultValue: 'default',
      toolbar: {
        icon: 'paintbrush',
        items: [
          // Core themes
          { value: 'default', title: 'Default' },
          { value: 'minimal', title: 'Minimal' },
          { value: 'high-contrast', title: 'High Contrast' },
          // Microsoft family
          { value: 'github', title: 'GitHub' },
          { value: 'linkedin', title: 'LinkedIn' },
          { value: 'teams', title: 'Teams' },
          { value: 'onedrive', title: 'OneDrive' },
          { value: 'fluent', title: 'Fluent' },
          // Creative/Novelty
          { value: 'terminal', title: 'Terminal' },
          { value: 'matrix', title: 'Matrix' },
          { value: 'cyberpunk', title: 'Cyberpunk' },
          { value: 'sketchy', title: 'Sketchy' },
          { value: 'art-deco', title: 'Art Deco' },
          { value: 'retro', title: 'Retro' },
          // Nature/Mood
          { value: 'ocean', title: 'Ocean' },
          { value: 'forest', title: 'Forest' },
          { value: 'sunset', title: 'Sunset' },
          { value: 'midnight', title: 'Midnight' },
          { value: 'arctic', title: 'Arctic' },
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
  },
  decorators: [withTheme],
};

export default preview;
