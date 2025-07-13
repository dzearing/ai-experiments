# Monorepo Structure

This document defines the directory structure and organization of the Claude Flow monorepo.

## Repository Layout

```
claude-flow/                          # Repository root
├── .github/                          # GitHub configuration
│   ├── workflows/                    # CI/CD workflows
│   └── renovate.json                # Dependency updates
│
├── apps/                            # All applications
│   ├── v1/                          # Current v1 applications
│   │   ├── web/                     # V1 React app (existing)
│   │   └── server/                  # V1 Express server (existing)
│   │
│   ├── v2/                          # New v2 applications
│   │   ├── web/                     # V2 web application
│   │   └── server/                  # V2 backend server
│   │
│   └── e2e/                         # End-to-end tests (covers both versions)
│       ├── tests/
│       │   ├── v1/
│       │   └── v2/
│       └── playwright.config.ts
│
├── packages/                        # Shared packages (v2 architecture)
│   ├── design-system/               # UI components and tokens
│   ├── data-bus/                    # WebSocket management
│   ├── types/                       # Shared TypeScript types
│   ├── claude-sdk/                  # Claude API wrapper
│   └── websocket-client/            # WebSocket client library
│
├── tools/                           # Development tools
│   ├── eslint-plugin/               # Custom ESLint rules
│   │   ├── src/
│   │   │   ├── rules/
│   │   │   │   ├── noDirectApiCalls.ts
│   │   │   │   ├── useDataBus.ts
│   │   │   │   ├── maxFileLines.ts
│   │   │   │   └── enforceModuleBoundaries.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── repo-scripts/                # Build and utility scripts with CLI
│       ├── src/
│       │   ├── tasks/               # Explicit task files (no arguments)
│       │   │   ├── scaffold.ts      # Package scaffolding (takes args)
│       │   │   ├── build.ts         # Standard build
│       │   │   ├── build-prod.ts    # Production build
│       │   │   ├── test.ts          # Run tests
│       │   │   ├── test-coverage.ts # Tests with coverage
│       │   │   ├── test-watch.ts    # Tests in watch mode
│       │   │   ├── lint.ts          # Check linting
│       │   │   ├── lint-fix.ts      # Fix linting issues
│       │   │   ├── typecheck.ts     # Type checking
│       │   │   ├── clean.ts         # Clean build artifacts
│       │   │   ├── dev.ts           # Development server
│       │   │   └── release.ts       # Release process
│       │   ├── templates/           # Scaffolding templates
│       │   │   ├── web-app/
│       │   │   ├── node-service/
│       │   │   ├── component-library/
│       │   │   ├── node-library/
│       │   │   └── eslint-rule/
│       │   └── utils/
│       ├── bin/
│       │   └── repoScripts.js      # CLI entry point
│       └── package.json
│
├── configs/                         # Shared configuration packages
│   ├── tsconfig/                    # Shared TypeScript configs
│   │   ├── base.json
│   │   ├── react.json
│   │   ├── node.json
│   │   └── package.json
│   │
│   └── eslint-config/               # Shared ESLint configs
│       ├── base.js
│       ├── react.js
│       ├── node.js
│       └── package.json
│
├── shared/                          # Shared between v1 and v2
│   ├── data/                        # Shared data storage
│   ├── sessions/                    # Session files
│   └── config/                      # Shared configuration
│
├── nginx/                           # Routing configuration
│   └── nginx.conf                   # Routes v1/v2 traffic
│
├── scripts/                         # Root-level scripts
│   ├── start-v1.sh                  # Start v1 application
│   ├── start-v2.sh                  # Start v2 application
│   ├── start-all.sh                 # Start both versions
│   └── migrate-data.js              # Data migration utilities
│
├── docs/                            # Documentation
│   ├── architecture/
│   ├── api/
│   └── migration/                   # V1 to V2 migration guides
│
├── pnpm-workspace.yaml              # pnpm workspace config (v2 only)
├── lage.config.js                   # Lage build orchestration
├── package.json                     # Root package.json
├── tsconfig.json                    # Root TypeScript config
└── README.md
```

## Workspace Configuration

### pnpm Workspace

The `pnpm-workspace.yaml` defines which directories are part of the v2 monorepo:

```yaml
packages:
  # V2 applications
  - 'apps/v2/*'
  - 'apps/e2e'
  # Shared packages and tools
  - 'packages/*'
  - 'tools/*'
  - 'configs/*'
  # Exclude v1 apps (they use npm)
  - '!apps/v1/**'
```

### Package Naming Convention

- **Apps**: Simple names (`web`, `server`)
- **Packages**: Scoped names (`@claude-flow/design-system`)
- **Tools**: Scoped names (`@claude-flow/eslint-plugin`)
- **Configs**: Scoped names (`@claude-flow/tsconfig`, `@claude-flow/eslint-config`)

## Directory Purposes

### `/apps`
Contains all runnable applications:
- `v1/` - Legacy applications using npm
- `v2/` - New applications using pnpm and modern tooling
- `e2e/` - End-to-end tests covering both versions

### `/packages`
Shared code used by v2 applications:
- Each package is independently versioned
- Packages can depend on other packages
- All packages use TypeScript

### `/tools`
Development-time tools:
- Custom ESLint rules and plugins
- Build and scaffolding scripts
- Development utilities
- Not included in production builds

### `/configs`
Shared configuration packages:
- TypeScript configurations (base, react, node)
- ESLint configurations (base, react, node)
- Prettier configurations (if needed)
- Jest/Vitest configurations (if needed)

### `/shared`
Resources accessed by both v1 and v2:
- Data files and databases
- User sessions
- Runtime configuration

### `/scripts`
Root-level utility scripts:
- Shell scripts for starting applications
- Migration utilities
- Deployment helpers

### `/docs`
Project documentation:
- Architecture decisions
- API documentation
- Migration guides

## Package Structure

Each package follows a consistent structure:

```
package-name/
├── src/                    # Source code (TypeScript)
│   ├── index.ts           # Main entry point
│   └── ...
├── lib/                   # ESM JavaScript output (gitignored)
├── lib-commonjs/          # CommonJS output if needed (gitignored)
├── dist/                  # Bundled/minified output (gitignored)
├── package.json           # Package manifest
├── tsconfig.json          # TypeScript config (optional)
├── .eslintrc.js           # ESLint config (optional)
├── vitest.config.ts       # Test config (optional)
└── README.md              # Package documentation
```

### Build Output Conventions

- **`lib/`** - ESM JavaScript output from TypeScript compilation
  - Used for Node.js libraries and packages
  - Not bundled or minified
  - Preserves module structure
  
- **`lib-commonjs/`** - CommonJS output (only when required)
  - Avoid unless absolutely necessary
  - Only for packages that must support legacy CommonJS consumers
  
- **`dist/`** - Production-ready bundled output
  - Used for applications and browser libraries
  - Bundled, minified, and optimized
  - May include source maps

**Note**: All Node.js packages should use ESM by default. Only emit CommonJS when there's a specific compatibility requirement.

## Key Files

### Root Configuration Files

- `pnpm-workspace.yaml` - Defines monorepo workspace
- `lage.config.js` - Build orchestration configuration
- `package.json` - Root scripts and dependencies
- `tsconfig.json` - Root TypeScript configuration

### Package Files

- `package.json` - Defines dependencies, scripts, and metadata
- `tsconfig.json` - TypeScript configuration (extends base)
- `.eslintrc.js` - Linting rules (extends base)

## Related Documentation

- [Getting Started](./getting-started.md) - New developer onboarding
- [Development Workflow](./development-workflow.md) - Daily development practices
- [Build Tooling](./build-tooling.md) - Technical build configuration
- [Architecture Decisions](./architecture-decisions.md) - Why we chose this structure
- [Migration Strategy](./migration-v1-to-v2.md) - V1 to V2 migration plan
- [Adding Project Templates](./adding-project-templates.md) - How to create new scaffolding templates