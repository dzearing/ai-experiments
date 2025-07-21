import { runPlaywright } from '../utilities/runPlaywright.js';
import type { Task } from '../types.js';

const testE2e: Task = {
  command: 'test-e2e',
  description: 'Run end-to-end tests with Playwright',
  execute: async (additionalArgs = []) => {
    return runPlaywright({
      additionalArgs,
    });
  },
};

export { testE2e };