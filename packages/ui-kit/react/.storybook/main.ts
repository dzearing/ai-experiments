import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Workaround for pnpm + Storybook 10 path resolution issue
// https://github.com/storybookjs/storybook/issues/29620
function storybookPnpmFix(): Plugin {
  return {
    name: 'storybook-pnpm-fix',
    enforce: 'pre',
    resolveId(id) {
      // Redirect .mjs requests to the actual exports
      if (id.includes('@storybook/react/dist/') && id.endsWith('.mjs')) {
        const exportPath = id.replace('@storybook/react/dist/', '@storybook/react/').replace('.mjs', '');
        return this.resolve(exportPath);
      }
      return null;
    },
  };
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
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
    config.plugins = config.plugins || [];
    config.plugins.unshift(storybookPnpmFix());
    return config;
  },
};

export default config;
