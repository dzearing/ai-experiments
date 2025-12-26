# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Flow is a modern project management platform with AI-powered features, organized as a monorepo using pnpm workspaces. The project consists of a V1 application (React + Express) with plans for gradual migration to V2 architecture.

## Common Commands

### Development

```bash
# Install dependencies (run from root)
pnpm install

# Start development (interactive menu)
pnpm dev

# Start V1 development directly
pnpm dev:v1
# This starts:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3001

# Build entire monorepo
pnpm build

# Build V1 client only
pnpm build:v1
```

### Testing

```bash
# Run all tests (orchestrated with Lage)
pnpm test

# Run V1 e2e tests
pnpm test:e2e

# Run V1 e2e tests with UI mode
pnpm test:e2e:ui

# Run a specific e2e test
cd apps/v1/client && pnpm playwright test <test-name>
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Lint with auto-fix
pnpm lint:fix

# TypeScript type checking
pnpm typecheck

# Run comprehensive check (build, test, lint)
pnpm check
```

### Utilities

```bash
# Create new package from template
pnpm scaffold

# Clean build artifacts
pnpm clean
```

## High-Level Architecture

### Monorepo Structure

```
/
├── apps/
│   ├── v1/
│   │   ├── client/         # React 19 + Vite frontend
│   │   └── server/         # Express v5 backend
│   └── v2/                 # Future V2 applications
├── packages/               # Shared packages
├── tools/
│   └── repo-scripts/      # CLI development tools
├── docs/                  # Architecture documentation
└── temp/                  # Logs, sessions, feedback
```

### Key Technologies

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router v7
- **Backend**: Express v5, Claude Code SDK, file-based storage
- **Testing**: Playwright (e2e), configured for headless Chromium
- **Build**: pnpm workspaces, Lage orchestration, TypeScript project references
- **Development**: Hot reload for frontend, manual restart required for server

### Context-Based State Management

The application uses a hierarchical context provider structure:

```
AppProvider → ThemeProvider → ToastProvider → AuthProvider →
GitHubProvider → WorkspaceProvider → LayoutProvider → SubscriptionProvider
```

Key contexts:

- **AppContext**: Core state (projects, work items, personas)
- **WorkspaceContext**: Workspace management with caching
- **ClaudeCodeContext**: Claude API session management
- **SubscriptionContext**: Real-time updates via EventSource/WebSocket

### Workspace-Driven Architecture

The application requires workspace selection before functionality is available. Workspaces sync with the backend file system, and projects/work items are discovered from markdown files.

### Component Organization

- `/components/ui/`: Reusable UI primitives
- `/components/chat/`: Chat functionality
- `/components/claude-code/`: Claude Code integration
- `/components/dialogs/`: Dialog components (no native browser dialogs)

### Data Flow Patterns

- Client-side caching with `getCached` utility
- Progressive loading (light data first)
- Optimistic UI updates
- Real-time sync via subscriptions
- File system as database on server

### Server Architecture

- Express middleware stack
- In-memory caching with TTL
- Session persistence in `/temp/sessions/`
- Claude API integration service
- Feedback system with screenshot capture

## Important Development Notes

### Server Restart Required

**CRITICAL**: When modifying ANY Node.js server files (e.g., `/apps/*/server/`), you MUST restart the server yourself. Node servers do not auto-restart like client dev servers with hot reload.

**You are responsible for restarting the server** - do not ask the user to restart. Use the appropriate command to restart the server process after making server-side changes:
- Kill any existing server process if needed
- Start the server again with the appropriate dev command
- Verify the server is running before continuing

### Dialog Patterns

- **NEVER** use `alert()`, `confirm()`, or `prompt()`
- Always use React dialog components (e.g., `ConfirmDialog`)
- Maintain consistent dialog UI/UX patterns

### File Operations

- Use absolute paths in all file operations
- Workspace data stored in file system
- Feedback stored in `/temp/feedback/`
- Sessions stored in `/temp/sessions/`

### Testing Practices

- E2E tests use Playwright with headless Chromium
- Tests are in `/apps/v1/client/e2e/`
- Mock data supported for consistent testing
- Video/screenshot capture on failure

### Code Style

- TypeScript for type safety (avoid `any`)
- No CSS-in-JS (use CSS modules or Tailwind)
- Functional components with hooks
- Type imports: `import type { Foo }` or `import { type Foo, Bar }`

### File Organization

- **1 export per file** - Each file exports a single function/component plus its related types
- **Tests colocated with source** - Test files live next to source files (e.g., `Button.tsx` and `Button.test.tsx`)
- **No utility barrel files** - Avoid `utils.ts` or similar catch-all files; split into individual files
- **500 line limit** - Source files should be 500 lines or less; break up larger files into smaller utilities

### Git Workflow

- Feature branches: `feature/`, `fix/`, `chore/`
- No AI attribution in commits or code
- Run tests and lint before committing

## Architecture Principles

1. **Context Providers** over prop drilling
2. **Lazy Loading** for performance
3. **File System as Database** for workspace data
4. **Real-time First** design
5. **Progressive Enhancement** for UX
6. **Type Safety** throughout

## Feedback Processing

When processing feedback:

1. Check `/temp/feedback/reports/` for feedback files
2. Analyze with corresponding screenshots
3. Fix root causes, not symptoms
4. Add tests to prevent regression
5. Document in `/temp/feedback/addressed/`
6. Compact context between files

## Migration Strategy

The project follows a phased migration from V1 to V2:

- Phase 0-1: ✅ Repository restructure complete
- Phase 2: 🚧 Core package development
- Phase 3-5: Future V2 development and migration

See `/docs/guides/migration/migration-v1-to-v2.md` for details.

## Development Validation Practices

- **UI Change Validation**: 
  - Any time you make UI changes, validate you actually fixed the issue by running the playwright mcp server and screenshotting your work and validating the results are true. 
  - If the results are not accurate, fix the issues before reporting them as fixed.

## Design Token Usage

The project uses a surface-based design token system. 

**Quick References:**
- `/docs/guides/TOKEN_CHEATSHEET.md` - Quick reference for common tokens
- `/docs/guides/COMPONENT_TOKEN_MAPPING.md` - Which tokens to use for each component
- `/docs/guides/ICONS_CHEATSHEET.md` - All available icons from `@claude-flow/ui-kit-icons`
- `/packages/ui-kit/README.md` - Complete token system documentation

### Common Token Examples

```css
/* Text Colors - ALWAYS use these instead of hardcoded colors */
--color-body-text                /* Primary text */
--color-body-textSoft10          /* Secondary text (10% less contrast) */
--color-body-textSoft20          /* Tertiary text (20% less contrast) */
--color-body-link                /* Links */

/* Backgrounds */
--color-body-background          /* Main background */
--color-panel-background         /* Card/panel background */
--color-buttonPrimary-background /* Primary button */

/* Spacing - Based on 4px grid */
--spacing-small10                /* 8px */
--spacing                        /* 16px - DEFAULT */
--spacing-large10                /* 24px */
--spacing-buttonX                /* Button horizontal padding */
--spacing-card                   /* Card padding */

/* Typography */
--font-size                      /* 14px - body text */
--font-size-h3                   /* 24px - headings */
--font-weight-medium             /* 500 */
--line-height-normal             /* 1.5 */

/* Other Common Tokens */
--radius-button                  /* Button border radius */
--shadow-card                    /* Card shadow */
--duration-normal                /* 200ms - animations */
```

### Important Token Guidelines

1. **NEVER use hardcoded colors** - Always use design tokens
2. **Use surface-based colors** - They ensure accessibility automatically
3. **Follow the 4px spacing grid** - Use spacing tokens for all margins/padding
4. **Check the Token Browser** - Run Storybook to see all available tokens
5. **Soft = less contrast, Hard = more contrast** - e.g., `textSoft10` is lighter than `text`

### Example Usage

```css
/* ❌ WRONG - Never use hardcoded values */
.button {
  background: #1976d2;
  color: white;
  padding: 8px 16px;
}

/* ✅ CORRECT - Use design tokens */
.button {
  background: var(--color-buttonPrimary-background);
  color: var(--color-buttonPrimary-text);
  padding: var(--spacing-buttonY) var(--spacing-buttonX);
}
```