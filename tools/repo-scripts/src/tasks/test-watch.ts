import { runVitest } from '../utilities/runVitest.js';
import type { Task } from '../types.js';

const testWatch: Task = {
  command: 'test-watch',
  description: 'Run tests in watch mode',
  execute: async (additionalArgs = []) => {
    return runVitest({
      watch: true,
      additionalArgs,
    });
  },
};

export { testWatch };
