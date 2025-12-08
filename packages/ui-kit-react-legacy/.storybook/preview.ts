import type { Preview } from '@storybook/react';
import { loadTheme, initializeThemes } from './theme-loader';
// Import ui-kit base styles first
import '@claude-flow/ui-kit/styles.css';
// Import ui-kit storybook styles (includes syntax highlighting)
import '../../ui-kit/src/styles/storybook.css';
// Import ui-kit-react specific styles
import '../src/styles.global.css';

// Initialize theme system on load
if (typeof window !== 'undefined') {
  initializeThemes();
  
  // Set up MutationObserver to fix code viewer theme attributes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const mode = document.documentElement.getAttribute('data-mode') || 'light';
        const docsContainers = document.querySelectorAll('.docs-story, .docblock-source');
        docsContainers.forEach(container => {
          if (!container.hasAttribute('data-theme-type')) {
            container.setAttribute('data-theme-type', mode);
          }
        });
      }
    });
  });
  
  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  } else {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
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
          'Components',
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
        
        // Fix code viewer theme attribute
        // Set data-theme-type on docs containers for proper syntax highlighting
        setTimeout(() => {
          const docsContainers = document.querySelectorAll('.docs-story, .docblock-source');
          docsContainers.forEach(container => {
            container.setAttribute('data-theme-type', mode);
          });
          
          // Also set on parent sbdocs container if it exists
          const sbdocs = document.querySelector('.sbdocs');
          if (sbdocs) {
            sbdocs.setAttribute('data-theme-type', mode);
          }
        }, 0);
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
          { value: 'arctic', title: 'Arctic' },
          { value: 'autumn', title: 'Autumn' },
          { value: 'corporate', title: 'Corporate' },
          { value: 'forest', title: 'Forest' },
          { value: 'high-contrast', title: 'High Contrast' },
          { value: 'midnight', title: 'Midnight' },
          { value: 'minimal', title: 'Minimal' },
          { value: 'monochrome', title: 'Monochrome' },
          { value: 'nature', title: 'Nature' },
          { value: 'ocean', title: 'Ocean' },
          { value: 'retro', title: 'Retro' },
          { value: 'spring', title: 'Spring' },
          { value: 'sunset', title: 'Sunset' },
          { value: 'vibrant', title: 'Vibrant' },
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
  tags: ['autodocs'],
};

export default preview;
