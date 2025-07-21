import { lint } from './lint.js';
import type { Task } from '../types.js';

const lintFix: Task = {
  command: 'lint-fix',
  description: 'Run ESLint and automatically fix issues',
  execute: async function lintFix(additionalArgs = []) {
    return lint.execute(['--fix', ...additionalArgs]);
  },
};

export { lintFix };
