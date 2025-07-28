# Architecture Decisions

This document captures the key architectural decisions made for the Claude Flow v2 monorepo and the rationale behind each choice.

## Package Manager: pnpm

**Decision**: Use pnpm instead of npm or yarn

**Rationale**:

- **Disk efficiency**: Uses hard links, saving gigabytes of disk space
- **Speed**: Faster installations due to efficient caching
- **Strictness**: Prevents phantom dependencies (using packages not in package.json)
- **Monorepo support**: Built-in workspace support with `pnpm-workspace.yaml`
- **Security**: Better dependency isolation between packages

**Trade-offs**:

- Requires global installation
- Less familiar to some developers
- Some tools have compatibility issues

## Build Orchestrator: Lage

**Decision**: Use Lage instead of Turborepo, Nx, or Rush

**Rationale**:

- **Simplicity**: Minimal configuration, just define task dependencies
- **Microsoft backing**: Created and maintained by Microsoft
- **Performance**: Efficient caching and parallel execution
- **Lightweight**: No heavy CLI or daemon processes
- **Integration**: Works seamlessly with existing npm scripts

**Configuration simplicity**:

```javascript
// Entire Lage config - that's it!
module.exports = {
  pipeline: {
    build: { dependsOn: ['^build'] },
    test: { dependsOn: ['build'] },
  },
};
```

**Trade-offs**:

- Fewer features than Nx (no affected detection, generators)
- Less ecosystem than Turborepo
- Documentation could be more extensive

## TypeScript Project References

**Decision**: Use TypeScript project references for inter-package dependencies

**Rationale**:

- **Build performance**: Incremental compilation only rebuilds changed packages
- **Type safety**: Ensures correct build order
- **IDE support**: Better "go to definition" across packages
- **Declaration maps**: Debugging original TS source from compiled code

**Trade-offs**:

- More complex tsconfig setup
- Requires `composite: true` in all packages
- Build output structure is more rigid

## Custom ESLint Plugin

**Decision**: Create a custom ESLint plugin for repo-specific rules

**Rationale**:

- **Enforce conventions**: Rules like `no-direct-api-calls` enforce architecture
- **Prevent mistakes**: `max-file-lines` keeps files manageable
- **Module boundaries**: Prevent improper cross-package imports
- **Custom to our needs**: Rules specific to our architecture patterns

**Trade-offs**:

- Maintenance burden
- Learning curve for new developers
- Need to document custom rules

## Task-Based CLI Design

**Decision**: Use explicit task files instead of CLI arguments

**Before**:

```bash
repo-scripts test --coverage --watch --reporter=verbose
```

**After**:

```bash
pnpm test:coverage
pnpm test:watch
```

**Rationale**:

- **Discoverability**: All commands visible in package.json
- **Type safety**: Each task can have its own types
- **Simplicity**: No complex argument parsing
- **Documentation**: Each file can be well-documented

**Trade-offs**:

- More files to maintain
- Less flexibility for one-off variations

## Scaffolding System

**Decision**: Build custom scaffolding instead of using Nx generators or Plop

**Rationale**:

- **Control**: Exactly what we need, nothing more
- **Templates**: EJS templates are simple and powerful
- **Integration**: Tightly integrated with our conventions
- **Evolution**: Can evolve with our needs

**Trade-offs**:

- Need to maintain our own system
- No ecosystem of community templates

## V1/V2 Coexistence Strategy

**Decision**: Run v1 and v2 side-by-side rather than big-bang migration

**Rationale**:

- **Risk mitigation**: Can roll back instantly
- **Gradual adoption**: Migrate features one at a time
- **User choice**: Users can opt-in when ready
- **Learning opportunity**: Learn from v2 usage before full migration

**Trade-offs**:

- Maintain two systems temporarily
- Additional complexity in routing
- Potential user confusion

## Package Architecture

**Decision**: Separate packages by concern, not by technical layer

**Structure**:

```
packages/
├── design-system/      # UI concern
├── data-bus/           # Real-time concern
├── claude-sdk/         # AI integration concern
└── types/              # Shared types concern
```

**Not**:

```
packages/
├── components/         # All UI components
├── utils/              # All utilities
├── types/              # All types
```

**Rationale**:

- **Cohesion**: Related code stays together
- **Independence**: Packages can evolve separately
- **Clarity**: Clear ownership and purpose
- **Versioning**: Can version features independently

## Testing Strategy

**Decision**: Vitest for unit tests, Playwright for E2E

**Rationale**:

- **Vitest**: Fast, Jest-compatible, great DX
- **Playwright**: Modern, reliable, great debugging
- **Separation**: Clear distinction between test types
- **Performance**: Both are notably fast

**Trade-offs**:

- Two test runners to learn
- Vitest is less mature than Jest
- Playwright requires more setup than Cypress

## Shared Configuration Strategy

**Decision**: Shared configs as packages, local overrides allowed

**Rationale**:

- **Consistency**: Base rules apply everywhere
- **Flexibility**: Packages can override when needed
- **Opt-in**: Packages choose which tools to use
- **Maintainability**: Update base rules in one place

## No CSS-in-JS

**Decision**: Use CSS Modules instead of styled-components or emotion

**Rationale**:

- **Performance**: No runtime overhead
- **Simplicity**: Just CSS, no new abstractions
- **Debugging**: Standard browser DevTools work
- **Bundle size**: Smaller bundles without CSS-in-JS runtime

**Trade-offs**:

- Less dynamic styling capability
- Need build-time CSS processing
- Type safety requires additional setup

## Repository Structure

**Decision**: Group by application version (v1/v2) at the top level

**Rationale**:

- **Clarity**: Immediately clear which version you're working on
- **Migration**: Easy to remove v1 when deprecated
- **Isolation**: V1 and v2 can have different tooling
- **Coexistence**: Natural structure for side-by-side operation

## Dependency Management

**Decision**: All tool dependencies in scripts package, not in individual packages

**Rationale**:

- **Consistency**: All packages use same tool versions
- **Maintenance**: Update tools in one place
- **Size**: Smaller individual packages
- **Clarity**: Package dependencies are only runtime needs

## Environment-Specific Builds

**Decision**: Explicit task files for different environments

**Files**:

- `build.ts` - Development build
- `build-prod.ts` - Production build

**Rationale**:

- **Clarity**: Obvious which build you're running
- **Type safety**: Each can have specific options
- **Simplicity**: No conditional logic based on NODE_ENV

## Future Considerations

As we evolve, we may reconsider:

1. **Module Federation**: For micro-frontend architecture if we scale teams
2. **Bun**: As a faster alternative to Node.js when stable
3. **Native ESM**: When tool support improves
4. **Nx**: If we need advanced features like affected testing
5. **Changesets**: For more sophisticated versioning needs

These decisions are not set in stone. As our needs change and tools evolve, we should revisit and update our choices.
