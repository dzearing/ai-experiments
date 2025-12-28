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

    // Alias workspace packages to source for HMR
    config.resolve = config.resolve || {};
    config.resolve.alias = [
      // Spread existing aliases if any
      ...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
      // @ui-kit/core subpath exports
      { find: '@ui-kit/core/bootstrap.js', replacement: path.resolve(__dirname, '../../core/src/runtime/bootstrap.ts') },
      { find: '@ui-kit/core/surfaces.js', replacement: path.resolve(__dirname, '../../core/src/surfaces.ts') },
      { find: '@ui-kit/core/dev.js', replacement: path.resolve(__dirname, '../../core/src/dev/index.ts') },
      { find: '@ui-kit/core', replacement: path.resolve(__dirname, '../../core/src/index.ts') },
      // @ui-kit/icons - match any icon import
      { find: /^@ui-kit\/icons\/(.+)$/, replacement: path.resolve(__dirname, '../../icons/src/components/$1.tsx') },
      // @ui-kit/react
      { find: '@ui-kit/react', replacement: path.resolve(__dirname, '../../react/src/index.ts') },
      // @ui-kit/react-markdown
      { find: '@ui-kit/react-markdown', replacement: path.resolve(__dirname, '../../react-markdown/src/index.ts') },
    ];

    return config;
  },
};

export default config;
