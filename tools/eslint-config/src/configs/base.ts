import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { rules } from '../rules/index.js';

/**
 * Base ESLint configuration shared by all environments.
 * Contains common TypeScript rules and custom plugins.
 */
export const base = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      '@claude-flow': {
        rules,
      },
    },
    rules: {
      // TypeScript rules
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      // '@claude-flow/no-deprecated': 'error', // TODO: Enable when type-aware linting is configured
      '@claude-flow/no-default-export': 'error',
      '@claude-flow/one-export-per-file': 'error',
    },
  },
  {
    ignores: ['**/dist/**', '**/lib/**', '**/node_modules/**', '**/*.d.ts'],
  }
);
