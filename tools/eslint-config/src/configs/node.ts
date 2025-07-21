import tseslint from 'typescript-eslint';
import globals from 'globals';
import { base } from './base.js';

/**
 * ESLint configuration for Node.js environments.
 * Extends the base configuration with Node.js-specific globals.
 */
export const node = tseslint.config(
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
  }
);