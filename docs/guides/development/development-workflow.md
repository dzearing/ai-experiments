# Development Workflow

This guide covers daily development practices and common workflows in the Claude Flow monorepo.

## Task-Based CLI Commands

We use explicit task files instead of command-line arguments for better discoverability and type safety.

### Available Commands

```bash
# Building
pnpm build              # Standard development build
pnpm build:prod         # Optimized production build

# Testing  
pnpm test               # Run tests once
pnpm test:coverage      # Generate coverage report
pnpm test:watch         # Watch mode for TDD

# Code Quality
pnpm lint               # Check for linting issues
pnpm lint:fix           # Auto-fix linting issues
pnpm typecheck          # TypeScript type checking

# Development
pnpm dev                # Start dev server with hot reload
pnpm clean              # Remove build artifacts
```

### Why Task Files?

Instead of:
```bash
# Old approach - hard to discover options
repo-scripts test --coverage --watch --reporter=verbose
```

We use:
```bash
# New approach - each variant is discoverable
pnpm test:coverage
pnpm test:watch
```

Benefits:
- All commands visible in package.json
- Each task file can have specific TypeScript types
- No complex argument parsing needed
- Better documentation per task

## Local Configuration System

Packages can opt-in to specific tools by adding configuration files.

### How It Works

```bash
packages/my-app/
├── src/
├── package.json
├── tsconfig.json      # Extends base, enables TypeScript
├── .eslintrc.js       # Extends base, enables linting
└── vitest.config.ts   # Enables testing for this package
```

**Repo scripts behavior**:
- ✅ `tsconfig.json` exists → TypeScript runs
- ✅ `.eslintrc.js` exists → ESLint runs  
- ✅ `vitest.config.ts` exists → Tests run
- ❌ No config → Tool skips this package (no-op)

### Example Configurations

**TypeScript** (`tsconfig.json`):
```json
{
  "extends": "@claude-flow/tsconfig/react.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/design-system" }
  ]
}
```

**ESLint** (`.eslintrc.js`):
```javascript
module.exports = {
  extends: ['@claude-flow/eslint-config/react'],
  rules: {
    // Package-specific overrides
    'react/prop-types': 'off'
  }
};
```

**Vitest** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});
```

## Common Development Patterns

### Adding a New Feature

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Scaffold if needed**
   ```bash
   # Need a new component?
   pnpm scaffold component MyComponent --package design-system
   ```

3. **Develop with hot reload**
   ```bash
   pnpm dev
   ```

4. **Write tests alongside code**
   ```bash
   pnpm test:watch
   ```

5. **Check your work**
   ```bash
   pnpm lint:fix
   pnpm typecheck
   pnpm test
   ```

### Working Across Packages

When your feature spans multiple packages:

1. **Make changes in dependency order**
   - First: shared types
   - Second: utility packages  
   - Third: UI components
   - Last: applications

2. **Use workspace commands**
   ```bash
   # Build all affected packages
   pnpm build --filter ...my-app
   
   # Test a specific package
   pnpm test --filter @claude-flow/design-system
   ```

3. **Verify with E2E tests**
   ```bash
   cd apps/e2e
   pnpm test
   ```

### Debugging

#### Client-Side Debugging

1. **Browser DevTools**
   - Use debugger statements
   - React Developer Tools
   - Network tab for API calls

2. **VS Code Debugging**
   ```json
   {
     "type": "chrome",
     "request": "launch",
     "name": "Debug V2 Web",
     "url": "http://localhost:4000",
     "webRoot": "${workspaceFolder}/apps/v2/web"
   }
   ```

#### Server-Side Debugging

1. **Console Logging**
   ```typescript
   console.log('Debug info:', { data });
   ```

2. **VS Code Debugging**
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug V2 Server",
     "runtimeExecutable": "pnpm",
     "runtimeArgs": ["run", "dev"],
     "cwd": "${workspaceFolder}/apps/v2/server"
   }
   ```

#### TypeScript Issues

```bash
# See all type errors
pnpm typecheck

# Check a specific package
cd packages/my-package
pnpm typecheck

# Generate declaration files
pnpm build --declaration
```

## Testing Strategies

### Unit Tests

Write tests next to the code:
```
src/
├── Button.tsx
├── Button.test.tsx    # Unit tests
└── Button.stories.tsx # Visual tests
```

Run tests:
```bash
pnpm test              # Single run
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

### Integration Tests

For API endpoints and services:
```typescript
// server/routes/api.test.ts
import { createTestClient } from '../test/utils';

test('GET /api/users returns users', async () => {
  const client = createTestClient();
  const response = await client.get('/api/users');
  expect(response.status).toBe(200);
});
```

### E2E Tests

Located in `apps/e2e/`:
```typescript
// apps/e2e/tests/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Performance Optimization

### Build Performance

1. **Use Lage caching**
   ```bash
   # First build is slow
   pnpm build
   
   # Subsequent builds are fast (cached)
   pnpm build
   ```

2. **Build specific packages**
   ```bash
   # Only build what changed
   pnpm build --filter my-package
   ```

3. **Clean when needed**
   ```bash
   # If cache is stale
   pnpm clean
   pnpm build
   ```

### Development Performance

1. **Use project references**
   - Faster TypeScript checking
   - Incremental compilation

2. **Optimize imports**
   ```typescript
   // ❌ Slow - imports entire library
   import _ from 'lodash';
   
   // ✅ Fast - imports only what's needed
   import debounce from 'lodash/debounce';
   ```

## Code Quality

### Pre-commit Checks

Before committing:
```bash
# Fix formatting
pnpm lint:fix

# Check types
pnpm typecheck

# Run tests
pnpm test
```

### Code Review Checklist

- [ ] Tests added/updated
- [ ] TypeScript types correct
- [ ] No console.log left
- [ ] Documentation updated
- [ ] Follows naming conventions
- [ ] No hardcoded values

## Troubleshooting Workflows

### Dependency Issues

```bash
# Clear all caches
pnpm clean
rm -rf node_modules
pnpm install

# Update dependencies
pnpm update --interactive
```

### Type Errors

```bash
# Rebuild packages in order
pnpm build --filter '@claude-flow/*'

# Check for circular dependencies
pnpm why <package-name>
```

### Test Failures

```bash
# Run specific test
pnpm test -- Button.test.tsx

# Debug mode
pnpm test:debug

# Update snapshots
pnpm test -- -u
```

## Best Practices

### Do's
- ✅ Write tests for new features
- ✅ Use TypeScript types (avoid `any`)
- ✅ Follow existing patterns
- ✅ Clean up console.logs
- ✅ Update documentation

### Don'ts
- ❌ Commit directly to main
- ❌ Skip tests to save time
- ❌ Use relative imports across packages
- ❌ Ignore TypeScript errors
- ❌ Leave TODO comments without tickets

## Daily Workflow Example

A typical day might look like:

```bash
# Morning - sync with latest
git pull origin main
pnpm install

# Start development
pnpm dev

# Make changes, test as you go
pnpm test:watch

# Before lunch - checkpoint
pnpm lint:fix
pnpm typecheck
git add -A
git commit -m "feat: work in progress"

# After lunch - continue development
# ... more changes ...

# End of day - clean up and push
pnpm test
pnpm build
git push origin feature/my-feature

# Create PR for review
```