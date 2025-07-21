import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { getPackageData } from './getPackageData.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export interface RunScriptOptions {
  packageName: string;
  name?: string;
  args?: string[];
  nodeArgs?: string[];
  setExitCode?: boolean;
  quiet?: boolean;
  env?: Record<string, string>;
}

/**
 * Run a script/bin provided by a package in node_modules.
 */
export async function runScript({
  packageName,
  name = packageName,
  args = [],
  nodeArgs = [],
  env = {},
  setExitCode = true,
  quiet,
}: RunScriptOptions): Promise<void> {
  // Try to resolve the package relative to the scripts folder.
  const { packageRoot, packageJson } = getPackageData({ name: packageName, fromPath: dirname });

  const binPath =
    typeof packageJson.bin === 'string'
      ? packageJson.bin
      : packageJson.bin?.[name] || Object.values(packageJson.bin || {})[0] || '';
  const scriptPath = path.join(packageRoot, binPath);

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Unable to resolve script "${scriptPath}`);
  }

  const fullArgs = [...nodeArgs, scriptPath, ...args];

  if (!quiet) {
    try {
      const packageInfo = getPackageData(process.cwd());
      const packageName = packageInfo.packageJson.name || path.basename(process.cwd());
      const taskName = path.basename(scriptPath, '.js');

      // Map common tools to task names
      const taskMap: Record<string, string> = {
        eslint: 'lint',
        tsc: 'build',
        jest: 'test',
        vitest: 'test',
        playwright: 'test',
      };

      const displayTask = taskMap[taskName] || taskName;

      // Filter out flags and their values, and paths
      const displayArgs: string[] = [];
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg) continue;

        if (arg.startsWith('--') || arg.startsWith('-')) {
          // Skip this arg and potentially the next if it's a value
          const nextArg = args[i + 1];
          if (nextArg && !nextArg.startsWith('-')) {
            i++; // Skip the value
          }
        } else if (!arg.includes('/') && !displayArgs.includes(arg)) {
          displayArgs.push(arg);
        }
      }

      const details = displayArgs.length > 0 ? chalk.dim(` (${displayArgs.join(' ')})`) : '';

      console.log(chalk.cyan(`[${chalk.bold(displayTask)}]`) + ' ' + packageName + details);
    } catch {
      // Fallback if package info can't be found
      console.log(chalk.gray(`[${chalk.bold(name)}] Running...`));
    }
  }

  return new Promise((pResolve, reject) => {
    const result = spawn('node', fullArgs, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        ...env,
      },
    });

    // When the process exits, exit with the same code.
    result.on('exit', (code) => {
      const exitCode = code || 0;
      if (setExitCode) {
        process.exitCode = exitCode;
      }

      if (exitCode === 0) {
        pResolve();
      } else {
        reject(new Error(`"${name}" exited with code ${exitCode}`));
      }
    });

    // If the process is killed, kill the child process.
    process.on('SIGINT', () => {
      result.kill('SIGINT');
    });

    result.on('error', (e) => {
      process.exitCode = 1;
      reject(e);
    });
  });
}
