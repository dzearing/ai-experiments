import { runStorybook } from '../utilities/runStorybook.js';
import type { Task } from '../types.js';

const devStorybookWsl: Task = {
  command: 'dev-storybook-wsl',
  description: 'Start Storybook development server with host binding for WSL',
  execute: async (additionalArgs = []) => {
    return runStorybook({
      command: 'dev',
      host: true,
      additionalArgs,
    });
  },
};

export { devStorybookWsl };
