# Build Tooling Reference

This document provides technical details about the build tooling and configuration in the Claude Flow monorepo.

## Lage Configuration

Lage orchestrates builds across the monorepo, managing task dependencies and caching.

### Core Configuration

```javascript
// lage.config.js
module.exports = {
  pipeline: {
    build: {
      dependsOn: ['^build'], // Build dependencies first
      outputs: ['dist/**', 'lib/**'], // Cache these outputs
      cache: true, // Enable caching
    },
    test: {
      dependsOn: ['build'], // Run after build
      outputs: [], // No outputs to cache
      cache: true, // Cache test results
    },
    lint: {
      outputs: [],
      cache: true,
    },
    typecheck: {
      dependsOn: ['^build'], // Needs dependency types
      outputs: ['*.tsbuildinfo'], // Cache TS build info
      cache: true,
    },
    dev: {
      cache: false, // Never cache dev server
      persistent: true, // Long-running process
    },
  },
};
```

### Task Dependencies

- `^` prefix means "dependencies first" (topological order)
- Tasks without `dependsOn` run immediately
- Lage automatically parallelizes where possible

### Caching

Lage caches based on:

- Input file hashes
- Dependencies' output hashes
- Task configuration

Clear cache with:

```bash
lage clean
# or
rm -rf node_modules/.cache/lage
```

## TypeScript Configuration

### Base Configurations

**`configs/tsconfig/base.json`**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
```

**`configs/tsconfig/react.json`**:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

**`configs/tsconfig/node.json`**:

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2020"],
    "types": ["node"]
  }
}
```

### Project References

Enable incremental builds across packages:

```json
// apps/v2/web/tsconfig.json
{
  "extends": "@claude-flow/tsconfig/react.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src"],
  "references": [
    { "path": "../../../packages/design-system" },
    { "path": "../../../packages/types" }
  ]
}
```

Build with references:

```bash
tsc --build

# Force rebuild
tsc --build --force
```

## ESLint Configuration

### Base Rules

**`configs/eslint-config/base.js`**:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],

    // Imports
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],
    'import/no-cycle': 'error',
    'import/no-unused-modules': 'error',
  },
};
```

### Custom ESLint Rules

Located in `tools/eslint-plugin/`:

**`no-direct-api-calls`**:

```typescript
// Enforces using data providers instead of direct API calls
export default {
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.name === 'fetch' || node.callee.name === 'axios') {
          context.report({
            node,
            message: 'Use data providers instead of direct API calls',
          });
        }
      },
    };
  },
};
```

**`enforce-module-boundaries`**:

```typescript
// Prevents invalid cross-package imports
export default {
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        const currentPackage = getPackageName(context.filename);

        if (isInvalidImport(currentPackage, importPath)) {
          context.report({
            node,
            message: `Invalid import from ${importPath}`,
          });
        }
      },
    };
  },
};
```

## Scaffolding System

### Template Structure

```
tools/repo-scripts/src/templates/
├── web-app/
│   ├── package.json.ejs
│   ├── tsconfig.json.ejs
│   ├── src/
│   │   └── index.tsx.ejs
│   └── template.json
├── component-library/
│   └── ...
└── eslint-rule/
    ├── rule.ts.ejs
    ├── rule.test.ts.ejs
    └── template.json
```

### Template Manifest

**`template.json`**:

```json
{
  "name": "web-app",
  "description": "React web application",
  "variables": [
    {
      "name": "name",
      "prompt": "Package name",
      "validate": "^[a-z-]+$"
    },
    {
      "name": "port",
      "prompt": "Dev server port",
      "default": "3000"
    }
  ],
  "files": ["package.json", "tsconfig.json", "src/index.tsx"]
}
```

### Template Processing

Uses EJS for variable substitution:

**`package.json.ejs`**:

```json
{
  "name": "@claude-flow/<%= name %>",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite --port <%= port %>",
    "build": "vite build",
    "test": "vitest"
  }
}
```

### Scaffold Implementation

```typescript
// tools/repo-scripts/src/tasks/scaffold.ts
export async function scaffold(template: string, name: string) {
  // Load template manifest
  const manifest = await loadManifest(template);

  // Collect variables
  const variables = await collectVariables(manifest, { name });

  // Process templates
  for (const file of manifest.files) {
    const content = await processTemplate(file, variables);
    await writeFile(targetPath, content);
  }

  // Run post-scaffold hooks
  await runHooks(manifest.hooks);
}
```

## Build Scripts

### Task File Structure

Each task is a separate file with specific responsibilities:

**`dev-interactive.ts`**:

```typescript
import inquirer from 'inquirer';
import { runTask } from '../utils/task-runner';

export async function devInteractive() {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'What would you like to start?',
      choices: [
        { name: 'V2 Web (port 4000)', value: 'v2-web' },
        { name: 'V2 Server (port 4001)', value: 'v2-server' },
        { name: 'V2 Web + Server', value: 'v2-all' },
        { name: 'V1 Web (port 3000)', value: 'v1-web' },
        { name: 'V1 Server (port 3001)', value: 'v1-server' },
        { name: 'V1 Web + Server', value: 'v1-all' },
        { name: 'Everything (all services)', value: 'all' },
        { name: 'Storybook (port 6006)', value: 'storybook' },
      ],
    },
  ]);

  switch (choice) {
    case 'v2-web':
      await runTask('lage', ['dev', '--scope', '@claude-flow/v2-web']);
      break;
    case 'v2-all':
      await runTask('lage', ['dev', '--scope', '@claude-flow/v2-*']);
      break;
    // ... other cases
  }
}
```

**`build.ts`**:

```typescript
import { runTask } from '../utils/task-runner';

export async function build() {
  await runTask('tsc', ['--build']);
  await runTask('vite', ['build']);
}

if (require.main === module) {
  build().catch(console.error);
}
```

**`test-coverage.ts`**:

```typescript
import { runTask } from '../utils/task-runner';

export async function testCoverage() {
  await runTask('vitest', ['run', '--coverage']);
  console.log('Coverage report: coverage/index.html');
}
```

### Repo Scripts CLI

Entry point at `tools/repo-scripts/bin/repoScripts.js`:

```javascript
#!/usr/bin/env node
const { resolve } = require('path');

// Parse command
const [task, ...args] = process.argv.slice(2);

// Find task file
const taskFile = resolve(__dirname, `../dist/tasks/${task}.js`);

// Execute task
require(taskFile);
```

## Package.json Scripts

### Root Level

```json
{
  "scripts": {
    // Interactive development
    "dev": "repo-scripts dev-interactive",
    "dev:all": "concurrently \"npm:v1:dev\" \"npm:v2:dev\"",

    // Task-based commands
    "build": "repo-scripts build",
    "build:prod": "repo-scripts build-prod",
    "test": "repo-scripts test",
    "test:coverage": "repo-scripts test-coverage",
    "test:watch": "repo-scripts test-watch",
    "lint": "repo-scripts lint",
    "lint:fix": "repo-scripts lint-fix",

    // Scaffolding
    "scaffold": "repo-scripts scaffold",

    // V1/V2 specific
    "v1:dev": "cd apps/v1 && npm run dev",
    "v2:dev": "lage dev --scope '@claude-flow/v2-*'"
  }
}
```

### Package Level

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --build && vite build",
    "test": "vitest",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  }
}
```

## Vite Configuration

For web applications:

```typescript
// apps/v2/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4000,
    proxy: {
      '/api': 'http://localhost:4001',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

## Testing Configuration

### Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.d.ts', '**/*.test.ts'],
    },
  },
});
```

### Playwright Setup

```typescript
// apps/e2e/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      - run: pnpm lint
```

## Performance Tips

1. **Use Lage caching**: Don't disable unless debugging
2. **Parallelize tasks**: Lage handles this automatically
3. **Project references**: Enable incremental TypeScript builds
4. **Selective builds**: Use `--filter` to build only what changed
5. **Watch mode**: Use for development to avoid repeated builds

## Troubleshooting

### Common Issues

**Build cache stale**:

```bash
lage clean
pnpm build
```

**TypeScript errors after refactor**:

```bash
# Rebuild project references
tsc --build --force
```

**Module not found errors**:

```bash
# Ensure packages are built
pnpm build --filter '@claude-flow/*'
```

**Lage not running tasks**:

```bash
# Check task dependencies
lage info build
lage validate
```
