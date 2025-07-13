# Adding Project Templates

This guide explains how to create new scaffolding templates for the monorepo.

## Overview

Templates are used by the `pnpm scaffold` command to quickly create new packages with consistent structure and configuration. Each template is a directory containing EJS template files and a manifest.

## Template Structure

Templates are located in `tools/repo-scripts/src/templates/`:

```
templates/
├── web-app/
│   ├── template.json         # Template manifest
│   ├── package.json.ejs      # Package configuration
│   ├── tsconfig.json.ejs     # TypeScript config
│   ├── .eslintrc.js.ejs      # ESLint config
│   ├── README.md.ejs         # Documentation
│   └── src/
│       ├── index.tsx.ejs     # Entry point
│       └── App.tsx.ejs       # Main component
└── your-new-template/        # Your template here
```

## Creating a New Template

### Step 1: Create Template Directory

```bash
mkdir tools/repo-scripts/src/templates/my-template
```

### Step 2: Create Template Manifest

Create `template.json` to define your template:

```json
{
  "name": "my-template",
  "description": "Description shown in scaffold list",
  "variables": [
    {
      "name": "name",
      "prompt": "Package name",
      "validate": "^[a-z][a-z0-9-]*$",
      "filter": "kebabCase"
    },
    {
      "name": "displayName", 
      "prompt": "Display name",
      "default": "{{name | pascalCase}}"
    },
    {
      "name": "port",
      "prompt": "Dev server port",
      "default": "3000",
      "when": "hasDevServer"
    },
    {
      "name": "hasTests",
      "prompt": "Include tests?",
      "type": "confirm",
      "default": true
    }
  ],
  "files": [
    "package.json",
    "tsconfig.json",
    "README.md",
    "src/index.ts"
  ],
  "conditionalFiles": [
    {
      "condition": "hasTests",
      "files": ["vitest.config.ts", "src/test/setup.ts"]
    }
  ],
  "hooks": {
    "postScaffold": [
      "pnpm install",
      "git add ."
    ]
  }
}
```

### Step 3: Create Template Files

Use EJS syntax for variable substitution:

**`package.json.ejs`**:
```json
{
  "name": "@claude-flow/<%= name %>",
  "version": "0.0.1",
  "description": "<%= description %>",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@claude-flow/types": "workspace:*"
  },
  "devDependencies": {
    "@claude-flow/eslint-config": "workspace:*",
    "@claude-flow/tsconfig": "workspace:*"<% if (hasTests) { %>,
    "vitest": "^1.0.0"<% } %>
  }
}
```

**`tsconfig.json.ejs`**:
```json
{
  "extends": "@claude-flow/tsconfig/<%= isReact ? 'react' : 'node' %>.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/types" }
  ]
}
```

**`src/index.ts.ejs`**:
```typescript
/**
 * <%= displayName %>
 * <%= description %>
 */

export function hello(): string {
  return 'Hello from <%= name %>';
}

<% if (hasTests) { %>
// Export for testing
export * from './utils';
<% } %>
```

### Step 4: Add Conditional Files

For files that should only be created based on user choices:

**`vitest.config.ts.ejs`** (only if `hasTests` is true):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: '<%= isReact ? "jsdom" : "node" %>'
  }
});
```

## Template Variables

### Built-in Variables

These are automatically available in all templates:

- `targetPath` - Full path where package is being created
- `packageName` - Final package name
- `timestamp` - Current timestamp
- `year` - Current year

### Variable Types

```typescript
interface TemplateVariable {
  name: string;           // Variable name
  prompt: string;         // Question to ask user
  type?: 'input' | 'confirm' | 'list' | 'number';
  default?: any;          // Default value or function
  validate?: string | ((input: any) => boolean | string);
  filter?: string | ((input: any) => any);
  when?: string | ((answers: any) => boolean);
  choices?: Array<string | { name: string; value: any }>;
}
```

### Filters

Available filters for transforming input:

- `kebabCase` - Convert to kebab-case
- `camelCase` - Convert to camelCase
- `pascalCase` - Convert to PascalCase
- `snakeCase` - Convert to snake_case
- `upperCase` - Convert to UPPERCASE
- `lowerCase` - Convert to lowercase

## EJS Syntax Reference

### Basic Substitution
```ejs
<%= variableName %>
```

### Conditional Content
```ejs
<% if (condition) { %>
  Content when true
<% } else { %>
  Content when false
<% } %>
```

### Loops
```ejs
<% dependencies.forEach(dep => { %>
  "<%= dep %>": "workspace:*",
<% }) %>
```

### Filters in EJS
```ejs
<%= name | pascalCase %>
<%= description | upperCase %>
```

## Advanced Features

### Dynamic File Names

Use variables in file names by adding to the manifest:

```json
{
  "dynamicFiles": [
    {
      "template": "src/{{name}}.ts.ejs",
      "output": "src/<%= name %>.ts"
    }
  ]
}
```

### Custom Validators

Create custom validation functions:

```typescript
// In template.json
{
  "variables": [{
    "name": "port",
    "validate": "validatePort"
  }]
}

// In validators.ts
export function validatePort(input: string): boolean | string {
  const port = parseInt(input);
  if (port < 1024) return 'Port must be >= 1024';
  if (port > 65535) return 'Port must be <= 65535';
  return true;
}
```

### Post-Scaffold Hooks

Run commands after scaffolding:

```json
{
  "hooks": {
    "postScaffold": [
      "pnpm install",
      "pnpm build",
      "git add .",
      "echo 'Package created successfully!'"
    ]
  }
}
```

## Testing Your Template

1. **Test locally**:
   ```bash
   cd tools/repo-scripts
   pnpm build
   node ./dist/tasks/scaffold.js my-template test-package
   ```

2. **Verify all files created correctly**

3. **Check variable substitution**

4. **Test conditional files**

## Best Practices

1. **Keep templates minimal** - Only include essential files
2. **Use shared configs** - Extend from base configs
3. **Document variables** - Clear prompts and descriptions
4. **Validate inputs** - Prevent invalid package names
5. **Test edge cases** - Empty inputs, special characters
6. **Version templates** - Track changes in template.json

## Example Templates

### React Component Library

```json
{
  "name": "component-library",
  "description": "React component library with Storybook",
  "variables": [
    {
      "name": "name",
      "prompt": "Library name"
    },
    {
      "name": "useStorybook",
      "prompt": "Include Storybook?",
      "type": "confirm",
      "default": true
    }
  ]
}
```

### Node.js Service

```json
{
  "name": "node-service",
  "description": "Node.js backend service",
  "variables": [
    {
      "name": "name",
      "prompt": "Service name"
    },
    {
      "name": "port",
      "prompt": "Service port",
      "default": "3000"
    },
    {
      "name": "database",
      "prompt": "Database type",
      "type": "list",
      "choices": ["none", "postgres", "mongodb", "redis"]
    }
  ]
}
```

### ESLint Rule

```json
{
  "name": "eslint-rule",
  "description": "Custom ESLint rule",
  "variables": [
    {
      "name": "ruleName",
      "prompt": "Rule name (kebab-case)",
      "validate": "^[a-z][a-z0-9-]*$"
    },
    {
      "name": "category",
      "prompt": "Rule category",
      "type": "list",
      "choices": ["errors", "best-practices", "stylistic"]
    }
  ]
}
```

## Updating the CLI

After adding a template, update the scaffold task to include it:

1. The template is automatically discovered from the templates directory
2. It appears in `pnpm scaffold --list`
3. Users can scaffold with `pnpm scaffold my-template package-name`

## Maintenance

1. **Update existing templates** when dependencies change
2. **Test templates** after monorepo structure changes
3. **Document breaking changes** in template changelog
4. **Version templates** if they have breaking changes