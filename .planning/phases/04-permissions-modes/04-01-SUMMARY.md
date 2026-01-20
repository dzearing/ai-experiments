---
phase: 04-permissions-modes
plan: 01
subsystem: permissions
tags: [permissions, sse, server, sdk]

dependency-graph:
  requires: [02-01, 02-02]
  provides: [permission-types, permission-service, canUseTool-callback, permission-endpoints]
  affects: [04-02, 04-03]

tech-stack:
  added: []
  patterns: [canUseTool-callback, pending-permission-tracking, sse-event-flow]

key-files:
  created:
    - apps/claude-code-web/server/src/services/permissionService.ts
  modified:
    - apps/claude-code-web/server/src/types/index.ts
    - apps/claude-code-web/server/src/services/agentService.ts
    - apps/claude-code-web/server/src/routes/agent.ts

decisions:
  - id: PERM-TIMEOUT
    choice: "55s timeout before SDK 60s"
    rationale: "Auto-deny with user-friendly message before SDK timeout"

metrics:
  duration: 3 min
  completed: 2026-01-20
---

# Phase 4 Plan 1: Server Permission Infrastructure Summary

**One-liner:** canUseTool callback sends SSE permission_request events, pending permissions tracked with 55s timeout, response endpoints resolve promises.

## What Was Built

### Permission Types (types/index.ts)

Added comprehensive permission-related types:

- `PermissionMode`: 'default' | 'plan' | 'acceptEdits' | 'bypassPermissions'
- `PermissionRequest`: requestId, toolName, input, timestamp
- `PermissionResponse`: requestId, behavior (allow/deny), message, updatedInput
- `QuestionRequest/QuestionResponse`: For AskUserQuestion tool
- SSE event types: `PermissionRequestEvent`, `QuestionRequestEvent`, `ModeChangedEvent`

### Permission Service (permissionService.ts)

New service for managing pending permission requests:

- `createPermissionRequest(toolName, input, signal)`: Creates promise that resolves on user response
- `resolvePermission(requestId, response)`: Resolves pending promise with user's decision
- `getPendingCount()`: Monitoring utility
- 55s timeout auto-denies before SDK's 60s timeout
- Abort signal support for cancellation

### Agent Service Updates (agentService.ts)

- Added connection tracking (`activeConnections` Map)
- `registerConnection(sessionId, res)`: Track SSE responses for permission events
- `unregisterConnection(sessionId)`: Cleanup on disconnect
- `createCanUseToolCallback(sessionId)`: Factory for canUseTool callbacks
- Updated `streamAgentQuery` to use canUseTool callback when not in bypassPermissions mode
- Special handling for AskUserQuestion sends `question_request` event instead of `permission_request`

### Route Updates (routes/agent.ts)

- `/stream` now accepts `permissionMode` query param
- Connection registered with effectiveSessionId for permission events
- Added `POST /permission-response`: Resolves permission with allow/deny
- Added `POST /question-response`: Handles AskUserQuestion answers

## Key Implementation Details

### Permission Flow

1. SDK calls `canUseTool(toolName, input, { signal })`
2. Callback creates pending permission and stores resolve/reject
3. SSE event sent to client (`permission_request` or `question_request`)
4. Client shows UI and user decides
5. Client POSTs to `/permission-response` or `/question-response`
6. Server resolves pending promise, SDK continues

### Timeout Handling

- 55s timeout set before SDK's internal 60s
- On timeout, promise resolves with `{ behavior: 'deny', message: 'Permission request timed out' }`
- Prevents SDK from throwing timeout error

## Commits

| Hash | Description |
|------|-------------|
| a2f74a9 | feat(04-01): add permission types |
| 5faa25c | feat(04-01): create permission service for pending request tracking |
| f551f1d | feat(04-01): implement canUseTool callback and permission endpoints |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Phase 4 Plan 2 (Client Permission UI) can now:
- Receive `permission_request` and `question_request` SSE events
- Send responses to `/api/agent/permission-response` and `/api/agent/question-response`
- Pass `permissionMode` query param to `/api/agent/stream`
