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
    // Resolve @ui-kit/react to source so CSS modules are processed correctly
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ui-kit/react': path.resolve(__dirname, '../../react/src'),
    };
    return config;
  },
};

export default config;
