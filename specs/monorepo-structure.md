# Monorepo Structure & Tooling Design

## Executive Summary

This document outlines the restructuring of the Claude Flow project into a modern monorepo architecture that supports multiple packages and applications with shared tooling, efficient builds, and streamlined development workflows.

### Goals
- **Modular Architecture**: Clear separation between apps, packages, and tools
- **Shared Configuration**: Centralized ESLint, TypeScript, and build configs
- **Efficient Builds**: Incremental builds with smart caching
- **Developer Experience**: Fast iteration with hot reload and type safety
- **CI/CD Integration**: Automated testing, linting, and deployment
- **Custom Tooling**: Private packages for repo-specific needs

### Technology Choices
- **Package Manager**: pnpm (performance + disk efficiency)
- **Build Orchestration**: Lage (Microsoft's fast, simple task runner)
- **Bundler**: Vite (apps) + esbuild (packages)
- **Linting**: ESLint with custom rules package
- **Type Checking**: TypeScript project references
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Changesets**: For versioning and publishing

## Repository Structure

```
claude-flow/                          # Repository root
├── .github/                          # GitHub configuration
│   ├── workflows/                    # CI/CD workflows
│   │   ├── ci.yml                   # Main CI pipeline
│   │   ├── release.yml              # Release automation
│   │   └── codeql.yml               # Security scanning
│   └── renovate.json                # Dependency updates
│
├── packages/                        # All packages (apps, shared, tools)
│   ├── apps/                        # Applications
│   │   ├── web/                     # Main web application
│   │   │   ├── src/
│   │   │   ├── public/
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   └── vite.config.ts
│   │   │
│   │   ├── server/                  # Backend server
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   └── esbuild.config.js
│   │   │
│   │   ├── cli/                     # CLI tools
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   └── e2e/                     # End-to-end tests
│   │       ├── tests/
│   │       ├── fixtures/
│   │       ├── playwright.config.ts
│   │       └── package.json
│   │
│   ├── shared/                      # Shared packages
│   │   ├── design-system/           # Design system with Storybook
│   │   │   ├── src/
│   │   │   │   ├── components/
│   │   │   │   │   ├── Button/
│   │   │   │   │   │   ├── Button.tsx
│   │   │   │   │   │   ├── Button.stories.tsx
│   │   │   │   │   │   ├── Button.test.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── Input/
│   │   │   │   │   ├── Modal/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── tokens/
│   │   │   │   │   ├── colors.ts
│   │   │   │   │   ├── typography.ts
│   │   │   │   │   ├── spacing.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── hooks/
│   │   │   │   ├── styles/
│   │   │   │   │   └── global.css
│   │   │   │   └── index.ts
│   │   │   ├── .storybook/
│   │   │   │   ├── main.ts
│   │   │   │   ├── preview.ts
│   │   │   │   └── preview.css
│   │   │   ├── package.json
│   │   │   ├── tsconfig.json
│   │   │   ├── vite.config.ts
│   │   │   └── README.md
│   │   │
│   │   ├── data-bus/                # Data bus implementation
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   ├── types/                   # Shared TypeScript types
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   ├── claude-sdk/              # Claude API wrapper
│   │   │   ├── src/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   └── websocket-client/        # WebSocket client library
│   │       ├── src/
│   │       ├── package.json
│   │       └── tsconfig.json
│   │
│   └── tools/                       # Development tools
│       ├── eslint-plugin/           # Custom ESLint rules
│       │   ├── src/
│       │   │   ├── rules/
│       │   │   │   ├── noDirectApiCalls.ts
│       │   │   │   ├── useDataBus.ts
│       │   │   │   ├── maxFileLines.ts
│       │   │   │   └── enforceModuleBoundaries.ts
│       │   │   └── index.ts
│       │   ├── tests/
│       │   ├── package.json
│       │   └── tsconfig.json
│       │
│       ├── repo-scripts/             # Build and utility scripts with CLI
│       │   ├── src/
│       │   │   ├── tasks/
│       │   │   │   ├── build.ts
│       │   │   │   ├── test.ts
│       │   │   │   ├── lint.ts
│       │   │   │   ├── typecheck.ts
│       │   │   │   ├── clean.ts
│       │   │   │   ├── dev.ts
│       │   │   │   ├── release.ts
│       │   │   │   └── checkDeps.ts
│       │   │   ├── utils/
│       │   │   │   ├── logger.ts
│       │   │   │   ├── spinner.ts
│       │   │   │   ├── errorHandler.ts
│       │   │   │   └── process.ts
│       │   │   └── index.ts
│       │   ├── bin/
│       │   │   └── repoScripts.js
│       │   ├── package.json
│       │   └── tsconfig.json
│       │
│       ├── tsconfig/                # Shared TypeScript configs
│       │   ├── base.json
│       │   ├── react.json
│       │   ├── node.json
│       │   └── package.json
│       │
│       └── eslint-config/           # Shared ESLint configs
│           ├── base.js
│           ├── react.js
│           ├── node.js
│           └── package.json
│
├── docs/                            # Documentation
│   ├── architecture/
│   ├── api/
│   └── contributing.md
│
├── .changeset/                      # Changesets for versioning
│   └── config.json
│
├── lage.config.js                   # Lage configuration
├── pnpm-workspace.yaml              # pnpm workspace config
├── package.json                     # Root package.json
├── tsconfig.json                    # Root TypeScript config
├── .eslintrc.js                     # Root ESLint config
├── .prettierrc                      # Prettier config
├── .gitignore
└── README.md
```

## Package Management with pnpm

### Why pnpm?
- **Disk efficiency**: Hard links save space with shared dependencies
- **Speed**: Faster than npm/yarn for monorepos
- **Strict**: Prevents phantom dependencies
- **Workspaces**: First-class monorepo support

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
  - 'config/*'
  - 'e2e'
```

### Root package.json

```json
{
  "name": "claude-flow",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@8.15.0",
  "scripts": {
    "build": "lage build",
    "dev": "lage dev --parallel",
    "test": "lage test",
    "lint": "lage lint",
    "typecheck": "lage typecheck",
    "clean": "lage clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "prepare": "husky install",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "lage build --scope=\"@claude-flow/*\" && changeset publish",
    "deps:check": "pnpm -r exec depcheck",
    "deps:update": "pnpm update -r --interactive",
    "workspace:info": "pnpm ls -r --depth -1",
    "graph": "lage info --reporter json > graph.json",
    "affected:build": "lage build --since origin/main",
    "affected:test": "lage test --since origin/main",
    "affected:lint": "lage lint --since origin/main",
    "cache:clean": "rm -rf .lage-cache"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.11.0",
    "depcheck": "^1.4.7",
    "esbuild": "^0.19.0",
    "husky": "^9.0.0",
    "lage": "^2.7.0",
    "prettier": "^3.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.2.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.15.0"
  },
  "pnpm": {
    "overrides": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    }
  }
}
```

## Build Orchestration with Lage

### Why Lage?
- **Simple**: Minimal configuration, maximum performance
- **Fast**: Optimized task scheduling and caching
- **Local-first**: No cloud dependency, all caching is local
- **Git-aware**: Built-in support for affected packages
- **Lightweight**: Small footprint, fast startup
- **Microsoft-backed**: Battle-tested in large monorepos

### Lage Configuration

```javascript
// lage.config.js
module.exports = {
  pipeline: {
    build: {
      // Build depends on build of dependencies
      dependsOn: ["^build"],
      outputs: ["dist/**", "lib/**"],
      cache: true
    },
    
    test: {
      // Test depends on build
      dependsOn: ["build"],
      outputs: [],
      cache: true
    },
    
    lint: {
      // Lint can run independently
      outputs: [],
      cache: true
    },
    
    typecheck: {
      // Type checking depends on build of dependencies
      dependsOn: ["^build"],
      outputs: ["*.tsbuildinfo"],
      cache: true
    },
    
    dev: {
      // Dev servers don't cache
      cache: false,
      persistent: true
    },
    
    clean: {
      // Clean should always run
      cache: false
    }
  },
  
  // Cache location
  cacheOptions: {
    cacheStorageConfig: {
      provider: "local",
      options: {
        cacheDirectory: ".lage-cache"
      }
    }
  },
  
  // Ignore patterns
  ignore: [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**"
  ],
  
  // Priority for scheduling
  priorities: [
    {
      package: "@claude-flow/shared-types",
      priority: 100
    },
    {
      package: "@claude-flow/ui",
      priority: 90
    }
  ]
};
```

### Package.json Scripts

Each package defines standard scripts that Lage orchestrates:

```json
// packages/ui/package.json
{
  "name": "@claude-flow/ui",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist lib *.tsbuildinfo"
  },
  "dependencies": {
    "@claude-flow/shared-types": "workspace:*"
  }
}
```

## Design System with Storybook

### Package Structure

The design system is a separate package that provides consistent UI components, design tokens, and documentation through Storybook.

```json
// packages/shared/design-system/package.json
{
  "name": "@claude-flow/design-system",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles/global.css"
  },
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "tsup && pnpm build:css",
    "build:css": "postcss src/styles/**/*.css --dir dist/styles",
    "build:storybook": "storybook build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "chromatic": "chromatic --project-token=$CHROMATIC_PROJECT_TOKEN"
  },
  "dependencies": {
    "clsx": "^2.1.0",
    "react-aria": "^3.32.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@storybook/addon-essentials": "^7.6.0",
    "@storybook/addon-interactions": "^7.6.0",
    "@storybook/addon-links": "^7.6.0",
    "@storybook/blocks": "^7.6.0",
    "@storybook/react": "^7.6.0",
    "@storybook/react-vite": "^7.6.0",
    "@storybook/test": "^7.6.0",
    "chromatic": "^10.0.0",
    "postcss": "^8.4.0",
    "postcss-cli": "^11.0.0",
    "storybook": "^7.6.0"
  }
}
```

### Component Structure

Each component follows a consistent structure:

```typescript
// packages/shared/design-system/src/components/Button/Button.tsx
import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { useButton } from 'react-aria';
import * as tokens from '../../tokens';
import styles from './Button.module.css';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, ...props }, ref) => {
    const { buttonProps } = useButton(props, ref);
    
    return (
      <button
        {...buttonProps}
        ref={ref}
        className={clsx(
          styles.button,
          styles[variant],
          styles[size]
        )}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Storybook Stories

```typescript
// packages/shared/design-system/src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

### Design Tokens

```typescript
// packages/shared/design-system/src/tokens/colors.ts
export const colors = {
  // Primitive colors
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Semantic colors
  primary: {
    DEFAULT: '#3b82f6',
    hover: '#2563eb',
    active: '#1d4ed8',
  },
  
  danger: {
    DEFAULT: '#ef4444',
    hover: '#dc2626',
    active: '#b91c1c',
  },
  
  // Neutral colors
  gray: {
    // ... gray scale
  },
} as const;

// Type-safe color getter
export function getColor(path: string): string {
  // Implementation
}
```

### Storybook Configuration

```typescript
// packages/shared/design-system/.storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

```typescript
// packages/shared/design-system/.storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
```

### Using the Design System

In your app:

```typescript
// apps/web/src/App.tsx
import { Button, Input, Modal } from '@claude-flow/design-system';
import '@claude-flow/design-system/styles';

function App() {
  return (
    <div>
      <Button variant="primary" size="lg" onClick={() => alert('Clicked!')}>
        Click me
      </Button>
    </div>
  );
}
```

### Development Workflow

```bash
# Start Storybook dev server
cd packages/shared/design-system
pnpm dev

# Run visual regression tests
pnpm chromatic

# Build design system
pnpm build

# Build Storybook static site
pnpm build:storybook
```

### Benefits

1. **Isolation**: Components developed in isolation
2. **Documentation**: Auto-generated docs from stories
3. **Testing**: Visual regression with Chromatic
4. **Consistency**: Enforced through design tokens
5. **Accessibility**: Built-in with react-aria

## Custom ESLint Plugin

### Package Structure

```typescript
// tools/eslint-plugin-claude/src/index.ts
export = {
  rules: {
    'no-direct-api-calls': require('./rules/noDirectApiCalls'),
    'use-data-bus': require('./rules/useDataBus'),
    'max-file-lines': require('./rules/maxFileLines'),
    'enforce-module-boundaries': require('./rules/enforceModuleBoundaries'),
    'no-circular-imports': require('./rules/noCircularImports'),
    'consistent-naming': require('./rules/consistentNaming'),
  },
  configs: {
    recommended: {
      plugins: ['@claude-flow/eslint-plugin-claude'],
      rules: {
        '@claude-flow/claude/no-direct-api-calls': 'error',
        '@claude-flow/claude/use-data-bus': 'warn',
        '@claude-flow/claude/max-file-lines': ['error', { max: 500 }],
        '@claude-flow/claude/enforce-module-boundaries': 'error',
      }
    }
  }
};
```

### Example Custom Rule

```typescript
// tools/eslint-plugin-claude/src/rules/noDirectApiCalls.ts
import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/claude-flow/docs/rules/${name}`
);

export const noDirectApiCalls = createRule({
  name: 'no-direct-api-calls',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct API calls outside of data providers',
      recommended: 'error',
    },
    messages: {
      noDirectCall: 'Direct API calls are not allowed. Use DataBus providers instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          ['fetch', 'axios', 'apiClient'].includes(node.callee.object.name)
        ) {
          const filename = context.getFilename();
          if (!filename.includes('/providers/') && !filename.includes('/services/')) {
            context.report({
              node,
              messageId: 'noDirectCall',
            });
          }
        }
      },
    };
  },
});
```

### Shared ESLint Configuration

```javascript
// config/eslint/base.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@claude-flow/claude/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'import'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],
  },
};
```

## TypeScript Configuration

### Project References

```json
// tsconfig.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "references": [
    { "path": "./apps/web" },
    { "path": "./apps/server" },
    { "path": "./packages/ui" },
    { "path": "./packages/data-bus" },
    { "path": "./packages/shared-types" },
    { "path": "./tools/eslint-plugin-claude" }
  ]
}
```

### Package TypeScript Config

```json
// packages/ui/tsconfig.json
{
  "extends": "@claude-flow/tsconfig/react.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src"],
  "references": [
    { "path": "../shared-types" }
  ]
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  CI: true
  NODE_ENV: test

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.0
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm lint
      
      - run: pnpm format:check

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.0
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.0
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm test -- --shard=${{ matrix.shard }}/4
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.shard }}
          path: |
            **/test-results/
            **/coverage/

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.0
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - run: pnpm build
      
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: |
            apps/*/dist
            packages/*/dist

  e2e:
    name: E2E Tests
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.0
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - run: pnpm install --frozen-lockfile
      
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          
      - run: pnpm exec playwright install --with-deps
      
      - run: pnpm -F e2e test
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

## Additional Tooling

### 1. Changesets for Versioning
```json
// .changeset/config.json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [["@claude-flow/*"]],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@claude-flow/e2e"]
}
```

### 2. Husky for Git Hooks
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

### 3. Lint-staged Configuration
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}
```

### 4. Depcheck for Dependency Management
```javascript
// tools/scripts/checkDependencies.mjs
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const workspaces = JSON.parse(
  execSync('pnpm ls -r --json --depth -1', { encoding: 'utf-8' })
);

for (const workspace of workspaces) {
  console.log(`Checking ${workspace.name}...`);
  try {
    execSync(`pnpm -F ${workspace.name} exec depcheck`, { 
      stdio: 'inherit' 
    });
  } catch (error) {
    process.exit(1);
  }
}
```

### 5. Bundle Analysis
```typescript
// apps/web/vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [
    process.env.ANALYZE && visualizer({
      open: true,
      filename: 'dist/stats.html',
    }),
  ],
};
```

### 6. Workspace Constraints
```javascript
// .pnpmfile.cjs
module.exports = {
  hooks: {
    readPackage(pkg) {
      // Enforce consistent versions
      if (pkg.dependencies?.react) {
        pkg.dependencies.react = '^18.2.0';
      }
      return pkg;
    },
  },
};
```

## Development Workflow

### 1. Creating a New Package
```bash
# Create package directory
mkdir -p packages/my-package/src

# Initialize package
cd packages/my-package
pnpm init

# Add TypeScript config
echo '{"extends": "@claude-flow/tsconfig/base.json"}' > tsconfig.json

# Add to workspace
pnpm install
```

### 2. Running Development
```bash
# Start all apps in dev mode
pnpm dev

# Start specific app
lage dev --scope web

# Run tests in watch mode
cd packages/data-bus && pnpm test:watch

# View task info
lage info
```

### 3. Building for Production
```bash
# Build everything
pnpm build

# Build specific package and dependencies
lage build --scope server

# Build only affected packages (changed since main)
lage build --since origin/main

# Build without cache
lage build --no-cache

# Build with verbose output
lage build --verbose
```

### 4. Managing Dependencies
```bash
# Add dependency to specific package
pnpm -F web add react-query

# Add dev dependency to root
pnpm add -D -w prettier

# Update all dependencies interactively
pnpm update -i -r

# Check for unused dependencies
pnpm deps:check
```

## Best Practices

### 1. Package Boundaries
- **Apps** depend on packages, never other apps
- **Packages** can depend on other packages
- **Tools** are development-only, not runtime dependencies
- Use TypeScript project references for type safety

### 2. Naming Conventions
- **Packages**: `@claude-flow/package-name`
- **Apps**: Simple names (web, server, cli)
- **File names**: `kebab-case.ts`
- **Exports**: Named exports preferred

### 3. Testing Strategy
- **Unit tests**: Co-located with source files
- **Integration tests**: In `__tests__` directories
- **E2E tests**: Separate e2e package
- **Coverage**: Minimum 80% for packages

### 4. Performance Optimization
- Use `esbuild` for package builds (faster than tsc)
- Leverage Lage's local caching (no cloud dependency)
- Parallelize CI jobs with `--since` for affected packages
- Use `pnpm` for faster installs
- Optimize task scheduling with priority configuration

### 5. Release Process
1. Create changeset: `pnpm changeset`
2. Review changes: `pnpm changeset status`
3. Version packages: `pnpm version-packages`
4. Build packages: `pnpm build --filter='./packages/*'`
5. Publish: `pnpm release`

## Migration Plan

### Phase 1: Repository Setup (Week 1)
1. Initialize pnpm workspace
2. Setup Turborepo
3. Create base configurations
4. Setup CI/CD pipeline

### Phase 2: Extract Packages (Week 2-3)
1. Move UI components to `packages/ui`
2. Extract data bus to `packages/data-bus`
3. Create shared types package
4. Setup build pipelines

### Phase 3: Migrate Apps (Week 4)
1. Move web app to `apps/web`
2. Move server to `apps/server`
3. Update import paths
4. Verify builds

### Phase 4: Add Tooling (Week 5)
1. Create ESLint plugin
2. Add custom scripts
3. Setup automated testing
4. Add documentation

### Phase 5: Optimization (Week 6)
1. Enable remote caching
2. Optimize CI pipeline
3. Add bundle analysis
4. Performance testing

## Alternative Build Tools

### Other Options Considered
1. **Rush** (Microsoft) - Enterprise-grade monorepo manager
   - Pros: Battle-tested at scale, great for large teams
   - Cons: More complex setup, steeper learning curve

2. **Lerna** (Nrwl/Nx team) - Original JS monorepo tool
   - Pros: Simple, widely adopted
   - Cons: Less performant than modern alternatives

3. **Bazel** (Google) - Language-agnostic build tool
   - Pros: Extremely fast, perfect reproducibility
   - Cons: Complex configuration, overkill for JS projects

4. **Gradle** - Polyglot build tool
   - Pros: Very powerful, great for mixed-language repos
   - Cons: JVM dependency, less JS ecosystem integration

### Why Lage?
- **No cloud dependency**: All caching is local
- **Microsoft proven**: Used in Office, VS Code, and other large repos
- **Simple**: Minimal configuration required
- **Fast**: Optimized C++ core for performance
- **Git-aware**: Built-in support for changed packages

## Additional Tooling Options

### Package Bundlers (Non-Vercel)
- **esbuild**: Lightning fast, Go-based bundler
- **Rollup**: The original ES module bundler
- **Parcel**: Zero-config bundler
- **webpack**: The proven, configurable bundler

### Development Servers
- **Vite**: Fast dev server (independent project)
- **wmr**: Preact team's dev server
- **Snowpack**: ESM-based dev server

## Conclusion

This monorepo structure provides:
- **Scalability**: Easy to add new apps and packages
- **Maintainability**: Clear boundaries and shared tooling
- **Performance**: Incremental builds and caching
- **Developer Experience**: Fast feedback and type safety
- **Quality**: Automated testing and linting
- **Independence**: No vendor lock-in with open source tools
- **Design Consistency**: Centralized design system with Storybook

### Key Benefits of the Design System

1. **Single Source of Truth**: All UI components live in one place
2. **Visual Documentation**: Storybook provides living documentation
3. **Isolation**: Components developed without app context
4. **Reusability**: Share components across all apps
5. **Testing**: Visual regression testing with Chromatic
6. **Design Tokens**: Consistent colors, spacing, and typography
7. **Accessibility**: Built-in with react-aria

The combination of pnpm, Lage, Storybook, and custom tooling creates a robust foundation for the Claude Flow project that can grow with the team's needs while maintaining complete control over the build pipeline - all without any cloud dependencies.