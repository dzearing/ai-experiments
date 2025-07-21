import { runScript } from '../utilities/runScript.js';
import type { Task } from '../types.js';

const format: Task = {
  command: 'format',
  description: 'Format code with Prettier',
  execute: async (additionalArgs = []) => {
    // Prettier will format from the current working directory
    // When run from repo root, it formats the entire repo
    // When run from a package, it formats just that package
    return runScript({
      packageName: 'prettier',
      args: ['--write', '.', ...additionalArgs],
    });
  },
};

export { format };
