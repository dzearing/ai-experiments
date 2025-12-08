import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['build/**', 'dist/**', 'lib/**', 'lib-commonjs/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: false,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Type safety rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Allow require() in build scripts
      '@typescript-eslint/no-require-imports': 'off',
      // Disable one-export-per-file since we already follow it
      '@claude-flow/one-export-per-file': 'off',
    },
  },
  // Config for CommonJS files and build scripts
  {
    files: ['**/*.cjs', '**/*.js', 'vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  }
);
