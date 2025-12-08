import type { StorybookConfig } from '@storybook/react-vite';
import { join, dirname } from 'path';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-a11y'),
    // Note: addon-essentials is removed in v9 as its features are now in core
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  staticDirs: ['../fonts', '../dist'],
  viteFinal: async (config) => {
    // Add PostCSS plugins
    config.css = {
      ...config.css,
      postcss: {
        plugins: [
          // These will be resolved at runtime
          await import('postcss-import').then((m) => m.default()),
          await import('postcss-nesting').then((m) => m.default()),
        ],
      },
    };
    return config;
  },
};

export default config;
