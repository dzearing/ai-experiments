import { runPlaywright } from '../utilities/runPlaywright.js';
import type { Task } from '../types.js';

const testE2eUi: Task = {
  command: 'test-e2e-ui',
  description: 'Run end-to-end tests with Playwright UI mode',
  execute: async (additionalArgs = []) => {
    return runPlaywright({
      ui: true,
      additionalArgs,
    });
  },
};

export { testE2eUi };
