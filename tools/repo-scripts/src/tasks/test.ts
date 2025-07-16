import { findPackageRoot } from 'workspace-tools';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';
import { getJestConfigPath } from '../utilities/getJestConfigPath.js';
import { runScript } from '../utilities/runScript.js';
import type { Task } from '../types.js';

const test: Task = {
  command: 'test',
  description: 'Run tests using Jest or Node.js test runner',
  execute: async function test(additionalArgs = []) {
  const packageRoot = findPackageRoot(process.cwd()) || process.cwd();
  
  // Check if this package uses Jest
  try {
    const configPath = getJestConfigPath(packageRoot);
    
    // Run Jest
    return runScript({
      packageName: 'jest',
      nodeArgs: ['--experimental-vm-modules'],
      args: [
        '--config',
        configPath,
        '--rootDir',
        packageRoot,
        '--forceExit',
        // '--detectOpenHandles',
        ...additionalArgs,
      ],
      env: {
        NODE_ENV: 'test',
      },
    });
  } catch {
    // No Jest config found, try Node test runner
    const testPattern = existsSync(resolve(packageRoot, 'tests')) ? 'tests/**/*.test.js' : 
                        existsSync(resolve(packageRoot, 'src')) ? 'src/**/*.test.ts' : null;
    
    if (!testPattern) {
      console.log(`No tests found in ${packageRoot}`);
      return;
    }
    
    // Run tests using node test runner
    console.log(`Running tests with Node.js test runner: ${testPattern}`);
    
    return new Promise((resolve, reject) => {
      const result = spawn('node', ['--test', testPattern, ...additionalArgs], {
        cwd: packageRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      });
      
      result.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Node test runner exited with code ${code}`));
        }
      });
      
      result.on('error', (e) => {
        reject(e);
      });
    });
  }
}
};

export { test };