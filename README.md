# Claude Flow Monorepo

A modern project management platform with AI-powered features, built as a monorepo to support gradual migration from v1 to v2 architecture.

## Overview

This monorepo contains:
- **V1 Application** - Current production application (React + Express)
- **V2 Packages** - Next-generation shared packages (coming soon)
- **Development Tools** - CLI tools and shared configurations

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development (interactive menu)
pnpm dev

# Run specific commands
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm lint         # Lint all packages
```

## Repository Structure

```
/
├── apps/
│   ├── v1/                 # Current production application
│   │   ├── client/         # React frontend
│   │   └── server/         # Express backend
│   └── v2/                 # Future v2 applications
├── packages/               # Shared packages
│   ├── tsconfig/          # Shared TypeScript configurations
│   └── eslint-config/     # Shared ESLint configurations
├── tools/
│   └── repo-scripts/      # CLI development tools
├── docs/                  # Documentation
│   ├── getting-started.md # Developer onboarding
│   └── guides/            # Development guides
└── temp/                  # Temporary files (logs, sessions)
```

## Development

### Prerequisites

- Node.js 18+
- pnpm 9.0.0+ (will be auto-installed via corepack)

### Running V1 Application

```bash
# Interactive menu
pnpm dev
# Select "V1 Application (port 3000)"

# Or directly
pnpm dev:v1
```

This starts:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Interactive development menu |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm scaffold` | Create new package from template |

### V1-Specific Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:v1` | Start v1 development servers |
| `pnpm build:v1` | Build v1 for production |
| `pnpm lint:v1` | Lint v1 code |
| `pnpm test:e2e` | Run v1 e2e tests |

## Architecture

This monorepo uses:
- **pnpm** - Fast, efficient package manager with workspace support
- **Lage** - Build orchestration for monorepos
- **TypeScript** - With project references for fast builds
- **Shared Configurations** - Consistent TypeScript and ESLint settings

## Migration Strategy

We're following a gradual migration approach from v1 to v2:

1. **Phase 0** ✅ - Repository restructure (complete)
2. **Phase 1** ✅ - Infrastructure setup (complete)
3. **Phase 2** 🚧 - Core package development
4. **Phase 3** - V2 application development
5. **Phase 4** - Routing & integration
6. **Phase 5** - Gradual user migration

See [migration guide](docs/guides/migration/migration-v1-to-v2.md) for details.

## Documentation

- [Getting Started](docs/getting-started.md) - New developer onboarding
- [Development Workflow](docs/guides/development/development-workflow.md) - Daily development practices
- [Architecture Decisions](docs/guides/architecture/architecture-decisions.md) - Key design choices
- [V1 Application](apps/v1/README.md) - V1-specific documentation

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `pnpm lint` and `pnpm test`
4. Submit a pull request

## License

[License information here]