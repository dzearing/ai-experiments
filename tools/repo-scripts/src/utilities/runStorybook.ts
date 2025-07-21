import { runScript } from './runScript.js';

export interface RunStorybookOptions {
  command: 'dev' | 'build';
  port?: number;
  host?: boolean;
  additionalArgs?: string[];
}

/**
 * Run storybook commands
 */
export async function runStorybook({
  command,
  port = 6006,
  host = false,
  additionalArgs = [],
}: RunStorybookOptions): Promise<void> {
  const args: string[] = [command];
  
  if (command === 'dev') {
    args.push('-p', port.toString());
    
    if (host) {
      args.push('--host', '0.0.0.0');
    }
  }
  
  args.push(...additionalArgs);
  
  return runScript({
    packageName: 'storybook',
    args,
  });
}