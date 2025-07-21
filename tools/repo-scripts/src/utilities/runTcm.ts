import { runScript } from './runScript.js';
import { existsSync } from 'fs';
import { join } from 'path';

export interface RunTcmOptions {
  srcDir?: string;
  watch?: boolean;
  additionalArgs?: string[];
}

/**
 * Run typed-css-modules on a directory
 */
export async function runTcm({
  srcDir = 'src',
  watch = false,
  additionalArgs = [],
}: RunTcmOptions = {}): Promise<void> {
  const srcPath = join(process.cwd(), srcDir);

  if (!existsSync(srcPath)) {
    console.log(`No ${srcDir} directory found, skipping tcm`);
    return;
  }

  const args = [srcPath];

  if (watch) {
    args.push('--watch');
  }

  args.push(...additionalArgs);

  return runScript({
    packageName: 'typed-css-modules',
    name: 'tcm',
    args,
  });
}
