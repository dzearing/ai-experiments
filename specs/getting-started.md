# Getting Started

Welcome to the Claude Flow monorepo! This guide will help you get up and running quickly.

## What is Claude Flow?

Claude Flow is a project management and workflow automation platform that integrates with Claude AI to help teams manage multiple projects simultaneously using intelligent agents.

### Key Concepts

**Workspace Structure**:
- **Workspace**: The top-level container for all your projects
- **Projects**: Individual products or initiatives within the workspace
- **Repositories**: One or more code repos linked to each project
- **Work Items**: Tasks to fix issues or achieve goals
  - Can have child items (subtasks)
  - Automatically created from user feedback
  - Tracked through completion

**Agent-Driven Workflow**:
1. **Planning**: Agents analyze work items and create detailed execution plans
2. **Refinement**: Plans are refined to ensure proper implementation and validation
3. **Execution**: Human-approved work items trigger agent execution
4. **Development**: Agents make code changes and write tests
5. **Validation**: All acceptance criteria are verified
6. **Submission**: Agents create PRs with validation links
7. **Review**: Humans review code and test functionality
8. **Completion**: Merging the PR closes the work item

**GitHub Integration**:
- Authenticates agents to work on your behalf
- Syncs with GitHub Issues and Pull Requests
- Tracks external issues as work items
- Enables seamless collaboration

### Architecture Overview

The codebase is organized as a monorepo containing:
- **Web Applications**: User interfaces for project management
- **Backend Services**: API servers and agent orchestration
- **Shared Packages**: Reusable components and utilities
- **Development Tools**: Build scripts and custom tooling

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
  ```bash
  node --version  # Should output v18.x.x or higher
  ```

- **pnpm**: Version 8.0.0 or higher (for v2 development)
  ```bash
  npm install -g pnpm@8
  pnpm --version  # Should output 8.x.x or higher
  ```

- **Git**: For version control
- **VS Code** (recommended): With the following extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd claude-flow
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies (both v1 and v2)
   npm run install
   ```

   This command will:
   - Install v1 dependencies using npm
   - Install v2 dependencies using pnpm
   - Set up workspace links

3. **Verify installation**
   ```bash
   # Run a simple build to verify everything works
   npm run v2:build
   ```

## Your First Build

### Interactive Development

The easiest way to start development is using the interactive dev command:

```bash
# Start interactive development menu
yarn dev

# You'll see options like:
# ? What would you like to start?
# ❯ V2 Web (port 4000)
#   V2 Server (port 4001)
#   V2 Web + Server
#   V1 Web (port 3000)
#   V1 Server (port 3001)
#   V1 Web + Server
#   Everything (all services)
#   Storybook (port 6006)
```

### Direct Commands

You can also start services directly:

```bash
# Start V2 services (recommended for new features)
npm run v2:dev

# Start V1 services (for bug fixes only)
npm run v1:dev

# Start everything
npm run dev:all
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| V1 Web | 3000 | http://localhost:3000 |
| V1 Server | 3001 | http://localhost:3001 |
| V2 Web | 4000 | http://localhost:4000 |
| V2 Server | 4001 | http://localhost:4001 |
| Storybook | 6006 | http://localhost:6006 |

## Creating Your First Feature

Let's create a simple feature in v2. We'll add a new component to the design system:

1. **Navigate to the design system**
   ```bash
   cd packages/design-system
   ```

2. **Create a new component using scaffolding**
   ```bash
   # From the root directory
   pnpm scaffold component Button --package design-system
   ```

3. **Start Storybook to see your component**
   ```bash
   # From packages/design-system
   pnpm storybook
   ```

4. **Write your component** in `src/components/Button/Button.tsx`

5. **Add tests** in `src/components/Button/Button.test.tsx`

6. **Run tests**
   ```bash
   pnpm test
   ```

7. **Run all potential checks that will be ran during PR**
  ```bash
  cd ../..
  pnpm ci
  ```

8. **Create a branch and submit a PR**
   ```bash
   # Create branch following naming conventions
   git checkout -b feature/add-button-component
   # Branch naming conventions:
   # - feature/description - For new features
   # - fix/description - For bug fixes  
   # - chore/description - For maintenance tasks
   # - docs/description - For documentation updates
   
   # Commit your changes
   git add .
   git commit -m "feat: add Button component to design system"
   
   # Push to remote
   git push -u origin feature/add-button-component
   
   # Create PR via GitHub CLI or web interface
   gh pr create --title "Add Button component" --body "Adds new Button component with tests and stories"
   ```


## Common Commands

### Development
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm test         # Run tests
pnpm lint         # Check code style
pnpm lint:fix     # Fix code style issues
pnpm typecheck    # Check TypeScript types
```

### Creating new packages
```bash
pnpm scaffold web-app my-app              # New web application
pnpm scaffold node-service my-service     # New Node.js service  
pnpm scaffold component-library my-lib    # New component library
pnpm scaffold node-library my-utils       # New utility library
```

## Project Structure Overview

```
claude-flow/
├── apps/           # Applications
│   ├── v1/         # Legacy applications
│   └── v2/         # New architecture applications
├── packages/       # Shared packages
├── tools/          # Development tools
└── shared/         # Shared resources between v1 and v2
```

For detailed structure information, see [monorepo-structure.md](./monorepo-structure.md).

## IDE Setup

### VS Code Settings

Create `.vscode/settings.json` in the root:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Debugging

For debugging v2 applications, add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug V2 Server",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/apps/v2/server",
      "console": "integratedTerminal"
    }
  ]
}
```

## Troubleshooting

### Common Issues

**Problem**: `pnpm: command not found`
- **Solution**: Install pnpm globally: `npm install -g pnpm@8`

**Problem**: Build fails with TypeScript errors
- **Solution**: Run `pnpm typecheck` to see detailed errors, ensure your IDE is using the workspace TypeScript version

**Problem**: "Port already in use" error
- **Solution**: Check if another instance is running, or use `lsof -i :PORT` to find and kill the process

**Problem**: Dependencies out of sync
- **Solution**: Run `pnpm install` from the root directory

## Next Steps

- Read [development-workflow.md](./development-workflow.md) for daily development practices
- Review [architecture-decisions.md](./architecture-decisions.md) to understand our technical choices
- Check [build-tooling.md](./build-tooling.md) for advanced build configuration

## Getting Help

- Check existing documentation in the `/docs` folder
- Ask questions in the team chat
- Review similar code in the codebase
- Check the [troubleshooting guide](#troubleshooting) above

## Quick Reference

### Root Commands (run from repository root)

| Task | Command | Description |
|------|---------|-------------|
| Start development | `yarn dev` | Interactive menu to choose services |
| Run all tests | `pnpm test` | Tests all packages |
| Build everything | `pnpm build` | Builds all packages |
| Check all linting | `pnpm lint` | Lints all packages |
| Fix all linting | `pnpm lint:fix` | Auto-fixes issues |
| Add new package | `pnpm scaffold <type> <name>` | Create from template |
| Update all deps | `pnpm update` | Updates dependencies |

### Package Commands (run from package directory)

```bash
cd packages/my-package  # or apps/v2/web
```

| Task | Command | Description |
|------|---------|-------------|
| Start dev mode | `pnpm dev` | Start this package only |
| Run tests | `pnpm test` | Test this package |
| Build package | `pnpm build` | Build this package |
| Lint package | `pnpm lint` | Lint this package |
| Type check | `pnpm typecheck` | Check TypeScript |

**Note**: Root commands use Lage to run tasks across all packages in dependency order, while package commands run only for that specific package.