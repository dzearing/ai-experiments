import chalk from 'chalk';
import { runScript } from '../utilities/runScript.js';
import type { Task } from '../types.js';

const formatCheck: Task = {
  command: 'format-check',
  description: 'Check code formatting with Prettier',
  execute: async (additionalArgs = []) => {
    try {
      // Prettier will check from the current working directory
      // When run from repo root, it checks the entire repo
      // When run from a package, it checks just that package
      await runScript({
        packageName: 'prettier',
        args: ['--check', '.', ...additionalArgs],
      });
      console.log(chalk.green('✓ All files are properly formatted'));
    } catch {
      console.log(chalk.red('\n✗ Code formatting issues found'));
      console.log(chalk.yellow('\nRun the following command to fix formatting:'));
      console.log(chalk.cyan('  pnpm format\n'));
      // Exit with error code but don't throw to avoid stack trace
      process.exit(1);
    }
  },
};

export { formatCheck };
