import { runScript } from './runScript.js';

export interface RunViteOptions {
  command: 'dev' | 'build' | 'preview';
  host?: boolean;
  additionalArgs?: string[];
}

/**
 * Run vite commands
 */
export async function runVite({
  command,
  host = false,
  additionalArgs = [],
}: RunViteOptions): Promise<void> {
  const args = [];

  if (command !== 'dev') {
    args.push(command);
  }

  if (host) {
    args.push('--host');
  }

  args.push(...additionalArgs);

  return runScript({
    packageName: 'vite',
    args,
  });
}
