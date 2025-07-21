import { runVite } from '../utilities/runVite.js';
import type { Task } from '../types.js';

const preview: Task = {
  command: 'preview',
  description: 'Preview production build',
  execute: async (additionalArgs = []) => {
    return runVite({
      command: 'preview',
      additionalArgs,
    });
  },
};

export { preview };