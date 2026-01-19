# Codebase Structure

**Analysis Date:** 2025-01-19

## Directory Layout

```
/
├── apps/
│   └── ideate/
│       ├── client/              # React SPA frontend
│       │   ├── src/
│       │   │   ├── components/  # Feature components
│       │   │   ├── contexts/    # React context providers
│       │   │   ├── hooks/       # Custom React hooks
│       │   │   ├── pages/       # Route-level pages
│       │   │   ├── dataBus/     # Real-time data subscriptions
│       │   │   ├── utils/       # Utility functions
│       │   │   ├── types/       # TypeScript definitions
│       │   │   ├── styles/      # Global styles
│       │   │   ├── constants/   # App constants
│       │   │   ├── App.tsx      # Root component with routes
│       │   │   ├── main.tsx     # Entry point
│       │   │   └── config.ts    # API endpoints config
│       │   ├── e2e/             # Playwright E2E tests
│       │   └── public/          # Static assets
│       ├── server/              # Express + WebSocket backend
│       │   └── src/
│       │       ├── routes/      # REST API routes
│       │       ├── services/    # Business logic
│       │       ├── websocket/   # WebSocket handlers
│       │       ├── prompts/     # AI agent prompts
│       │       ├── shared/      # Agent utilities
│       │       ├── types/       # TypeScript definitions
│       │       └── index.ts     # Server entry point
│       └── docs/                # App-specific docs
├── packages/
│   └── ui-kit/
│       ├── core/                # Design tokens & themes
│       │   └── src/
│       │       ├── tokens/      # Spacing, typography, etc.
│       │       ├── themes/      # Theme definitions
│       │       ├── surfaces/    # Surface system
│       │       ├── colors/      # Color utilities
│       │       ├── runtime/     # Runtime bootstrap
│       │       └── vite/        # Vite plugin
│       ├── react/               # React component library
│       │   └── src/
│       │       ├── components/  # 60+ UI components
│       │       ├── context/     # ThemeProvider
│       │       └── hooks/       # useFocusTrap, etc.
│       ├── react-chat/          # Chat components
│       │   └── src/
│       │       ├── components/  # ChatInput, ChatMessage, etc.
│       │       ├── context/     # ChatContext
│       │       └── hooks/       # Chat hooks
│       ├── react-markdown/      # Markdown components
│       │   └── src/
│       │       ├── components/  # MarkdownRenderer, MarkdownEditor
│       │       ├── hooks/       # useStreamingMarkdown, useDeepLink
│       │       └── utils/       # Syntax highlighter, deep links
│       ├── router/              # Client-side router
│       │   └── src/             # Router, Route, hooks
│       ├── icons/               # SVG icon library
│       │   └── src/
│       │       ├── svgs/        # 200+ SVG files
│       │       └── utils/       # Icon utilities
│       ├── react-pickers/       # File/folder pickers
│       │   └── src/
│       │       ├── components/  # ItemPicker, ItemPickerDialog
│       │       └── providers/   # MockItemProvider, DiskItemProvider
│       ├── icons-stories/       # Storybook for icons
│       ├── mock-pages/          # Mock page templates
│       └── website/             # Documentation website
└── .planning/
    └── codebase/                # Architecture docs (this file)
```

## Directory Purposes

### `/apps/ideate/client/src/components/`

- Purpose: Feature-specific React components grouped by domain
- Contains: Component folders with `.tsx`, `.module.css`, and barrel `index.ts`
- Key files:
  - `Topics/` - Topic tree, detail, ideas, documents
  - `IdeaDialog/` - Idea creation/editing dialog
  - `FacilitatorOverlay/` - Global AI assistant overlay
  - `KanbanBoard/` - Idea status kanban view
  - `AppLayout/` - Main app shell layout

### `/apps/ideate/client/src/contexts/`

- Purpose: React context providers for global state
- Contains: `*Context.tsx` files with Provider and hook
- Key files:
  - `WorkspaceContext.tsx` - Workspace CRUD and selection
  - `IdeasContext.tsx` - Ideas list and mutations
  - `TopicsContext.tsx` - Topics tree management
  - `FacilitatorContext.tsx` - AI facilitator state
  - `AuthContext.tsx` - User authentication state

### `/apps/ideate/client/src/hooks/`

- Purpose: Custom React hooks for WebSocket and business logic
- Contains: `use*.ts` hook files
- Key files:
  - `useIdeaAgent.ts` - Idea AI assistant WebSocket
  - `usePlanAgent.ts` - Planning AI assistant WebSocket
  - `useExecutionAgent.ts` - Execution AI assistant WebSocket
  - `useWorkspaceSocket.ts` - Workspace updates WebSocket
  - `useYjsCollaboration.ts` - Yjs document collaboration

### `/apps/ideate/client/src/pages/`

- Purpose: Route-level page components
- Contains: `*.tsx` page files with paired `*.module.css`
- Key files:
  - `Dashboard.tsx` - Documents view
  - `Topics.tsx` - Topics tree view
  - `Ideas.tsx` - Ideas kanban view
  - `WorkspaceDetail.tsx` - Workspace settings
  - `Settings.tsx` - User settings

### `/apps/ideate/server/src/services/`

- Purpose: Business logic and data access layer
- Contains: Service classes and utilities
- Key files:
  - `WorkspaceService.ts` - Workspace CRUD with file storage
  - `IdeaService.ts` - Idea CRUD operations
  - `IdeaAgentService.ts` - AI idea assistant logic
  - `PlanAgentService.ts` - AI planning assistant
  - `ExecutionAgentService.ts` - AI execution assistant
  - `DocumentService.ts` - Document CRUD
  - `TopicService.ts` - Topic tree operations

### `/apps/ideate/server/src/websocket/`

- Purpose: WebSocket connection handlers
- Contains: `*WebSocketHandler.ts` handler classes
- Key files:
  - `YjsCollaborationHandler.ts` - Yjs document sync
  - `WorkspaceWebSocketHandler.ts` - Resource update broadcasts
  - `IdeaAgentWebSocketHandler.ts` - Idea AI chat
  - `ChatWebSocketHandler.ts` - Human chat rooms

### `/packages/ui-kit/react/src/components/`

- Purpose: Reusable UI component library
- Contains: Component folders with implementation, styles, stories, tests
- Key files:
  - `Button/` - Button component with variants
  - `Modal/` - Dialog/modal overlay
  - `Toast/` - Toast notification system
  - `Tabs/` - Tab navigation component
  - `Table/` - Data table component

### `/packages/ui-kit/core/src/themes/`

- Purpose: Theme definitions and generator
- Contains: Theme JSON files and generator utilities
- Key files:
  - `definitions/` - Theme JSON files (default.json, midnight.json, etc.)
  - `generator.ts` - CSS generation from theme definitions
  - `types.ts` - Theme type definitions

## Key File Locations

**Entry Points:**
- `/apps/ideate/client/src/main.tsx` - Client React entry
- `/apps/ideate/server/src/index.ts` - Server Express entry
- `/packages/ui-kit/*/src/index.ts` - Package public APIs

**Configuration:**
- `/apps/ideate/client/vite.config.ts` - Vite build config
- `/apps/ideate/client/playwright.config.ts` - E2E test config
- `/apps/ideate/server/tsconfig.json` - TypeScript config

**Core Logic:**
- `/apps/ideate/client/src/App.tsx` - Route definitions
- `/apps/ideate/server/src/services/*.ts` - Business services

**Testing:**
- `/apps/ideate/client/e2e/*.spec.ts` - E2E tests
- `/apps/ideate/client/src/**/*.test.ts` - Unit tests (colocated)
- `/packages/ui-kit/*/src/**/*.test.ts` - Package unit tests

## Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `TopicDetail.tsx`)
- Styles: `PascalCase.module.css` (e.g., `TopicDetail.module.css`)
- Hooks: `useCamelCase.ts` (e.g., `useIdeaAgent.ts`)
- Contexts: `PascalCaseContext.tsx` (e.g., `WorkspaceContext.tsx`)
- Services: `PascalCaseService.ts` (e.g., `IdeaService.ts`)
- Routes: `camelCase.ts` (e.g., `workspaces.ts`)
- Tests: `*.test.ts` or `*.spec.ts` colocated with source

**Directories:**
- Components: `PascalCase/` (e.g., `Topics/`, `Button/`)
- Feature groups: `camelCase/` (e.g., `resourceEventBus/`)
- Utilities: `camelCase/` (e.g., `utils/`)

**Exports:**
- Named exports preferred
- Barrel files (`index.ts`) for component folders
- One primary export per file plus related types

## Where to Add New Code

**New Page:**
1. Create page component: `/apps/ideate/client/src/pages/NewPage.tsx`
2. Create styles: `/apps/ideate/client/src/pages/NewPage.module.css`
3. Add route in `/apps/ideate/client/src/App.tsx`

**New Feature Component:**
1. Create folder: `/apps/ideate/client/src/components/FeatureName/`
2. Add component: `FeatureName.tsx`
3. Add styles: `FeatureName.module.css`
4. Add barrel: `index.ts`

**New API Endpoint:**
1. Create or extend route: `/apps/ideate/server/src/routes/resource.ts`
2. Add service method: `/apps/ideate/server/src/services/ResourceService.ts`
3. Mount route in `/apps/ideate/server/src/index.ts`

**New WebSocket Handler:**
1. Create handler: `/apps/ideate/server/src/websocket/NewHandler.ts`
2. Create WebSocket server in `/apps/ideate/server/src/index.ts`
3. Add upgrade path routing

**New UI Kit Component:**
1. Create folder: `/packages/ui-kit/react/src/components/ComponentName/`
2. Add implementation: `ComponentName.tsx`
3. Add styles: `ComponentName.module.css`
4. Add stories: `ComponentName.stories.tsx`
5. Add tests: `ComponentName.test.tsx`
6. Add barrel: `index.ts`
7. Export from `/packages/ui-kit/react/src/index.ts`

**New Context Provider:**
1. Create context: `/apps/ideate/client/src/contexts/NewContext.tsx`
2. Add provider in `/apps/ideate/client/src/App.tsx`

**New Hook:**
1. Create hook: `/apps/ideate/client/src/hooks/useNewHook.ts`
2. Export from `/apps/ideate/client/src/hooks/index.ts`

**New Theme:**
1. Create JSON: `/packages/ui-kit/core/src/themes/definitions/newtheme.json`
2. Theme will be auto-discovered by build

## Special Directories

**`/apps/ideate/server/data/`:**
- Purpose: Runtime data storage
- Generated: Yes, at runtime
- Committed: No (gitignored)

**`/packages/ui-kit/core/dist/`:**
- Purpose: Built CSS and theme files
- Generated: Yes, by build
- Committed: No (gitignored)

**`/packages/ui-kit/icons/src/svgs/`:**
- Purpose: Raw SVG icon source files
- Generated: No (source of truth)
- Committed: Yes

**`/.planning/codebase/`:**
- Purpose: Architecture documentation
- Generated: Yes, by GSD mapping
- Committed: Yes

**`/temp/`:**
- Purpose: Sessions, logs, feedback
- Generated: Yes, at runtime
- Committed: No (gitignored)

---

*Structure analysis: 2025-01-19*
