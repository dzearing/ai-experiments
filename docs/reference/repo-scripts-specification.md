# Repo Scripts Tool Specification

## Overview

The `repo-scripts` tool is a centralized CLI for executing common development tasks across the monorepo. It provides a consistent interface with pretty formatting, error handling, and progress indicators for all build, test, and maintenance operations.

## Architecture

```
packages/tools/repo-scripts/
├── bin/
│   └── repoScripts.js           # CLI entry point (executable)
├── src/
│   ├── index.ts                 # Main entry, task router
│   ├── tasks/                   # Individual task implementations
│   │   ├── build.ts
│   │   ├── test.ts
│   │   ├── lint.ts
│   │   ├── typecheck.ts
│   │   ├── clean.ts
│   │   ├── dev.ts
│   │   ├── release.ts
│   │   └── checkDeps.ts
│   └── utils/                   # Shared utilities
│       ├── logger.ts            # Formatted console output
│       ├── spinner.ts           # Progress indicators
│       ├── errorHandler.ts      # Error formatting
│       └── process.ts           # Process execution helpers
├── package.json
├── tsconfig.json
└── README.md
```

## Implementation Details

### Package Configuration

```json
// package.json
{
  "name": "@claude-flow/repo-scripts",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "bin": {
    "repo-scripts": "./bin/repoScripts.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  },
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "execa": "^8.0.1",
    "listr2": "^7.0.2",
    "ora": "^7.0.1",
    "boxen": "^7.1.1",
    "figures": "^5.0.0",
    "terminal-link": "^3.0.0",
    "glob": "^10.3.10",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsup": "^8.0.1",
    "typescript": "^5.3.0"
  }
}
```

### CLI Entry Point

```javascript
#!/usr/bin/env node
// bin/repoScripts.js

import('../dist/index.js')
  .then(({ main }) => main())
  .catch((error) => {
    console.error('Failed to load repo-scripts:', error);
    process.exit(1);
  });
```

### Main Entry (index.ts)

```typescript
// src/index.ts
import { Command } from 'commander';
import chalk from 'chalk';
import { logger } from './utils/logger.js';
import { errorHandler } from './utils/errorHandler.js';
import { buildTask } from './tasks/build.js';
import { testTask } from './tasks/test.js';
import { lintTask } from './tasks/lint.js';
import { typecheckTask } from './tasks/typecheck.js';
import { cleanTask } from './tasks/clean.js';
import { devTask } from './tasks/dev.js';
import { releaseTask } from './tasks/release.js';
import { checkDepsTask } from './tasks/checkDeps.js';

const program = new Command();

export async function main() {
  try {
    program
      .name('repo-scripts')
      .description('Claude Flow monorepo task runner')
      .version('1.0.0')
      .showHelpAfterError('(add --help for additional information)');

    // Build command
    program
      .command('build')
      .description('Build all packages or specific targets')
      .option('-p, --package <name>', 'build specific package')
      .option('-w, --watch', 'watch mode')
      .option('--no-cache', 'disable build cache')
      .action(async (options) => {
        await errorHandler(buildTask(options));
      });

    // Test command
    program
      .command('test')
      .description('Run tests across the monorepo')
      .option('-p, --package <name>', 'test specific package')
      .option('-w, --watch', 'watch mode')
      .option('-c, --coverage', 'generate coverage report')
      .option('-u, --update-snapshots', 'update snapshots')
      .action(async (options) => {
        await errorHandler(testTask(options));
      });

    // Lint command
    program
      .command('lint')
      .description('Run ESLint across the monorepo')
      .option('-p, --package <name>', 'lint specific package')
      .option('--fix', 'auto-fix issues')
      .action(async (options) => {
        await errorHandler(lintTask(options));
      });

    // Typecheck command
    program
      .command('typecheck')
      .description('Run TypeScript type checking')
      .option('-p, --package <name>', 'check specific package')
      .action(async (options) => {
        await errorHandler(typecheckTask(options));
      });

    // Clean command
    program
      .command('clean')
      .description('Clean build artifacts and caches')
      .option('--deps', 'also clean node_modules')
      .option('--cache', 'clean build caches')
      .action(async (options) => {
        await errorHandler(cleanTask(options));
      });

    // Dev command
    program
      .command('dev')
      .description('Start development servers')
      .option('-p, --package <name>', 'start specific package')
      .option('--no-open', "don't open browser")
      .action(async (options) => {
        await errorHandler(devTask(options));
      });

    // Release command
    program
      .command('release')
      .description('Create a new release')
      .option('--dry-run', 'simulate release without publishing')
      .action(async (options) => {
        await errorHandler(releaseTask(options));
      });

    // Check dependencies command
    program
      .command('check-deps')
      .description('Check for dependency issues')
      .option('--fix', 'auto-fix issues')
      .action(async (options) => {
        await errorHandler(checkDepsTask(options));
      });

    // Show banner for help
    program.on('command:*', () => {
      logger.error(`Unknown command: ${program.args.join(' ')}`);
      program.help();
    });

    if (process.argv.length === 2) {
      logger.showBanner();
      program.help();
    }

    await program.parseAsync(process.argv);
  } catch (error) {
    errorHandler(Promise.reject(error));
  }
}
```

### Logger Utility

```typescript
// src/utils/logger.ts
import chalk from 'chalk';
import boxen from 'boxen';
import figures from 'figures';

export const logger = {
  info: (message: string) => {
    console.log(chalk.blue(figures.info), message);
  },

  success: (message: string) => {
    console.log(chalk.green(figures.tick), chalk.green(message));
  },

  warning: (message: string) => {
    console.log(chalk.yellow(figures.warning), chalk.yellow(message));
  },

  error: (message: string) => {
    console.log(chalk.red(figures.cross), chalk.red(message));
  },

  debug: (message: string) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray(figures.pointer), chalk.gray(message));
    }
  },

  section: (title: string) => {
    console.log('\n' + chalk.bold.underline(title) + '\n');
  },

  showBanner: () => {
    const banner = boxen(
      chalk.bold.blue('Claude Flow Repo Scripts') +
        '\n' +
        chalk.gray('Monorepo task runner and build tool'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue',
      }
    );
    console.log(banner);
  },

  table: (data: Record<string, string>[]) => {
    console.table(data);
  },

  divider: () => {
    console.log(chalk.gray('─'.repeat(process.stdout.columns || 80)));
  },
};
```

### Spinner Utility

```typescript
// src/utils/spinner.ts
import ora, { Ora } from 'ora';
import chalk from 'chalk';

export class TaskSpinner {
  private spinner: Ora;

  constructor(text: string) {
    this.spinner = ora({
      text,
      spinner: 'dots',
    });
  }

  start(text?: string) {
    if (text) this.spinner.text = text;
    this.spinner.start();
    return this;
  }

  succeed(text?: string) {
    this.spinner.succeed(text ? chalk.green(text) : undefined);
    return this;
  }

  fail(text?: string) {
    this.spinner.fail(text ? chalk.red(text) : undefined);
    return this;
  }

  warn(text?: string) {
    this.spinner.warn(text ? chalk.yellow(text) : undefined);
    return this;
  }

  info(text?: string) {
    this.spinner.info(text ? chalk.blue(text) : undefined);
    return this;
  }

  update(text: string) {
    this.spinner.text = text;
    return this;
  }

  stop() {
    this.spinner.stop();
    return this;
  }
}

// Task list for multiple concurrent operations
import { Listr } from 'listr2';

export function createTaskList(tasks: any[], options?: any) {
  return new Listr(tasks, {
    concurrent: options?.concurrent || false,
    exitOnError: options?.exitOnError ?? true,
    rendererOptions: {
      showTimer: true,
      collapse: false,
      showSubtasks: true,
    },
  });
}
```

### Error Handler

```typescript
// src/utils/errorHandler.ts
import chalk from 'chalk';
import boxen from 'boxen';
import { logger } from './logger.js';

export async function errorHandler(promise: Promise<any>) {
  try {
    await promise;
  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

export function handleError(error: unknown) {
  logger.divider();

  if (error instanceof Error) {
    // Format error message
    const errorBox = boxen(chalk.red.bold('Error: ') + error.message, {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'red',
    });
    console.error(errorBox);

    // Show stack trace in debug mode
    if (process.env.DEBUG && error.stack) {
      logger.section('Stack Trace:');
      console.error(chalk.gray(error.stack));
    }

    // Show helpful hints based on error type
    showErrorHints(error);
  } else {
    logger.error('An unknown error occurred');
    console.error(error);
  }

  logger.divider();
}

function showErrorHints(error: Error) {
  const hints: string[] = [];

  // Common error patterns
  if (error.message.includes('ENOENT')) {
    hints.push('File or directory not found. Check if the path exists.');
  }

  if (error.message.includes('EACCES')) {
    hints.push('Permission denied. Try running with appropriate permissions.');
  }

  if (error.message.includes('npm') || error.message.includes('pnpm')) {
    hints.push('Package manager error. Try running "pnpm install" first.');
  }

  if (error.message.includes('TypeScript')) {
    hints.push('TypeScript error. Run "repo-scripts typecheck" for details.');
  }

  if (hints.length > 0) {
    logger.section('Hints:');
    hints.forEach((hint) => logger.info(hint));
  }
}
```

### Process Utility

```typescript
// src/utils/process.ts
import { execa, Options } from 'execa';
import chalk from 'chalk';
import { logger } from './logger.js';

export interface ExecOptions extends Options {
  silent?: boolean;
}

export async function exec(command: string, args: string[] = [], options: ExecOptions = {}) {
  const { silent = false, ...execaOptions } = options;

  if (!silent) {
    logger.debug(`Executing: ${command} ${args.join(' ')}`);
  }

  try {
    const result = await execa(command, args, {
      preferLocal: true,
      ...execaOptions,
    });

    return result;
  } catch (error: any) {
    if (!silent && error.stderr) {
      console.error(chalk.red(error.stderr));
    }
    throw error;
  }
}

export async function execParallel(
  commands: Array<{ command: string; args?: string[]; options?: ExecOptions }>
) {
  return Promise.all(commands.map(({ command, args, options }) => exec(command, args, options)));
}

export function isCI(): boolean {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}

export function getPackageManager(): 'pnpm' | 'npm' | 'yarn' {
  if (process.env.npm_config_user_agent?.includes('pnpm')) return 'pnpm';
  if (process.env.npm_config_user_agent?.includes('yarn')) return 'yarn';
  return 'npm';
}
```

### Example Task: Build

```typescript
// src/tasks/build.ts
import { glob } from 'glob';
import { TaskSpinner, createTaskList } from '../utils/spinner.js';
import { exec } from '../utils/process.js';
import { logger } from '../utils/logger.js';
import path from 'path';

interface BuildOptions {
  package?: string;
  watch?: boolean;
  cache?: boolean;
}

export async function buildTask(options: BuildOptions) {
  logger.showBanner();
  logger.section('Build Task');

  const spinner = new TaskSpinner('Preparing build...');
  spinner.start();

  try {
    // Find packages to build
    const packages = await findPackages(options.package);
    spinner.succeed(`Found ${packages.length} packages to build`);

    if (packages.length === 0) {
      logger.warning('No packages found to build');
      return;
    }

    // Create build tasks
    const tasks = packages.map((pkg) => ({
      title: `Building ${pkg.name}`,
      task: async (ctx: any, task: any) => {
        const startTime = Date.now();

        await exec('pnpm', ['build'], {
          cwd: pkg.path,
          env: {
            ...process.env,
            NO_CACHE: options.cache === false ? '1' : '0',
          },
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        task.title = `Built ${pkg.name} in ${duration}s`;
      },
    }));

    // Execute builds
    logger.section('Building Packages');
    const list = createTaskList(tasks, { concurrent: true });
    await list.run();

    logger.success(`\nSuccessfully built ${packages.length} packages!`);

    // Show build summary
    showBuildSummary(packages);
  } catch (error) {
    spinner.fail('Build failed');
    throw error;
  }
}

async function findPackages(packageName?: string) {
  if (packageName) {
    // Find specific package
    const patterns = [
      `packages/apps/${packageName}/package.json`,
      `packages/shared/${packageName}/package.json`,
      `packages/tools/${packageName}/package.json`,
    ];

    const files = await glob(patterns, { ignore: ['**/node_modules/**'] });
    return files.map((file) => ({
      name: path.basename(path.dirname(file)),
      path: path.dirname(file),
    }));
  }

  // Find all packages
  const files = await glob('packages/**/package.json', {
    ignore: ['**/node_modules/**'],
  });

  return files.map((file) => ({
    name: path.basename(path.dirname(file)),
    path: path.dirname(file),
  }));
}

function showBuildSummary(packages: Array<{ name: string; path: string }>) {
  logger.section('Build Summary');

  const summary = packages.map((pkg) => ({
    Package: pkg.name,
    Path: path.relative(process.cwd(), pkg.path),
    Status: '✓ Built',
  }));

  logger.table(summary);
}
```

### Example Task: Test

```typescript
// src/tasks/test.ts
import { TaskSpinner, createTaskList } from '../utils/spinner.js';
import { exec, isCI } from '../utils/process.js';
import { logger } from '../utils/logger.js';

interface TestOptions {
  package?: string;
  watch?: boolean;
  coverage?: boolean;
  updateSnapshots?: boolean;
}

export async function testTask(options: TestOptions) {
  logger.section('Test Task');

  const args = ['test'];

  if (options.watch && !isCI()) {
    args.push('--watch');
  }

  if (options.coverage) {
    args.push('--coverage');
  }

  if (options.updateSnapshots) {
    args.push('--update-snapshots');
  }

  const spinner = new TaskSpinner('Running tests...');
  spinner.start();

  try {
    const result = await exec('pnpm', args, {
      stdio: 'inherit',
    });

    spinner.succeed('All tests passed!');

    if (options.coverage) {
      logger.info('Coverage report generated at ./coverage');
    }
  } catch (error: any) {
    spinner.fail('Tests failed');

    // Extract test failure summary
    if (error.stdout) {
      const failureMatch = error.stdout.match(/(\d+) failed/);
      const passMatch = error.stdout.match(/(\d+) passed/);

      if (failureMatch && passMatch) {
        logger.error(`${failureMatch[1]} tests failed, ${passMatch[1]} passed`);
      }
    }

    throw error;
  }
}
```

## Usage Examples

```bash
# Build all packages
repo-scripts build

# Build specific package
repo-scripts build -p web

# Run tests with coverage
repo-scripts test --coverage

# Lint with auto-fix
repo-scripts lint --fix

# Start development servers
repo-scripts dev

# Clean everything including dependencies
repo-scripts clean --deps

# Check for dependency issues
repo-scripts check-deps
```

## Integration with Package Scripts

Each package can use repo-scripts in their package.json:

```json
{
  "scripts": {
    "build": "repo-scripts build -p $npm_package_name",
    "test": "repo-scripts test -p $npm_package_name",
    "lint": "repo-scripts lint -p $npm_package_name",
    "dev": "repo-scripts dev -p $npm_package_name"
  }
}
```

## CI/CD Integration

```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: pnpm install

- name: Build
  run: pnpm exec repo-scripts build

- name: Lint
  run: pnpm exec repo-scripts lint

- name: Type check
  run: pnpm exec repo-scripts typecheck

- name: Test
  run: pnpm exec repo-scripts test --coverage
```

## Benefits

1. **Consistent Interface**: Single tool for all repo operations
2. **Pretty Output**: Formatted logs, spinners, and progress indicators
3. **Error Handling**: Helpful error messages with hints
4. **Performance**: Parallel execution where possible
5. **Extensibility**: Easy to add new tasks
6. **Developer Experience**: Clear feedback and fast iteration

## Future Enhancements

1. **Interactive Mode**: Prompt for options when not provided
2. **Task Composition**: Chain multiple tasks together
3. **Custom Tasks**: Allow packages to define custom tasks
4. **Performance Metrics**: Track and report build times
5. **Cache Management**: Smart cache invalidation
6. **Dependency Graph**: Visualize package dependencies
