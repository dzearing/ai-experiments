import chalk from 'chalk';
import inquirer from 'inquirer';
import { execa } from 'execa';
import { detectPackageType } from '../utilities/detectPackageType.js';
import { runTcm } from '../utilities/runTcm.js';
import { runConcurrently } from '../utilities/runConcurrently.js';
import { runScript } from '../utilities/runScript.js';
import { runStorybook } from '../utilities/runStorybook.js';
import type { Task } from '../types.js';

const dev: Task = {
  command: 'dev',
  description: 'Start development mode',
  execute: async (additionalArgs = []) => {
    const packageType = detectPackageType();
    
    // If we can detect a package type, run locally
    if (packageType !== 'unknown') {
      // Package-specific dev modes
      switch (packageType) {
        case 'react-app':
          // Run tcm first
          await runTcm();
          
          // Then run vite and tcm watch concurrently
          return runConcurrently({
            commands: [
              { name: 'vite', command: 'vite' },
              { name: 'tcm', command: 'tcm src --watch' },
            ],
          });
          
        case 'component-library':
          // For component libraries, run Storybook
          console.log(chalk.blue('Starting Storybook...'));
          return runStorybook({
            command: 'dev',
          });
          
        case 'node-app':
          // For node apps, just run tsc in watch mode
          return runScript({
            packageName: 'typescript',
            name: 'tsc',
            args: ['-b', '--watch', ...additionalArgs],
          });
      }
    }
    
    // If we're at the root or can't detect package type, show the interactive menu
      const { choice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'What would you like to run?',
          choices: [
            { name: 'V1 Application (port 3000)', value: 'v1' },
            { name: 'V2 Application (port 4000)', value: 'v2' },
            { name: 'Both V1 and V2', value: 'both' },
            { name: 'Storybook (port 6006)', value: 'storybook' },
          ],
        },
      ]);

      switch (choice) {
        case 'v1':
          console.log(chalk.blue('Starting V1 application...'));
          await execa('npx', ['concurrently', '-n', 'client,server', '-c', 'cyan,green', 
            'pnpm --filter @claude-flow/v1-client dev',
            'pnpm --filter @claude-flow/v1-server dev'
          ], { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          break;
        case 'v2':
          console.log(chalk.blue('Starting V2 application...'));
          console.log(chalk.yellow('V2 not yet implemented'));
          break;
        case 'both':
          console.log(chalk.blue('Starting both V1 and V2...'));
          console.log(chalk.yellow('V2 not yet implemented, starting V1 only'));
          await execa('npx', ['concurrently', '-n', 'client,server', '-c', 'cyan,green', 
            'pnpm --filter @claude-flow/v1-client dev',
            'pnpm --filter @claude-flow/v1-server dev'
          ], { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          break;
        case 'storybook':
          console.log(chalk.blue('Starting Storybook...'));
          console.log(chalk.yellow('Storybook not yet implemented'));
          break;
      }
      return;
  }
};

export { dev };