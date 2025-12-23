# Facilitator Chat Feature Implementation Plan

## Overview

Build an AI-powered Facilitator Chat system for Ideate that provides a global chat overlay triggered by Ctrl/Cmd+C, with Claude Code integration, MCP tools for workspace/document operations, and a task queue with agent pool for background work execution.

## User Requirements Summary

- **Trigger**: Ctrl/Cmd + C toggles overlay from anywhere
- **Animation**: Chat input slides up from bottom, messages slide down from top, both with fade
- **Scope**: Global conversation (not workspace-specific)
- **Persistence**: Server-side chat storage (resume across sessions)
- **AI**: Claude Code TypeScript API integration
- **MCP Tools**: Workspace/document CRUD, summarization, search
- **Tasks**: SQLite-persisted task queue with agent pool
- **Dashboard**: Separate /tasks page for task management

---

## Architectural Guidelines

### File Size Limits
- **Max 500 lines per source file** - refactor if larger
- Split complex components into smaller utilities
- Extract reusable logic into separate hooks/services

### UI-Kit Components to Use
From `@ui-kit/react`:
- `Slide` - Overlay entrance/exit animations
- `Modal` - Portal pattern for overlay
- `Button`, `IconButton` - Action buttons
- `Card`, `Panel` - Message containers
- `Spinner`, `Skeleton` - Loading states
- `Toast`, `Alert` - Error/success notifications
- `Avatar` - User/agent identification
- `Table` - Task list display
- `Chip` - Status badges

### Design Token Usage
Reference: `/docs/guides/TOKEN_CHEATSHEET.md`

```css
/* Color Groups - ALWAYS stay within same group */
--soft-bg, --soft-fg, --soft-border    /* Cards, panels */
--base-bg, --base-fg, --base-border    /* Page background */
--primary-bg, --primary-fg             /* Primary actions */
--danger-fg, --success-fg              /* Status indicators */

/* Spacing (4px grid) */
--space-2 (8px), --space-4 (16px), --space-6 (24px)

/* Typography */
--text-sm (13px), --text-base (15px), --text-xl (20px)

/* Animation */
--duration-fast (100ms), --duration-normal (200ms)
--ease-default, --ease-out

/* Border Radius */
--radius-md (4px), --radius-lg (8px)
```

### Error Handling Strategy

**Client-side:**
- Connection errors → Toast notification + auto-reconnect
- API errors → Inline error message with retry button
- Validation errors → Field-level error display
- Session expired → Redirect to auth with message

**Server-side:**
- Database errors → Log + return 500 with safe message
- Claude API errors → Log + return partial response if possible
- WebSocket errors → Send error message + close gracefully
- All errors → Structured error response: `{ error: string, code: string, details?: any }`

### Modular Server Architecture

```
services/
├── FacilitatorChatService.ts    # Chat persistence (~150 lines)
├── FacilitatorService.ts        # Claude orchestration (~200 lines)
├── PersonaService.ts            # Persona loading (~80 lines)
├── DatabaseService.ts           # SQLite connection (~100 lines)
├── TaskService.ts               # Task CRUD + state machine (~250 lines)
├── TaskScheduler.ts             # Queue scheduling logic (~150 lines)
├── AgentPoolService.ts          # Agent management (~200 lines)
└── MCPToolsService.ts           # Tool definitions (~150 lines)

tools/                           # MCP tool implementations
├── WorkspaceTools.ts            # workspace_* tools (~100 lines)
├── DocumentTools.ts             # document_* tools (~150 lines)
├── SearchTools.ts               # search, summarize (~100 lines)
└── TaskTools.ts                 # create_task (~80 lines)
```

### Testing Requirements
- Unit tests for services (vitest)
- Component tests for UI (testing-library)
- WebSocket mock tests
- Integration tests for critical paths

### Phase Verification Protocol
Each phase must complete:
1. **Automated tests** - All tests pass before manual review
2. **Manual validation** - Checklist of behaviors to verify
3. **User approval** - Stop and confirm before next phase

---

## Phase 1: Facilitator Chat UI (Priority: First)

### 1.1 Global Keyboard Shortcut Hook

**File**: `/apps/ideate/client/src/hooks/useGlobalKeyboard.ts`

```typescript
interface UseGlobalKeyboardOptions {
  key: string;           // '`' for tilde
  ctrlOrMeta: boolean;   // Require Ctrl (Win/Linux) or Cmd (Mac)
  onTrigger: () => void;
  disabled?: boolean;
}
```

### 1.2 Facilitator Context

**File**: `/apps/ideate/client/src/contexts/FacilitatorContext.tsx`

State management for:
- Open/closed state
- Messages array
- Connection status
- Loading state

Actions:
- `toggle()`, `open()`, `close()`
- `sendMessage(content: string)`

### 1.3 Facilitator WebSocket Hook

**File**: `/apps/ideate/client/src/hooks/useFacilitatorSocket.ts`

Pattern: Follow existing `useChatSocket.ts` for connection management, reconnection logic.

### 1.4 Facilitator Overlay Component

**Files**:
- `/apps/ideate/client/src/components/FacilitatorOverlay/FacilitatorOverlay.tsx`
- `/apps/ideate/client/src/components/FacilitatorOverlay/FacilitatorOverlay.module.css`
- `/apps/ideate/client/src/components/FacilitatorOverlay/FacilitatorMessage.tsx`

**Animation**: Use existing `Slide` component from `@ui-kit/react`:
- Entire overlay: `direction="up"`, `duration={250}`, `fade={true}`
- Messages container: `direction="down"`, `duration={200}`, `fade={true}`

**Layout**:
```
+----------------------------------------+
|    [Messages - slides down from top]   |
+----------------------------------------+
|    [ChatInput - part of overlay]       |
+----------------------------------------+
```

### 1.5 App.tsx Integration

Add `FacilitatorProvider` inside `AuthProvider` but outside `WorkspaceProvider` (global scope):

```tsx
<AuthProvider>
  <FacilitatorProvider>
    {/* ... other providers ... */}
    <FacilitatorOverlay />
  </FacilitatorProvider>
</AuthProvider>
```

### 1.6 Phase 1 Tests

**Files to create:**
- `useGlobalKeyboard.test.ts` - Keyboard hook tests
- `FacilitatorContext.test.tsx` - Context state tests
- `FacilitatorOverlay.test.tsx` - Component rendering tests
- `FacilitatorMessage.test.tsx` - Message display tests

**Test coverage:**
- Keyboard shortcut triggers overlay toggle
- Overlay animates in/out correctly
- Context state updates properly
- Messages render with correct styling
- Error states display appropriately

### 1.7 Phase 1 Manual Validation

Run Storybook and verify:
- [ ] Press Ctrl/Cmd+` - overlay slides up from bottom with fade
- [ ] Press again - overlay slides down and fades out
- [ ] Type message - text appears in input
- [ ] Click outside overlay - does NOT close (intentional)
- [ ] Escape key - closes overlay
- [ ] Check mobile/responsive behavior
- [ ] Verify tokens used correctly (inspect CSS)

**Stop here for user approval before Phase 2.**

---

## Phase 2: Server-Side Facilitator Service

### 2.1 Facilitator Chat Persistence

**Files**:
- `/apps/ideate/server/src/services/FacilitatorChatService.ts`

**Storage**: `~/Ideate/facilitator/`
- `{userId}.messages.jsonl` - Append-only message log
- `{userId}.meta.json` - Metadata (last updated, message count)

### 2.2 Persona Service

**File**: `/apps/ideate/server/src/services/PersonaService.ts`

**Storage**: `~/Ideate/personas/facilitator.md`

Loads persona markdown file for system prompt.

### 2.3 Facilitator WebSocket Handler

**File**: `/apps/ideate/server/src/websocket/FacilitatorWebSocketHandler.ts`

**Endpoint**: `ws://host:port/facilitator-ws?userId=xxx&userName=xxx`

**Protocol**:
- Client: `{ type: 'message', content: string }`
- Server: `{ type: 'text_chunk' | 'tool_use' | 'tool_result' | 'message_complete' | 'error', ... }`

### 2.4 Facilitator Service with Claude Integration

**File**: `/apps/ideate/server/src/services/FacilitatorService.ts`

**Dependencies**: `@anthropic-ai/claude-code` (or `@instantlyeasy/claude-code-sdk-ts`)

**Key Method**:
```typescript
async processMessage(
  userId: string,
  message: string,
  callbacks: StreamCallbacks
): Promise<void>
```

Stream callbacks:
- `onTextChunk(text)` - Streaming text
- `onToolUse({ name, input })` - Tool execution start
- `onToolResult({ name, output })` - Tool execution result
- `onComplete(response)` - Final response
- `onError(error)` - Error handling

### 2.5 Phase 2 Tests

**Files to create:**
- `FacilitatorChatService.test.ts` - Persistence tests
- `PersonaService.test.ts` - Persona loading tests
- `FacilitatorWebSocketHandler.test.ts` - WebSocket protocol tests
- `FacilitatorService.test.ts` - Claude integration tests (mocked)

**Test coverage:**
- Messages persist and load correctly (JSONL format)
- Persona loads from markdown file
- WebSocket connects/disconnects properly
- Streaming responses work correctly
- Error handling for Claude API failures

### 2.6 Phase 2 Manual Validation

1. Start server and client
2. Open Facilitator overlay
3. Verify:
   - [ ] Send message - response streams back in chunks
   - [ ] Message persists - refresh page, messages still there
   - [ ] Connection indicator shows status
   - [ ] Error message appears if Claude API fails (test with invalid key)
   - [ ] Reconnection works after disconnect

**Stop here for user approval before Phase 3.**

---

## Phase 3: MCP Tools

### 3.1 MCP Tools Service

**File**: `/apps/ideate/server/src/services/MCPToolsService.ts`

**Tools**:

| Tool | Description |
|------|-------------|
| `workspace_list` | List all accessible workspaces |
| `workspace_get` | Get workspace details |
| `document_list` | List documents (optionally by workspace) |
| `document_get` | Get document content |
| `document_create` | Create new document |
| `document_update` | Update document |
| `document_delete` | Delete document |
| `summarize` | Summarize document or text |
| `search` | Search across documents |
| `create_task` | Create task for agent pool |

### 3.2 Tool Executor

Each tool maps to existing service methods:
- `workspace_*` → `WorkspaceService`
- `document_*` → `DocumentService`
- `create_task` → `TaskService` (Phase 4)

### 3.3 Phase 3 Tests

**Files to create:**
- `MCPToolsService.test.ts` - Tool definition tests
- `WorkspaceTools.test.ts` - Workspace tool execution tests
- `DocumentTools.test.ts` - Document tool execution tests
- `SearchTools.test.ts` - Search/summarize tests

**Test coverage:**
- Each tool validates input correctly
- Tools return properly structured results
- Error handling for invalid operations
- Permission checks work correctly

### 3.4 Phase 3 Manual Validation

In Facilitator chat, test each tool:
- [ ] "List my workspaces" → shows workspace list
- [ ] "What documents are in [workspace]?" → lists documents
- [ ] "Show me the content of [document]" → displays content
- [ ] "Create a new document called Test" → creates document
- [ ] "Summarize [document]" → returns summary
- [ ] "Search for [term]" → returns matching results
- [ ] Invalid requests show helpful error messages

**Stop here for user approval before Phase 4.**

---

## Phase 4: Task Queue System

### 4.1 Database Setup

**Dependency**: Add `better-sqlite3` to server

**File**: `/apps/ideate/server/src/services/DatabaseService.ts`

**Location**: `~/Ideate/data/tasks.db`

**Schema**:
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  parent_task_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  steps TEXT,              -- JSON array
  considerations TEXT,     -- JSON array
  validation_criteria TEXT, -- JSON array
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_agent_id TEXT,
  started_at TEXT,
  completed_at TEXT,
  depends_on TEXT,         -- JSON array of task IDs
  resource_locks TEXT,     -- JSON array for conflict detection
  conflict_group TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  result TEXT              -- JSON
);

CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  current_task_id TEXT,
  last_heartbeat TEXT,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0
);

CREATE TABLE task_history (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  agent_id TEXT,
  details TEXT
);
```

### 4.2 Task Service

**File**: `/apps/ideate/server/src/services/TaskService.ts`

**State Machine**: `pending → queued → in_progress → completed|failed|blocked`

**Key Methods**:
- CRUD: `create`, `getById`, `update`, `delete`, `list`
- State: `enqueue`, `start`, `complete`, `fail`, `block`, `unblock`, `retry`
- Dependencies: `addDependency`, `removeDependency`, `getDependencyTree`
- Conflicts: `hasConflict`, `getConflictingTasks`

### 4.3 Agent Pool Service

**File**: `/apps/ideate/server/src/services/AgentPoolService.ts`

**Config**:
- `maxAgents`: 3 (default)
- `heartbeatInterval`: 30s
- `taskTimeout`: 5 minutes

**Scheduling Logic**:
1. Check if task has unmet dependencies → block
2. Check for conflicts (same `conflictGroup` or overlapping `resourceLocks`) → wait
3. Find idle agent → assign
4. No idle agent → queue

### 4.4 Task WebSocket Handler

**File**: `/apps/ideate/server/src/websocket/TaskWebSocketHandler.ts`

**Endpoint**: `ws://host:port/tasks-ws`

**Events**:
- `task:created`, `task:updated`, `task:deleted`
- `task:status_changed`, `task:progress`
- `agent:status_changed`
- `queue:updated`

### 4.5 Phase 4 Tests

**Files to create:**
- `DatabaseService.test.ts` - SQLite connection tests
- `TaskService.test.ts` - Task CRUD + state machine tests
- `TaskScheduler.test.ts` - Scheduling logic tests
- `AgentPoolService.test.ts` - Agent management tests
- `TaskWebSocketHandler.test.ts` - WebSocket event tests

**Test coverage:**
- Database migrations run correctly
- Task state machine transitions work
- Dependencies block correctly
- Conflicts detected properly
- Agent assignment works
- WebSocket events broadcast correctly
- Retry logic works for failures

### 4.6 Phase 4 Manual Validation

Using REST API (curl/Postman):
- [ ] Create task via API → task appears in database
- [ ] Enqueue task → status changes to queued
- [ ] Agent picks up task → status changes to in_progress
- [ ] Task completes → status changes to completed
- [ ] Create task with dependency → blocked until dependency completes
- [ ] Create conflicting tasks → only one runs at a time
- [ ] Failed task retries → retry_count increments

**Stop here for user approval before Phase 5.**

---

## Phase 5: Tasks Dashboard

### 5.1 REST API

**File**: `/apps/ideate/server/src/routes/tasks.ts`

**Endpoints**:
- `GET /api/tasks` - List with filters
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/enqueue` - Enqueue task
- `POST /api/tasks/:id/cancel` - Cancel task
- `POST /api/tasks/:id/retry` - Retry failed task
- `GET /api/tasks/:id/history` - Get history
- `GET /api/agents` - List agents
- `GET /api/queue/stats` - Queue statistics

### 5.2 Client Components

**Files**:
- `/apps/ideate/client/src/contexts/TaskContext.tsx`
- `/apps/ideate/client/src/pages/Tasks.tsx`
- `/apps/ideate/client/src/components/TaskCard/TaskCard.tsx`
- `/apps/ideate/client/src/components/TaskDetail/TaskDetail.tsx`
- `/apps/ideate/client/src/components/AgentStatus/AgentStatus.tsx`
- `/apps/ideate/client/src/components/QueueStats/QueueStats.tsx`

### 5.3 Route Integration

Add `/tasks` route to `App.tsx` protected routes.

### 5.4 Phase 5 Tests

**Files to create:**
- `TaskContext.test.tsx` - Context state tests
- `Tasks.test.tsx` - Page rendering tests
- `TaskCard.test.tsx` - Card display tests
- `TaskDetail.test.tsx` - Detail panel tests
- `AgentStatus.test.tsx` - Agent display tests
- `QueueStats.test.tsx` - Statistics tests

**Test coverage:**
- Task list renders correctly
- Filters work (status, workspace)
- Real-time updates via WebSocket
- Actions (cancel, retry, delete) work
- Agent status displays correctly
- Statistics update in real-time

### 5.5 Phase 5 Manual Validation

Navigate to /tasks and verify:
- [ ] Task list displays all tasks
- [ ] Filter by status works
- [ ] Click task → detail panel opens
- [ ] Cancel button cancels in-progress task
- [ ] Retry button retries failed task
- [ ] Delete button removes task
- [ ] Real-time updates appear without refresh
- [ ] Agent status shows idle/busy correctly
- [ ] Queue statistics are accurate
- [ ] Responsive layout works on mobile

**Stop here for user approval before Phase 6.**

---

## Phase 6: Diagnostics Integration

### 6.1 Extend Diagnostics Page

**File**: `/apps/ideate/client/src/pages/Diagnostics.tsx`

Add new sections:
- **Facilitator Stats**: Active sessions, messages today, avg response time
- **Task Queue Stats**: Pending/running/completed counts, agent status
- **Claude API Stats**: API calls, token usage, errors

### 6.2 Phase 6 Tests

- Diagnostics page renders new sections
- Real-time updates work
- Error states handled gracefully

### 6.3 Phase 6 Manual Validation

- [ ] Diagnostics page shows Facilitator section
- [ ] Diagnostics page shows Task Queue section
- [ ] Metrics update in real-time
- [ ] No performance degradation

---

## Phase 7: Documentation

**File**: `/apps/ideate/docs/plans/ai-experience.md`

Document the full architecture, API reference, and extension points for future MCP tool additions.

---

## Implementation Order

| Phase | Deliverable | Dependencies | Verification |
|-------|-------------|--------------|--------------|
| 1 | Facilitator Chat UI | None | Tests + Manual (1.6-1.7) |
| 2 | Server + Claude Integration | Phase 1 | Tests + Manual (2.5-2.6) |
| 3 | MCP Tools | Phase 2 | Tests + Manual (3.3-3.4) |
| 4 | Task Queue Backend | Phase 3 | Tests + Manual (4.5-4.6) |
| 5 | Tasks Dashboard | Phase 4 | Tests + Manual (5.4-5.5) |
| 6 | Diagnostics Integration | Phases 2, 4 | Tests + Manual (6.2-6.3) |
| 7 | Documentation | All | Review |

**Each phase requires:**
1. All automated tests passing
2. Manual validation checklist complete
3. User approval before proceeding

---

## Key Files Reference

### Client
- `/apps/ideate/client/src/App.tsx` - Integration point
- `/apps/ideate/client/src/hooks/useChatSocket.ts` - WebSocket pattern
- `/packages/ui-kit/react/src/components/Animation/Slide.tsx` - Animation component
- `/packages/ui-kit/react/src/components/Modal/Modal.tsx` - Portal/focus trap pattern

### Server
- `/apps/ideate/server/src/index.ts` - WebSocket server setup
- `/apps/ideate/server/src/services/ChatRoomService.ts` - JSONL persistence pattern
- `/apps/ideate/server/src/websocket/ChatWebSocketHandler.ts` - WebSocket handler pattern
- `/apps/v1/server/claude-service.js` - Claude SDK usage reference

### Dependencies to Add

**Server** (`/apps/ideate/server/package.json`):
```json
{
  "dependencies": {
    "@anthropic-ai/claude-code": "^1.0.41",
    "better-sqlite3": "^11.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11"
  }
}
```
