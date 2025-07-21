import { execa } from 'execa';

export interface RunConcurrentlyOptions {
  commands: Array<{
    name: string;
    command: string;
  }>;
  killOthersOnFail?: boolean;
}

/**
 * Run multiple commands concurrently
 */
export async function runConcurrently({
  commands,
  killOthersOnFail = true,
}: RunConcurrentlyOptions): Promise<void> {
  const names = commands.map(c => c.name).join(',');
  const commandStrings = commands.map(c => `"${c.command}"`);
  
  const args = [
    '-n', names,
    '-c', 'cyan,green,yellow,blue,magenta',
  ];
  
  if (killOthersOnFail) {
    args.push('--kill-others');
  }
  
  args.push(...commandStrings);
  
  await execa('npx', ['concurrently', ...args], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}