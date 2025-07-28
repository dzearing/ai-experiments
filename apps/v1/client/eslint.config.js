import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['build/**', 'dist/**', 'lib/**', 'lib-commonjs/**', 'node_modules/**'],
  },
  // Config for CommonJS files
  {
    files: ['**/*.cjs', 'tailwind.config.js', 'postcss.config.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        // Disable project mode for v1 client
        project: false,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Temporarily disable no-explicit-any for v1 code
      '@typescript-eslint/no-explicit-any': 'off',
      // Disable unused vars for v1 code entirely (too many false positives)
      '@typescript-eslint/no-unused-vars': 'off',
      // Allow require() in config files
      '@typescript-eslint/no-require-imports': 'off',
      // Disable some rules that are too strict for v1
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',
      // Disable react refresh warnings for v1
      'react-refresh/only-export-components': 'off',
      // Disable react hooks warnings for v1
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
      // Allow empty patterns for v1
      'no-empty-pattern': 'off',
      // Disable one-export-per-file for v1
      '@claude-flow/one-export-per-file': 'off',
    },
  }
);
