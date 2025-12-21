# Federated Collaborative Editing Implementation Plan

> **Status**: Milestone 2 Complete ✅
>
> **Current Step**: Milestone 3.1 - Create ServerIdentityService
>
> **Last Updated**: 2025-12-20

---

## Start Prompt

Copy and paste this to begin/resume work:

```
Read the plan at apps/ideate/docs/plans/collab.md and execute the current step. After completing the step, update the progress tracker in the plan and run any tests specified. Report results before moving to the next step.
```

---

## Quick Start (After Context Clear)

When resuming work on this feature:

1. Read this document to understand current progress
2. Check the **Progress Tracker** section below for current step
3. Look at the **Current Step Details** section for specific tasks
4. After completing a step, update this document's status and tests

---

## Overview

Implement a three-tier collaborative editing system:
- **Tier 1: Offline/Local** - Works standalone
- **Tier 2: Local Network** - Federated P2P via mDNS
- **Tier 3: Cloud** - Optional cloud sync for remote access

### Key Technical Decisions
- **CRDT Library**: Yjs (YATA algorithm)
- **Discovery**: mDNS via `bonjour-service` (local), cloud registry (remote)
- **Workspace Modes**: Private, invite-only, public-local, public-cloud
- **Storage**: Dual format - `.md` (human) + `.yjs` (binary CRDT)
- **Identity**: Ed25519 key pairs per server

---

## Progress Tracker

### Milestone 1: Package Foundation ✅ COMPLETE
| Step | Description | Status |
|------|-------------|--------|
| 1.1 | Create `@ideate/collaboration-core` package | ✅ Complete |
| 1.2 | Create `@ideate/server-shared` package | ✅ Complete |
| 1.3 | Create `@ideate/server-local` package | ✅ Complete |
| 1.4 | Create `@ideate/server-cloud` package | ✅ Complete |
| 1.5 | Update pnpm-workspace.yaml | ✅ Complete |
| 1.6 | Verify all packages build | ✅ Complete |

**Demo**: `pnpm build` succeeds with all new packages ✅ Verified

---

### Milestone 2: Yjs Integration ✅ COMPLETE
| Step | Description | Status |
|------|-------------|--------|
| 2.1 | Add Yjs dependencies | ✅ Complete |
| 2.2 | Create `useYjsCollaboration` hook | ✅ Complete |
| 2.3 | Create `YjsCollaborationHandler` | ✅ Complete |
| 2.4 | Update DocumentService for dual storage | ✅ Complete |
| 2.5 | Integrate with DocumentEditor page | ✅ Complete |
| 2.6 | Test real-time sync in two tabs | ✅ Complete |

**Demo**: Two browser tabs editing same document in real-time ✅ Verified

---

### Milestone 3: Local Federation
| Step | Description | Status |
|------|-------------|--------|
| 3.1 | Create ServerIdentityService | ⬜ Not Started |
| 3.2 | Enhance DiscoveryService with new TXT records | ⬜ Not Started |
| 3.3 | Implement server handshake protocol | ⬜ Not Started |
| 3.4 | Add workspace federation modes | ⬜ Not Started |
| 3.5 | Implement invitation system | ⬜ Not Started |
| 3.6 | Test cross-server workspace discovery | ⬜ Not Started |

**Demo**: Two computers on LAN discover each other's workspaces

---

### Milestone 4: Client Federation
| Step | Description | Status |
|------|-------------|--------|
| 4.1 | Update WorkspaceContext with federation state | ⬜ Not Started |
| 4.2 | Implement NetworkContext discovery | ⬜ Not Started |
| 4.3 | Update Dashboard to show federated workspaces | ⬜ Not Started |
| 4.4 | Add federation settings UI | ⬜ Not Started |
| 4.5 | Add invitation create/redeem UI | ⬜ Not Started |
| 4.6 | Test unified workspace view | ⬜ Not Started |

**Demo**: User sees workspaces from multiple servers in single UI

---

### Milestone 5: Cloud Tier
| Step | Description | Status |
|------|-------------|--------|
| 5.1 | Create S3 storage adapter | ⬜ Not Started |
| 5.2 | Create cloud registry adapter | ⬜ Not Started |
| 5.3 | Implement OAuth authentication | ⬜ Not Started |
| 5.4 | Create WebSocket relay service | ⬜ Not Started |
| 5.5 | Test cloud workspace access | ⬜ Not Started |

**Demo**: Access workspace from different network via cloud

---

## Current Step Details

### Step 2.1: Add Yjs Dependencies ✅ COMPLETE

**Results**:
- ✅ Yjs packages installed in react-markdown: `yjs@13.6.28`, `y-codemirror.next@0.3.5`, `y-indexeddb@9.0.12`
- ✅ Yjs packages installed in ideate server: `yjs@13.6.28`, `y-protocols@1.0.7`
- ✅ Both packages build successfully (pre-existing TS errors in react-markdown are unrelated to Yjs)

---

### Step 2.2: Create useYjsCollaboration Hook ✅ COMPLETE

**Location**: `apps/ideate/client/src/hooks/useYjsCollaboration.ts`

**Results**:
- ✅ Hook created with full TypeScript types
- ✅ Y.Doc lifecycle management with proper cleanup
- ✅ WebSocket connection via y-websocket
- ✅ Offline persistence via y-indexeddb
- ✅ Awareness handling for cursor positions
- ✅ CodeMirror extensions via yCollab and yUndoManagerKeymap

**Dependencies added to @ideate/client**:
- yjs, y-websocket, y-indexeddb, y-codemirror.next, @codemirror/state, @codemirror/view

---

### Step 2.3: Create YjsCollaborationHandler ✅ COMPLETE

**Location**: `apps/ideate/server/src/websocket/YjsCollaborationHandler.ts`

**Results**:
- ✅ Handler created with full TypeScript types
- ✅ Implements y-protocols/sync for document synchronization
- ✅ Implements y-protocols/awareness for cursor/presence
- ✅ Persists documents to filesystem (data/yjs-docs/*.yjs)
- ✅ Room-based collaboration with automatic cleanup
- ✅ Integrated with server at /yjs WebSocket path

**Server changes**:
- Added `lib0` dependency for encoding/decoding
- New WebSocket endpoint: `ws://localhost:3002/yjs`
- Graceful shutdown with document persistence

---

### Step 2.4: Update DocumentService for Dual Storage ✅ COMPLETE

**Location**: `apps/ideate/server/src/services/DocumentService.ts`

**Results**:
- ✅ Added Yjs import and YJS_DIR constant (`~/Ideate/yjs-state/`)
- ✅ Added `getYjsPath(id)` method for Yjs file paths
- ✅ Added `getYjsState(id)` - Get binary Yjs state for a document
- ✅ Added `saveYjsState(id, state)` - Save binary Yjs state
- ✅ Added `initializeYjsDoc(id)` - Initialize Y.Doc from existing markdown or Yjs state
- ✅ Added `syncMarkdownFromYjs(id)` - Export Y.Doc content back to markdown
- ✅ Added `syncYjsFromMarkdown(id)` - Import markdown content into Yjs
- ✅ Added `hasYjsState(id)` - Check if Yjs state exists
- ✅ Added `deleteYjsState(id)` - Clean up Yjs state
- ✅ Updated `createDocument()` to initialize Yjs state for new documents
- ✅ Updated `deleteDocument()` to clean up Yjs state
- ✅ Build and typecheck pass

---

### Step 2.5: Integrate with DocumentEditor Page ✅ COMPLETE

**Location**: `apps/ideate/client/src/pages/DocumentEditor.tsx`

**Results**:
- ✅ Added `extensions` and `disableBuiltInHistory` props to MarkdownEditor/MarkdownCoEditor
- ✅ Modified `useCodeMirrorEditor` to conditionally disable built-in history for Yjs
- ✅ Integrated `useYjsCollaboration` hook in DocumentEditor
- ✅ Mapped Yjs CoAuthor format to MarkdownEditor CoAuthor format
- ✅ Added connection status indicator (connected/connecting/disconnected)
- ✅ Uses defaultValue (uncontrolled mode) to let Yjs manage content
- ✅ All typechecks pass

**Files Modified**:
- `packages/ui-kit/react-markdown/src/components/MarkdownEditor/types.ts` - Added extensions and disableBuiltInHistory props
- `packages/ui-kit/react-markdown/src/components/MarkdownEditor/useCodeMirrorEditor.ts` - Conditional history
- `packages/ui-kit/react-markdown/src/components/MarkdownEditor/MarkdownEditor.tsx` - Pass new props
- `packages/ui-kit/react-markdown/src/components/MarkdownCoEditor/MarkdownCoEditor.tsx` - Pass new props
- `packages/ui-kit/react-markdown/src/index.ts` - Export CoAuthor type
- `apps/ideate/client/src/pages/DocumentEditor.tsx` - Full Yjs integration
- `apps/ideate/client/src/pages/DocumentEditor.module.css` - Connection indicator styles

---

### Step 2.6: Test Real-time Sync in Two Tabs ✅ COMPLETE

**Purpose**: Verify real-time collaborative editing works correctly.

**Test Results** (2025-12-20):
- ✅ Started server on port 3002
- ✅ Opened document "Getting Started Guide" in first tab - Connected
- ✅ Opened same document in second tab - Connected (2 clients in room)
- ✅ Typed "REAL-TIME SYNC TEST FROM TAB 2!" in tab 2 - appeared instantly in tab 1
- ✅ Typed " - AND THIS FROM TAB 1!" in tab 1 - appeared instantly in tab 2
- ✅ Cursor positions visible: "David" cursor in one tab, "Anonymous" in other
- ✅ Connection status indicator shows Connected/Offline correctly
- ✅ Documents persist via Yjs persistence to `data/yjs-docs/`

**Bugs Fixed During Testing**:
1. WebSocket routing: Changed from static `path: '/yjs'` to manual upgrade handling to support `/yjs/{roomName}` paths
2. React 18 Strict Mode: Added `initializedRef.current = false` in cleanup to allow re-initialization after strict mode unmount
3. Cursor cleanup on disconnect: Fixed awareness removal so cursors disappear when users leave:
   - Added `awarenessClientIds` tracking to YjsClient interface
   - Track only clientIDs with non-null state (the client's own ID, not relayed IDs)
   - Created `broadcastAwarenessRemoval()` to manually send removal BEFORE `removeAwarenessStates` deletes the states
   - Use high clock value (timestamp-based) to ensure removal is applied
4. Stale cursors on document open: Fixed by modifying `sendAwarenessState()`:
   - Only send awareness for OTHER connected clients who have sent awareness
   - Clear stale awareness states that aren't associated with any connected client
   - Prevents React Strict Mode's unmount/remount cycles from leaving stale cursors
5. Duplicate room destruction: Added `this.rooms.has(room.name)` check before destroying room in timeout callback
6. **Root cause of stale cursors**: The `y-protocols/awareness` Awareness constructor automatically calls `setLocalState({})`, creating an awareness state for the server's Y.Doc clientID. This appeared as a stale "ghost" cursor to all clients.
   - Fixed by calling `awareness.setLocalState(null)` immediately after creating the Awareness object
   - The server is just a relay and should not have its own awareness state
7. **Content duplication on new documents**: When multiple clients connect to a new document simultaneously (or during React Strict Mode remounts), each would insert initial content before receiving sync from server.
   - Fixed by moving content initialization to the server side via `getInitialContent` callback
   - Client no longer inserts initial content when connected to a server
   - Server initializes Y.Doc from markdown content when room is created
8. **User seeing own cursor as another user**: React Strict Mode creates multiple Y.Doc instances with different clientIDs. Old awareness state with user's name but different clientID appeared as "another user."
   - Fixed by filtering out awareness states in `updateCoAuthors` that have the same name as the local user
   - Server now broadcasts stale awareness removal to all clients (not just silent deletion)

**Acceptance Criteria**:
- [x] Changes sync in real-time between tabs
- [x] Cursor positions are visible for other users
- [x] Connection status updates correctly
- [x] Documents persist when tabs are closed and reopened
- [x] Cursors disappear when users leave the document
- [x] No stale cursors appear when opening documents as a single client

---

## Package Structure Overview

```
packages/
└── ideate/
    ├── collaboration-core/   # CRDT types, protocol definitions
    ├── server-shared/        # Shared Express routes, services, adapters
    ├── server-local/         # Local server entry (mDNS, filesystem)
    └── server-cloud/         # Cloud server entry (S3, OAuth)

apps/ideate/
├── client/                   # React frontend (existing)
├── server/                   # Current server (will import from packages)
└── docs/                     # Documentation (this file)
```

**Dependency Graph**:
```
@ideate/collaboration-core
         │
         ▼
@ideate/server-shared
         │
    ┌────┴────┐
    ▼         ▼
server-local  server-cloud
```

---

## Critical Files Reference

### Files to Create
- `packages/ideate/collaboration-core/` - Types and protocol
- `packages/ideate/server-shared/` - Shared server code
- `packages/ideate/server-local/` - Local server entry
- `packages/ideate/server-cloud/` - Cloud server entry

### Files to Modify
- `pnpm-workspace.yaml` - Add `packages/ideate/*`
- `apps/ideate/server/src/services/DiscoveryService.ts` - Enhanced mDNS
- `apps/ideate/server/src/websocket/CollaborationHandler.ts` - Replace with Yjs
- `apps/ideate/server/src/services/DocumentService.ts` - Dual storage
- `apps/ideate/server/src/services/WorkspaceService.ts` - Federation metadata
- `apps/ideate/client/src/contexts/WorkspaceContext.tsx` - Federation state
- `apps/ideate/client/src/contexts/NetworkContext.tsx` - Discovery
- `apps/ideate/client/src/pages/DocumentEditor.tsx` - Yjs integration

### Reference Files
- `packages/ui-kit/react-markdown/docs/plans/01-codemirror-yjs.md` - Yjs plan
- `packages/ui-kit/core/package.json` - Package.json template
- `apps/ideate/server/src/websocket/CollaborationHandler.ts` - Current handler

---

## Test Scenarios

### Milestone 1 Tests
```bash
# Verify packages build
pnpm build

# Verify types are importable
# Create test file that imports from @ideate/collaboration-core
```

### Milestone 2 Tests
```bash
# Terminal 1: Start server
cd apps/ideate/server && pnpm dev

# Browser 1: Open http://localhost:3002
# - Create new document
# - Start typing

# Browser 2: Open same document URL
# - Type simultaneously
# - Verify changes sync in real-time
# - Verify cursor positions visible
```

### Milestone 3 Tests
```bash
# Machine A
cd apps/ideate/server && pnpm dev
# Create workspace, set to "public-local"

# Machine B (same network)
cd apps/ideate/server && pnpm dev
# Verify Machine A's workspace appears

# Test invitation flow
# Machine A: Create private workspace, generate invite
# Machine B: Enter invite code, verify access
```

### Milestone 4 Tests
```bash
# Setup: Two machines running servers
# Verify unified workspace list in UI
# Verify cross-server document editing
# Verify co-author cursors across servers
```

### Milestone 5 Tests
```bash
# Deploy cloud server
# Verify OAuth login
# Verify workspace migration to cloud
# Verify access from different network
```

---

## Dependencies to Add

```json
{
  "yjs": "^13.6.0",
  "y-codemirror.next": "^0.3.0",
  "y-indexeddb": "^9.0.0",
  "y-protocols": "^1.0.0",
  "bonjour-service": "^1.2.1",
  "@noble/ed25519": "^2.0.0"
}
```

---

## Notes

- Server restart required after modifying server files
- mDNS may not work on all networks (corporate firewalls)
- CRDT state grows over time - consider periodic compaction
- Test with real network latency, not just localhost
