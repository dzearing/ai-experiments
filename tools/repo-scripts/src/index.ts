import chalk from 'chalk';
import { program } from 'commander';
import { readdirSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Task } from './types.js';

// Re-export utilities for scripts
export { runScript } from './utilities/runScript.js';
export { getPackageData } from './utilities/getPackageData.js';
export { getJestConfigPath } from './utilities/getJestConfigPath.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function loadTasks(): Promise<Task[]> {
  const tasksDir = join(__dirname, 'tasks');
  const taskFiles = readdirSync(tasksDir).filter(file => file.endsWith('.js'));

  const tasks: Task[] = [];

  for (const file of taskFiles) {
    try {
      const module = await import(join(tasksDir, file));
      // Handle both default and named exports
      const taskName = file.replace('.js', '').replace(/-./g, x => x[1]?.toUpperCase() || '');
      const task = module.default || module[taskName];
      if (task && task.command) {
        tasks.push(task);
      }
    } catch (error) {
      console.warn(`Failed to load task from ${file}:`, error);
    }
  }

  return tasks;
}

export async function cli(): Promise<void> {
  program
    .name('repo-scripts')
    .description('Claude Flow monorepo CLI')
    .version('1.0.0');

  // Load all tasks dynamically
  const tasks = await loadTasks();

  // Register each task as a command
  for (const task of tasks) {
    const cmd = program.command(task.command).description(task.description);

    // Add options if any
    if (task.options) {
      for (const option of task.options) {
        cmd.option(option.flag, option.description, option.defaultValue);
      }
    }

    // Set the action
    cmd.action(async () => {
      try {
        // Extract additional args that aren't part of the parsed options
        const additionalArgs = program.args.slice(1);
        
        // If task doesn't handle its own output, show start message
        if (!task.quiet) {
          const packageData = await import('./utilities/getPackageData.js').then(m => m.getPackageData(process.cwd()));
          const packageName = packageData.packageJson.name || path.basename(process.cwd());
          console.log(chalk.cyan(`[${chalk.bold(task.command)}]`) + ' ' + packageName);
        }
        
        const result = await task.execute(additionalArgs);
        
        // Handle structured results
        if (result) {
          const prefix = result.success 
            ? chalk.green(`[${chalk.bold(task.command)}]`) 
            : chalk.red(`[${chalk.bold(task.command)}]`);
          
          const icon = result.success ? chalk.green('✓') : chalk.red('✗');
          const message = `${prefix} ${icon} ${result.summary || (result.success ? 'completed successfully' : 'failed')}`;
          
          console.log(message);
          
          if (!result.success) {
            process.exit(1);
          }
        } else if (!task.quiet) {
          // For tasks that don't return results, show generic success
          console.log(chalk.green(`[${chalk.bold(task.command)}]`) + ' ' + chalk.green('✓ completed successfully'));
        }
      } catch (error) {
        console.error(chalk.red(`Error executing ${task.command}:`), error);
        process.exit(1);
      }
    });
  }

  program.parse();
}

// Export individual task runners for programmatic use
export async function runTask(taskName: string, additionalArgs: string[] = []): Promise<void> {
  const tasks = await loadTasks();
  const task = tasks.find(t => t.command.split(' ')[0] === taskName);

  if (!task) {
    throw new Error(`Task "${taskName}" not found`);
  }

  await task.execute(additionalArgs);
}
