import { runVite } from '../utilities/runVite.js';
import type { Task } from '../types.js';

const devViteOnly: Task = {
  command: 'dev-vite-only',
  description: 'Start Vite development server without additional processes',
  execute: async (additionalArgs = []) => {
    return runVite({
      command: 'dev',
      additionalArgs,
    });
  },
};

export { devViteOnly };
