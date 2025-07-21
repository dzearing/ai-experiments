import { runStorybook } from '../utilities/runStorybook.js';
import type { Task } from '../types.js';

const buildStorybook: Task = {
  command: 'build-storybook',
  description: 'Build Storybook for production',
  execute: async (additionalArgs = []) => {
    return runStorybook({
      command: 'build',
      additionalArgs,
    });
  },
};

export { buildStorybook };
