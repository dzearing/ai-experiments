import { node } from '@claude-flow/eslint-config';

export default [
  ...node,
  {
    rules: {
      // Disable one-export-per-file for scripts which are executable files
      '@claude-flow/one-export-per-file': 'off',
    },
  },
];
