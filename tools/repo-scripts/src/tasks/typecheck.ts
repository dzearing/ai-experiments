import { runScript } from '../utilities/runScript.js';
import type { Task } from '../types.js';

const typecheck: Task = {
  command: 'typecheck',
  description: 'Run TypeScript type checking',
  execute: async (additionalArgs = []) => {
    // Run TypeScript with --noEmit to just check types
    return runScript({
      packageName: 'typescript',
      name: 'tsc',
      args: ['--noEmit', ...additionalArgs],
    });
  }
};

export { typecheck };