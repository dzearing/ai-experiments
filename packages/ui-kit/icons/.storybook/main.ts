import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import type { InlineConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: [
    {
      from: path.resolve(__dirname, '../../core/dist/themes'),
      to: '/themes',
    },
    {
      from: path.resolve(__dirname, '../dist/font'),
      to: '/font',
    },
    {
      from: path.resolve(__dirname, '../dist/sprite'),
      to: '/sprite',
    },
  ],
  viteFinal: async (config: InlineConfig) => {
    // Point @ui-kit/react to source files for live CSS updates during development
    // Keep /style.css pointing to dist since it's the bundled CSS output
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // CSS imports go to dist
      '@ui-kit/react/style.css': path.resolve(__dirname, '../../react/dist/style.css'),
      // Component imports go to source for hot reloading
      '@ui-kit/react': path.resolve(__dirname, '../../react/src'),
    };
    return config;
  },
};

export default config;
