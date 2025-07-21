#!/usr/bin/env node

import { program } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tasksDir = join(__dirname, '..', 'tasks');

program
  .name('repo-task')
  .description('Execute build tasks for Claude Flow monorepo')
  .version('1.0.0')
  .argument('<task>', 'The task to run (e.g., build, test, lint)')
  .option('-w, --watch', 'Run in watch mode')
  .option('-p, --prod', 'Run in production mode')
  .action(async (task, options) => {
    const taskFile = join(tasksDir, `${task}.mjs`);

    if (!existsSync(taskFile)) {
      console.error(`Task "${task}" not found. Expected file: ${taskFile}`);
      process.exit(1);
    }

    // Execute the task file
    const args = ['--loader', 'file://' + taskFile];
    if (options.watch) args.push('--watch');
    if (options.prod) args.push('--prod');

    const proc = spawn('node', [taskFile, ...process.argv.slice(3)], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    proc.on('exit', (code) => {
      process.exit(code || 0);
    });
  });

program.parse();
