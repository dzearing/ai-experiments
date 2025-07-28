import { runScript } from './runScript.js';

export interface RunPlaywrightOptions {
  ui?: boolean;
  additionalArgs?: string[];
}

/**
 * Run playwright tests
 */
export async function runPlaywright({
  ui = false,
  additionalArgs = [],
}: RunPlaywrightOptions = {}): Promise<void> {
  const args = ['test'];

  if (ui) {
    args.push('--ui');
  }

  args.push(...additionalArgs);

  return runScript({
    packageName: '@playwright/test',
    name: 'playwright',
    args,
    env: {
      NODE_ENV: 'test',
    },
  });
}
