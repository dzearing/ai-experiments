import { base } from './base.js';
import tseslint from 'typescript-eslint';
import type { TSESLint } from '@typescript-eslint/utils';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import globals from 'globals';

/**
 * ESLint configuration for React applications.
 * Extends the base configuration with React-specific rules and browser globals.
 */
export const react: TSESLint.FlatConfig.ConfigArray = tseslint.config(...base, {
  files: ['**/*.{ts,tsx,js,jsx}'],
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    'react-refresh': reactRefreshPlugin,
  },
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
      ...globals.es2022,
    },
  },
  rules: {
    // React rules
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Refresh rules
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
});
