import type { Preview, Decorator } from '@storybook/react';
import { useEffect } from 'react';
import '@ui-kit/core/tokens.css';
import './preview.css';

// Dynamically load theme CSS
const loadThemeCSS = (theme: string, mode: string) => {
  const themeId = 'ui-kit-theme-css';
  const existingLink = document.getElementById(themeId) as HTMLLinkElement | null;

  // Build the theme CSS filename (served from staticDirs /themes)
  const filename = `${theme}-${mode}.css`;
  const href = `/themes/${filename}`;

  if (existingLink) {
    // Update existing link element
    existingLink.href = href;
  } else {
    // Create new link element
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
  const isFullscreen = context.parameters?.layout === 'fullscreen';

  useEffect(() => {
    // Load the appropriate theme CSS file
    loadThemeCSS(theme, mode);

    // Set data attributes on the document root
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;

    // Apply mode-specific class for CSS targeting
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(mode);

    // Apply RTL/LTR direction
    document.documentElement.dir = direction;
    document.body.dir = direction;

    // Also apply to body for stories rendered in iframe
    document.body.dataset.theme = theme;
    document.body.dataset.mode = mode;
  }, [theme, mode, direction]);

  const wrapperClass = isFullscreen ? 'storyWrapper fullscreen' : 'storyWrapper';

  return (
    <div className={wrapperClass} dir={direction}>
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
      disable: true, // Let the theme control backgrounds
    },
    options: {
      storySort: {
        order: [
          'Actions',      // Buttons - most common
          'Inputs',       // Form inputs
          'Layout',       // Structural components
          'Data Display', // Lists, tables, trees
          'Typography',   // Text components
          'Navigation',   // Navigation patterns
          'Feedback',     // Alerts, toasts, progress
          'Overlays',     // Modals, popovers, tooltips
          'Animation',    // Motion/transition utilities
          'Example Pages', // Full page examples (last)
        ],
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
    direction: {
      name: 'Direction',
      description: 'Text direction (LTR/RTL)',
      defaultValue: 'ltr',
      toolbar: {
        icon: 'transfer',
        items: [
          { value: 'ltr', title: 'LTR (Left to Right)', icon: 'arrowrightalt' },
          { value: 'rtl', title: 'RTL (Right to Left)', icon: 'arrowleftalt' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
