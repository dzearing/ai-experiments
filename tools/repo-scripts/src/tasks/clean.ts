import { rm } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';
import chalk from 'chalk';
import type { Task } from '../types.js';

const clean: Task = {
  command: 'clean',
  description: 'Clean build output directories (lib, dist, lib-commonjs)',
  execute: async function clean(additionalArgs = []) {
    const cwd = process.cwd();
    const dirsToClean = ['lib', 'dist', 'lib-commonjs'];
    
    // Add any additional directories from arguments
    if (additionalArgs.length > 0) {
      dirsToClean.push(...additionalArgs);
    }
    
    for (const dir of dirsToClean) {
      const dirPath = resolve(cwd, dir);
      if (existsSync(dirPath)) {
        try {
          await rm(dirPath, { recursive: true, force: true });
          console.log(chalk.green(`✓ Removed ${dir}`));
        } catch (error) {
          console.error(chalk.red(`✗ Failed to remove ${dir}:`), error);
        }
      } else {
        console.log(chalk.gray(`- ${dir} not found, skipping`));
      }
    }
  }
};

export { clean };