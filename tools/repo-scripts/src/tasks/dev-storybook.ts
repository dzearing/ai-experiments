import { runStorybook } from '../utilities/runStorybook.js';
import type { Task } from '../types.js';

const devStorybook: Task = {
  command: 'dev-storybook',
  description: 'Start Storybook development server',
  execute: async (additionalArgs = []) => {
    return runStorybook({
      command: 'dev',
      additionalArgs,
    });
  },
};

export { devStorybook };