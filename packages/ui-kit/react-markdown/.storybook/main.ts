import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
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
  ],
  viteFinal: async (config) => {
    // Point packages to source files for hot reloading during development
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ui-kit/core/bootstrap.js': path.resolve(__dirname, '../../core/src/runtime/bootstrap.ts'),
      '@ui-kit/core': path.resolve(__dirname, '../../core/src'),
      '@ui-kit/react': path.resolve(__dirname, '../../react/src'),
    };
    return config;
  },
};

export default config;
