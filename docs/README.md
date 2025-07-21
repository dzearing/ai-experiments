# Claude Flow Documentation

Welcome to the Claude Flow documentation! This guide will help you navigate our documentation structure and find the information you need quickly.

## Quick start

New to Claude Flow? Start here:

- [Getting started guide](./getting-started.md) - Complete onboarding guide for new developers

## Documentation structure

### 📚 Guides

Comprehensive guides organized by topic:

#### Development guides (`guides/development/`)

- [Development workflow](guides/development/development-workflow.md) - Daily development practices and common patterns
- [Coding conventions](guides/development/coding-conventions.md) - Code style, TypeScript patterns, and security guidelines
- [Build tooling](guides/development/build-tooling.md) - Build system configuration and tooling reference

#### Architecture guides (`guides/architecture/`)

- [Architecture decisions](guides/architecture/architecture-decisions.md) - Key architectural choices and rationale (ADRs)
- [Monorepo structure](guides/architecture/monorepo-structure.md) - Repository organization and package conventions
- [Client architecture](guides/architecture/client-architecture.md) - Frontend architecture specifications
- [Design system architecture](guides/architecture/design-system-architecture.md) - Design system implementation details

#### Migration guides (`guides/migration/`)

- [V1 to V2 migration](guides/migration/migration-v1-to-v2.md) - Complete migration strategy with phases
- [Implementation guide](guides/migration/implementation-guide.md) - Practical steps for architectural changes
- [Server TypeScript migration](guides/migration/server-typescript-migration.md) - Backend migration to TypeScript

### 📋 Plans

Design documents and implementation plans:

#### Architecture plans (`plans/architecture/`)

Plans for major architectural changes and system design.

#### Feature plans (`plans/features/`)

Detailed specifications for new features.

#### Mockups (`plans/mockups/`)

UI/UX mockups and design assets:

- `design-system/` - Component design specifications
- `flows/` - User flow mockups organized by feature area

### 📖 Reference

Technical references and examples:

- [Repo scripts specification](reference/repo-scripts-specification.md) - CLI tools and commands
- [Adding project templates](reference/adding-project-templates.md) - Creating new scaffolding templates
- `examples/` - Code examples for common patterns

## Navigation tips

1. **New developers**: Start with the [getting started guide](./getting-started.md), then review [coding conventions](guides/development/coding-conventions.md)

2. **Feature development**: Check [development workflow](guides/development/development-workflow.md) and relevant mockups in `plans/mockups/`

3. **Architecture work**: Review [architecture decisions](guides/architecture/architecture-decisions.md) and check `plans/architecture/` for upcoming changes

4. **Migration tasks**: Follow the guides in `guides/migration/` for specific migration phases

## Contributing to docs

When adding new documentation:

- Place onboarding content in the root `docs/` folder
- Add development practices to `guides/development/`
- Document architectural decisions in `guides/architecture/`
- Put implementation plans in `plans/`
- Store code examples and references in `reference/`

## Finding help

Can't find what you're looking for?

- Check the [development workflow guide](guides/development/development-workflow.md) for common tasks
- Review [architecture decisions](guides/architecture/architecture-decisions.md) for design rationale
- Look in `plans/` for upcoming features and changes
