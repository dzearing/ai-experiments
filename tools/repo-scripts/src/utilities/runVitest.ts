import { runScript } from './runScript.js';

export interface RunVitestOptions {
  watch?: boolean;
  additionalArgs?: string[];
}

/**
 * Run vitest
 */
export async function runVitest({
  watch = false,
  additionalArgs = [],
}: RunVitestOptions = {}): Promise<void> {
  const args = [];

  if (!watch) {
    args.push('run');
  }

  args.push(...additionalArgs);

  return runScript({
    packageName: 'vitest',
    args,
    env: {
      NODE_ENV: 'test',
    },
  });
}
