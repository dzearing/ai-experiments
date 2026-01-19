# Architecture

**Analysis Date:** 2025-01-19

## Pattern Overview

**Overall:** Monorepo with shared UI component library, client-server SPA architecture with WebSocket-based real-time communication

**Key Characteristics:**
- React SPA client with Express server backend
- Multiple WebSocket channels for real-time features (Yjs collaboration, agent chat, workspace sync)
- Context-based state management on client
- File-based data persistence on server
- Shared UI component library (`@ui-kit/*`) consumed by Ideate app

## Layers

### UI Kit Core (`packages/ui-kit/core`)

- Purpose: Framework-agnostic design tokens, themes, and surface system
- Location: `/packages/ui-kit/core/src/`
- Contains: Token definitions (spacing, typography, radii, shadows, animation), theme generator, surface system
- Depends on: Nothing (foundational layer)
- Used by: All UI kit packages, consuming applications

**Key Exports:**
- `staticTokens` - All non-color tokens
- `tonalSurfaces`, `feedbackSurfaces` - Surface type definitions
- Theme generator and storage utilities

### UI Kit React (`packages/ui-kit/react`)

- Purpose: Reusable React component library with 60+ components
- Location: `/packages/ui-kit/react/src/`
- Contains: UI primitives (Button, Input, Modal), layout (Stack, Grid, Panel), feedback (Toast, Progress)
- Depends on: `@ui-kit/core`
- Used by: Ideate client, other React apps

**Component Categories:**
- Actions: `Button`, `IconButton`, `CopyButton`
- Inputs: `Input`, `Textarea`, `Checkbox`, `Radio`, `Switch`, `Select`, `Slider`
- Layout: `Card`, `Panel`, `Stack`, `Grid`, `Form`, `SplitPane`
- Overlays: `Modal`, `Dialog`, `Drawer`, `Tooltip`, `Popover`
- Navigation: `Tabs`, `Breadcrumb`, `Pagination`
- Feedback: `Alert`, `Toast`, `Banner`, `Progress`, `Spinner`, `Skeleton`
- Animation: `Collapse`, `Fade`, `Slide`, `Scale`, `AnimatePresence`

### UI Kit Specialized Packages

**react-chat** (`packages/ui-kit/react-chat/src/`)
- Purpose: Chat UI components with rich editor
- Contains: `ChatLayout`, `ChatMessage`, `ChatInput` (TipTap-based), `ThinkingIndicator`
- Depends on: `@ui-kit/react`, `@ui-kit/core`, TipTap

**react-markdown** (`packages/ui-kit/react-markdown/src/`)
- Purpose: Markdown rendering and collaborative editing
- Contains: `MarkdownRenderer`, `MarkdownEditor`, `MarkdownCoEditor` (Yjs-enabled)
- Depends on: `@ui-kit/react`, react-markdown, Prism.js

**router** (`packages/ui-kit/router/src/`)
- Purpose: Lightweight client-side router
- Contains: `Router`, `Route`, `Routes`, `Link`, navigation hooks
- Depends on: React

**icons** (`packages/ui-kit/icons/src/`)
- Purpose: SVG icon library
- Contains: 200+ SVG icons as React components
- Depends on: React

**react-pickers** (`packages/ui-kit/react-pickers/src/`)
- Purpose: File/folder picker components
- Contains: `ItemPicker`, `FolderPicker`, `ItemPickerDialog`
- Depends on: `@ui-kit/react`

### Ideate Client (`apps/ideate/client`)

- Purpose: React SPA for idea management and AI-assisted ideation
- Location: `/apps/ideate/client/src/`
- Contains: Pages, components, contexts, hooks for the Ideate application
- Depends on: All `@ui-kit/*` packages
- Used by: End users via browser

**Structure:**
```
src/
├── pages/           # Route-level components
├── components/      # Feature-specific components
├── contexts/        # React context providers
├── hooks/           # Custom hooks (WebSocket, agents)
├── dataBus/         # Real-time data subscription system
└── utils/           # Utility functions
```

### Ideate Server (`apps/ideate/server`)

- Purpose: Express backend with WebSocket handlers and AI agent services
- Location: `/apps/ideate/server/src/`
- Contains: REST routes, WebSocket handlers, AI agent services, file-based storage
- Depends on: Express, ws, Claude Agent SDK
- Used by: Ideate client

**Structure:**
```
src/
├── routes/          # Express route handlers
├── services/        # Business logic services
├── websocket/       # WebSocket handlers
├── prompts/         # AI agent system prompts
├── shared/          # Shared utilities for agents
└── types/           # TypeScript type definitions
```

## Data Flow

### REST API Flow

1. Client makes HTTP request to `/api/*` endpoint
2. Express middleware handles auth (x-user-id header)
3. Route handler calls appropriate service
4. Service reads/writes to file system (`~/Ideate/workspaces/`)
5. Response returned to client

### WebSocket Real-Time Flow

1. Client establishes WebSocket connection to specific endpoint
2. Server handler creates client session and registers callbacks
3. Bidirectional JSON messages for commands and updates
4. ResourceEventBus broadcasts changes to subscribed clients

**WebSocket Endpoints:**
- `/yjs/*` - Yjs document collaboration (binary protocol)
- `/workspace-ws` - Workspace CRUD notifications
- `/idea-agent-ws` - AI idea assistant chat
- `/plan-agent-ws` - AI planning assistant
- `/execution-agent-ws` - AI execution assistant
- `/facilitator-ws` - AI facilitator assistant
- `/chat-ws/*` - Human-to-human chat rooms

### AI Agent Flow

1. Client sends message via WebSocket
2. WebSocket handler delegates to agent service
3. Agent service builds system prompt with context
4. Claude Agent SDK streams response
5. Text chunks streamed back via WebSocket
6. Tool calls executed (Yjs document edits, etc.)
7. Metadata updates broadcast via ResourceEventBus

**State Management:**
- Client: React Context providers (hierarchical)
- Server: In-memory session maps + file-based persistence
- Real-time: WebSocket + Yjs CRDTs for collaboration

## Key Abstractions

### Surface System

- Purpose: Tonal color system for accessible, themeable UIs
- Examples: `base`, `raised`, `sunken`, `soft`, `strong`, `primary`, `danger`
- Pattern: CSS custom properties set by surface class, consumed by components

### Agent Services

- Purpose: AI chat sessions with tool execution
- Examples: `IdeaAgentService`, `PlanAgentService`, `ExecutionAgentService`
- Pattern: Session-based state, streaming responses, tool callbacks

### Context Providers (Client)

- Purpose: Global state management and data fetching
- Examples: `WorkspaceContext`, `IdeasContext`, `TopicsContext`, `FacilitatorContext`
- Pattern: Provider wraps app, hook exposes state and actions

### Data Bus (Client)

- Purpose: Real-time resource subscription system
- Examples: `WorkspaceDataProvider`, `ideaPath`, `topicIdeasPath`
- Pattern: Schema-validated resources, automatic re-fetch on updates

## Entry Points

### Client Entry

- Location: `/apps/ideate/client/src/main.tsx`
- Triggers: Browser loads `index.html`
- Responsibilities: Renders React app with providers (Theme, Toast, App)

### Server Entry

- Location: `/apps/ideate/server/src/index.ts`
- Triggers: Node.js starts server
- Responsibilities: Sets up Express, WebSocket servers, routes, services

### UI Kit Entry Points

Each package has `src/index.ts` that exports public API:
- `/packages/ui-kit/core/src/index.ts`
- `/packages/ui-kit/react/src/index.ts`
- `/packages/ui-kit/react-chat/src/index.ts`
- `/packages/ui-kit/react-markdown/src/index.ts`
- `/packages/ui-kit/router/src/index.ts`
- `/packages/ui-kit/icons/src/index.ts`
- `/packages/ui-kit/react-pickers/src/index.ts`

## Error Handling

**Strategy:** Defensive error handling with user feedback via Toast

**Client Patterns:**
- try/catch in hooks with error state
- Error boundaries for component failures
- Toast notifications for user-facing errors
- Console logging via `createLogger` utility

**Server Patterns:**
- Operation result types with success/error
- HTTP status codes for REST API
- Error messages via WebSocket for agent operations
- Graceful shutdown handlers

## Cross-Cutting Concerns

**Logging:**
- Client: `createLogger` utility sends logs to server
- Server: Console logging with contextual prefixes

**Validation:**
- Zod schemas for data bus resources
- TypeScript types throughout

**Authentication:**
- Header-based user ID (`x-user-id`)
- WebSocket query params for user info

**Real-Time Sync:**
- Yjs for document collaboration
- WebSocket for resource updates
- Cross-tab sync via localStorage events

---

*Architecture analysis: 2025-01-19*
