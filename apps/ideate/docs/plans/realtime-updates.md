# Resource Event System: Real-time Updates for Background Agent Processing

## Problem Statement

When a user creates a new idea and sends a message, the agent should continue working in the background even if the dialog is closed. The Kanban card should reflect the current state (Running/Idle), and when the agent finishes, the document and metadata (title, summary) should be updated - all without requiring the dialog to be open.

## Open issues

* Providers can manage connection. eventbus should only mediate subscribers and communicate with
 providers. providers publish data back to the event bus. event bus notifies subscribers. 
* Event bus protocol unclear. How do we request data, how is data sent? How are json objects deltad, how are collections (arrays of things) deltad.
* for ideas and things specifically, where are they stored on disk, how are subs notified?
* Items in the event bus should be accessible via an item path. Item paths can be strongly typed to a particular type of data, possibly using zod and a helper.
* Busses can be easily and abstractly connected to other busses and merged. This will allow us to have cloud assets and local peer-to-peer assets in the future. Assets busses expose should have paths. Subscribing to particular assets would still have some kind of authorization validation (user context to provider) so that the system can't be abused to sub to items you don't have access to. This isn't a direct concern of the event bus, but it needs to support some kind of user context being passed along.

### Current Broken Behavior

1. **User creates idea, sends prompt, closes dialog**
2. **Kanban card shows "Idle"** instead of "Running"
3. **Description shows "Processing..."** - never updates
4. **Reopening dialog later**: Chat shows agent responded, but document wasn't updated
5. **Reopening during processing**: Working indicator doesn't show (state not synced)

### Root Causes Identified

1. **No metadata extraction**: Agent writes to Yjs document, but title/summary never synced to idea record
2. **Yjs edits lost when no client connected**: Agent edits Yjs, but if room is destroyed before flush, edits are lost
3. **Session state not broadcast on reconnect**: Client doesn't know agent is still running
4. **No general subscription architecture**: Components hardcode their own subscription logic

---

## Design Goals

1. **Agent-agnostic**: Works for Idea Agent, Plan Agent, Execution Agent, any future agent
2. **Resource-agnostic**: Works for ideas, documents, things, any resource type
3. **Connection-independent**: Server persists state and syncs to all clients when they connect
4. **Metadata auto-sync**: When agent finishes writing a document, metadata (title, summary, tags) is extracted and saved
5. **Graceful degradation**: Works for non-workspace items (user-scoped), then workspace items
6. **Efficient subscriptions**: Client-side event bus with reference counting - multiple UI subscribers share single network connection
7. **Lazy-loaded providers**: Data sources only activate when something needs data
8. **Delta sync**: Efficiently update already-subscribed data across different subscriber lifespans

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              SERVER                                        │
│                                                                            │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐  │
│  │ Agent        │────▶│ ResourceEventBus │────▶│ WorkspaceWebSocket     │  │
│  │ (Idea/Plan)  │     │                  │     │ Handler                │  │
│  │              │     │ - emit(event)    │     │                        │  │
│  │ - status     │     │ - subscribe()    │     │ - broadcast to clients │  │
│  │ - document   │     │ - persist events │     │ - handle subscriptions │  │
│  └──────────────┘     └──────────────────┘     └────────────────────────┘  │
│         │                      │                          │                │
│         │                      │                          │                │
│         ▼                      ▼                          │                │
│  ┌──────────────┐     ┌──────────────────┐                │                │
│  │ Yjs Document │     │ ResourceState    │                │                │
│  │ Persistence  │     │ (metadata store) │                │                │
│  │              │────▶│                  │                │                │
│  │ - auto-flush │     │ - title/summary  │                │                │
│  │ - extract    │     │ - agentStatus    │                │                │
│  │   metadata   │     │ - last updated   │                │                │
│  └──────────────┘     └──────────────────┘                │                │
│                                                           │                │
└───────────────────────────────────────────────────────────│────────────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                         │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         packages/event-bus                             │ │
│  │                                                                        │ │
│  │  ┌───────────────────────────────────────────────────────────────────┐ │ │
│  │  │                        EventBus (singleton)                       │ │ │
│  │  │                                                                   │ │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐  │ │ │
│  │  │  │              WebSocketTransport (SINGLE CONNECTION)         │  │ │ │
│  │  │  │                                                             │  │ │ │
│  │  │  │  - One WS connection to server                              │  │ │ │
│  │  │  │  - Shared across ALL resource types                         │  │ │ │
│  │  │  │  - Routes messages to appropriate handlers                  │  │ │ │
│  │  │  └─────────────────────────────────────────────────────────────┘  │ │ │
│  │  │                                                                   │ │ │
│  │  │  - subscribe(key, callback) → returns unsubscribe fn              │ │ │
│  │  │  - Returns current state immediately on subscribe                 │ │ │
│  │  │  - Reference counting: sub to server on first local sub           │ │ │
│  │  │  - Reference counting: unsub from server on last local unsub      │ │ │
│  │  │  - registerHandler(type, handler) for type-specific caching       │ │ │
│  │  └───────────────────────────────────────────────────────────────────┘ │ │
│  │                                 │                                      │ │
│  │            ┌────────────────────┼────────────────────┐                 │ │
│  │            ▼                    ▼                    ▼                 │ │
│  │   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐           │ │
│  │   │ IdeaHandler  │     │ ThingHandler │     │ DocHandler   │           │ │
│  │   │ (cache only) │     │ (cache only) │     │ (cache only) │           │ │
│  │   │              │     │              │     │              │           │ │
│  │   │ NO WebSocket │     │ NO WebSocket │     │ NO WebSocket │           │ │
│  │   │ Just caches  │     │ Just caches  │     │ Just caches  │           │ │
│  │   │ + transforms │     │ + transforms │     │ + transforms │           │ │
│  │   └──────────────┘     └──────────────┘     └──────────────┘           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐           ┌─────────────────┐        ┌─────────────┐       │
│  │ IdeaCard    │           │ IdeaDialog      │        │ ThingCard   │       │
│  │             │           │                 │        │             │       │
│  │ useResource │           │ useResource     │        │ useResource │       │
│  │ ('idea',id) │           │ ('idea',id)     │        │ ('thing',x) │       │
│  │             │           │                 │        │             │       │
│  │   All UI    │◀──────────│▶ ONE WebSocket  │◀───────│▶ shared!    │       │
│  └─────────────┘           └─────────────────┘        └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Event Bus Package (Client - NEW PACKAGE)

A reusable, general-purpose event bus package with reference counting and lazy-loaded providers.

**Package**: `packages/event-bus`

```
packages/event-bus/
├── src/
│   ├── EventBus.ts           # Core event bus singleton
│   ├── EventBus.test.ts      # Full test coverage
│   ├── types.ts              # Shared types
│   ├── Provider.ts           # Base provider interface
│   ├── useResource.ts        # React hook
│   └── index.ts              # Public exports
├── README.md                 # Full documentation
└── package.json
```

**Core API**:
```typescript
// types.ts
interface ResourceKey {
  type: string;      // 'idea' | 'document' | 'thing' | etc.
  id: string;        // Resource ID
}

interface SubscriptionCallback<T> {
  (state: T | null, prevState: T | null): void;
}

interface ResourceProvider<T> {
  /** Called when first subscriber subscribes to this resource type */
  activate(bus: EventBus): void;
  /** Called when last subscriber unsubscribes from this resource type */
  deactivate(): void;
  /** Get current state for a resource */
  getState(id: string): T | null;
  /** Handle incoming updates from server */
  handleUpdate(id: string, data: Partial<T>): void;
}

// EventBus.ts
class EventBus {
  /**
   * Subscribe to a resource. Returns current state immediately
   * and fires callback on subsequent changes.
   * @returns Unsubscribe function
   */
  subscribe<T>(
    key: ResourceKey,
    callback: SubscriptionCallback<T>
  ): () => void;

  /**
   * Register a provider for a resource type.
   * Provider is lazy-loaded - only activated when first subscription occurs.
   */
  registerProvider<T>(type: string, provider: ResourceProvider<T>): void;

  /**
   * Publish an update to all subscribers of a resource.
   * Called by providers when they receive data from server.
   */
  publish<T>(key: ResourceKey, state: T): void;

  /**
   * Get current subscriber count for a resource (for testing/debugging)
   */
  getSubscriberCount(key: ResourceKey): number;
}

// useResource.ts - React integration
function useResource<T>(
  type: string,
  id: string | null,
  initialData?: T
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}
```

**Reference Counting Behavior**:
```
IdeaCard subscribes to ('idea', 'abc-123')
  → refCount['idea:abc-123'] = 1
  → IdeaProvider.activate() called (first sub to 'idea' type)
  → Server subscription sent for 'idea:abc-123'

IdeaDialog subscribes to ('idea', 'abc-123')
  → refCount['idea:abc-123'] = 2
  → NO new server subscription (already subscribed)
  → Callback receives current cached state immediately

IdeaCard unmounts
  → refCount['idea:abc-123'] = 1
  → NO server unsubscription (still have subscribers)

IdeaDialog unmounts
  → refCount['idea:abc-123'] = 0
  → Server unsubscription sent for 'idea:abc-123'
  → (Optional) IdeaProvider.deactivate() if no 'idea' subs remain
```

### 2. WebSocket Transport (Shared)

A single WebSocket connection shared by all resource types. The EventBus manages this connection.

**File**: `packages/event-bus/src/WebSocketTransport.ts` (NEW)

```typescript
interface WebSocketTransport {
  /** Connect to server */
  connect(url: string): void;

  /** Disconnect from server */
  disconnect(): void;

  /** Send a message to server */
  send(message: unknown): void;

  /** Register message handler */
  onMessage(handler: (message: unknown) => void): void;

  /** Connection state */
  isConnected: boolean;
}
```

### 3. Resource Handlers (Not Providers)

Instead of multiple providers with their own connections, we have **handlers** that process messages for their resource type. The EventBus routes messages to the appropriate handler.

**File**: `apps/ideate/client/src/handlers/IdeaHandler.ts` (NEW)

```typescript
class IdeaHandler implements ResourceHandler<Idea> {
  private cache = new Map<string, Idea>();

  /** Get current cached state */
  getState(id: string): Idea | null {
    return this.cache.get(id) ?? null;
  }

  /** Handle incoming update from server (called by EventBus) */
  handleUpdate(id: string, data: Partial<Idea>): Idea {
    const existing = this.cache.get(id);
    const updated = { ...existing, ...data } as Idea;
    this.cache.set(id, updated);
    return updated;
  }

  /** Clear cache (called on disconnect) */
  clear(): void {
    this.cache.clear();
  }
}
```

**The EventBus owns the single WebSocket and routes to handlers:**

```typescript
class EventBus {
  private transport: WebSocketTransport;
  private handlers: Map<string, ResourceHandler> = new Map();

  constructor(wsUrl: string) {
    this.transport = new WebSocketTransport();
    this.transport.onMessage(this.handleMessage);
    this.transport.connect(wsUrl);
  }

  private handleMessage = (msg: ServerMessage) => {
    if (msg.type === 'resource_updated') {
      const handler = this.handlers.get(msg.resourceType);
      if (handler) {
        const updated = handler.handleUpdate(msg.resourceId, msg.data);
        this.publish({ type: msg.resourceType, id: msg.resourceId }, updated);
      }
    }
  };

  registerHandler<T>(type: string, handler: ResourceHandler<T>): void {
    this.handlers.set(type, handler);
  }
}
```

### 3. ResourceEventBus (Server)

A central server-side event bus that broadcasts to connected clients.

**File**: `apps/ideate/server/src/services/ResourceEventBus.ts` (NEW)

```typescript
interface ResourceEvent {
  type: 'status_change' | 'metadata_update' | 'document_complete';
  resourceType: 'idea' | 'document' | 'thing';
  resourceId: string;
  ownerId: string;
  workspaceId?: string;
  data: Record<string, unknown>;
  timestamp: number;
}

class ResourceEventBus {
  // Emit an event - persists to DB and broadcasts to all relevant clients
  emit(event: ResourceEvent): void;

  // Get current state of a resource (for reconnecting clients)
  getResourceState(resourceType: string, resourceId: string): ResourceState | null;

  // Set broadcast handler (WorkspaceWebSocketHandler)
  setBroadcastHandler(handler: BroadcastHandler): void;
}
```

### 4. Document Metadata Extractor (Server)

When a Yjs document edit completes, extract structured metadata:

**File**: `apps/ideate/server/src/services/DocumentMetadataExtractor.ts` (NEW)

```typescript
interface ExtractedMetadata {
  title: string;
  summary: string;
  tags: string[];
}

function extractMetadataFromMarkdown(content: string): ExtractedMetadata {
  // Parse markdown to extract:
  // - Title from first # heading
  // - Summary from ## Summary section or first paragraph
  // - Tags from Tags: line
}
```

### 5. Enhanced Agent Service Pattern

All agents (Idea, Plan, Execution) follow same pattern:

```typescript
class AgentService {
  constructor(private eventBus: ResourceEventBus) {}

  async processMessage(...) {
    // 1. Emit status change: 'running'
    this.eventBus.emit({
      type: 'status_change',
      resourceType: 'idea',
      resourceId: ideaId,
      data: { agentStatus: 'running' }
    });

    // 2. Process message, write to Yjs
    await this.doWork(...);

    // 3. Extract metadata from completed document
    const metadata = extractMetadataFromMarkdown(documentContent);

    // 4. Emit metadata update (persists to DB + broadcasts)
    this.eventBus.emit({
      type: 'metadata_update',
      resourceType: 'idea',
      resourceId: ideaId,
      data: { title: metadata.title, summary: metadata.summary }
    });

    // 5. Emit status change: 'idle'
    this.eventBus.emit({
      type: 'status_change',
      resourceType: 'idea',
      resourceId: ideaId,
      data: { agentStatus: 'idle' }
    });
  }
}
```

### 6. Yjs Persistence Enhancement

Force flush document and extract metadata when agent completes:

**File**: `apps/ideate/server/src/websocket/YjsCollaborationHandler.ts` (MODIFY)

```typescript
// New method: Force flush and extract metadata
async flushAndExtractMetadata(roomName: string): Promise<ExtractedMetadata | null> {
  const room = this.rooms.get(roomName);
  if (!room) return null;

  // 1. Force persist immediately (bypass debounce)
  await this.persistDoc(room);

  // 2. Extract text content from Y.Text
  const content = room.text.toString();

  // 3. Parse and return metadata
  return extractMetadataFromMarkdown(content);
}
```

---

## Event Flow: New Idea Creation

```
1. User opens IdeaDialog for new idea
   └─▶ Client: useIdeaAgent connects to IdeaAgent WS
   └─▶ Client: useResourceSubscription subscribes to ideaId='new'

2. User sends first message
   └─▶ Client: IdeaDialog creates idea immediately (POST /api/ideas)
   └─▶ Server: Returns ideaId: 'abc-123'
   └─▶ Client: useResourceSubscription re-subscribes to ideaId='abc-123'
   └─▶ Client: useIdeaAgent sends message with new ideaId

3. Server: IdeaAgentService.processMessage()
   └─▶ eventBus.emit({ type: 'status_change', data: { agentStatus: 'running' } })
   └─▶ WorkspaceWebSocketHandler broadcasts to all subscribers
   └─▶ Client IdeaCard receives update, shows "Running"

4. User closes dialog
   └─▶ Client: IdeaDialog unmounts
   └─▶ Client: useIdeaAgent disconnects from agent WS
   └─▶ Client: IdeaCard still subscribed via useResourceSubscription
   └─▶ Server: Agent continues processing in background

5. Server: Agent finishes document
   └─▶ IdeaAgentService calls yjsHandler.flushAndExtractMetadata()
   └─▶ Returns: { title: 'Recipe Sharing', summary: 'A feature for...', tags: [...] }
   └─▶ IdeaService.update(ideaId, { title, summary, tags })
   └─▶ eventBus.emit({ type: 'metadata_update', data: { title, summary, tags } })
   └─▶ eventBus.emit({ type: 'status_change', data: { agentStatus: 'idle' } })

6. Client: IdeaCard receives updates
   └─▶ useResourceSubscription updates local state
   └─▶ Card re-renders with new title, summary, "Idle" status

7. User reopens dialog
   └─▶ IdeaDialog fetches full idea data
   └─▶ useIdeaAgent reconnects, replays queued messages
   └─▶ Shows complete chat history and updated document
```

---

## Implementation Plan

### Phase 1: Event Bus Package (packages/event-bus)

**1.1 Scaffold the package**
```bash
pnpm scaffold  # Select 'event-bus' as package name
```

**1.2 Implement core EventBus**
- File: `packages/event-bus/src/EventBus.ts`
- Reference counting for subscriptions
- Lazy provider activation
- Publish/subscribe pattern

**1.3 Implement React integration**
- File: `packages/event-bus/src/useResource.ts`
- Hook that wraps EventBus.subscribe
- Returns { data, isLoading, error }

**1.4 Write comprehensive tests**
- File: `packages/event-bus/src/EventBus.test.ts`
- Test ref counting, provider lifecycle, publish/subscribe

**1.5 Write README documentation**
- File: `packages/event-bus/README.md`
- API documentation, usage examples, architecture explanation

### Phase 2: Server Infrastructure

**2.1 Create ResourceEventBus (Server)**
- File: `apps/ideate/server/src/services/ResourceEventBus.ts`
- Emits events to WorkspaceWebSocketHandler
- Persists state changes to database

**2.2 Create DocumentMetadataExtractor**
- File: `apps/ideate/server/src/services/DocumentMetadataExtractor.ts`
- Parses markdown content to extract title, summary, tags

**2.3 Enhance YjsCollaborationHandler**
- File: `apps/ideate/server/src/websocket/YjsCollaborationHandler.ts`
- Add `flushAndExtractMetadata(roomName)` method

**2.4 Update IdeaAgentService**
- File: `apps/ideate/server/src/services/IdeaAgentService.ts`
- Emit status_change at start/end of processing
- Extract metadata and emit metadata_update after document complete

### Phase 3: Client Integration

**3.1 Create IdeaProvider**
- File: `apps/ideate/client/src/providers/IdeaProvider.ts`
- Implements ResourceProvider interface
- Handles WebSocket connection to server
- Caches idea state and publishes updates

**3.2 Set up EventBus in app**
- File: `apps/ideate/client/src/providers/eventBus.ts`
- Create singleton EventBus instance
- Register IdeaProvider

**3.3 Update IdeaCard to use event bus**
- File: `apps/ideate/client/src/components/IdeaCard/IdeaCard.tsx`
- Use `useResource('idea', ideaId)`
- Remove prop-based state management

**3.4 Update IdeaDialog to use event bus**
- File: `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx`
- Sync with external updates while open
- Show agent status on reconnect

### Phase 4: Cleanup

**4.1 Remove redundant subscription logic**
- ThingIdeas: Remove hardcoded `handleResourceUpdated`
- useWorkspaceSocket: Simplify (providers handle subscriptions)

**4.2 End-to-end testing**
- Test all success criteria scenarios
- Verify ref counting works correctly

---

## Files to Create/Modify

### New Package: packages/event-bus
1. `packages/event-bus/package.json`
2. `packages/event-bus/src/EventBus.ts`
3. `packages/event-bus/src/EventBus.test.ts`
4. `packages/event-bus/src/types.ts`
5. `packages/event-bus/src/Provider.ts`
6. `packages/event-bus/src/useResource.ts`
7. `packages/event-bus/src/index.ts`
8. `packages/event-bus/README.md`

### New Files (Server)
9. `apps/ideate/server/src/services/ResourceEventBus.ts`
10. `apps/ideate/server/src/services/DocumentMetadataExtractor.ts`

### New Files (Client)
11. `apps/ideate/client/src/providers/IdeaProvider.ts`
12. `apps/ideate/client/src/providers/eventBus.ts`

### Modified Files (Server)
13. `apps/ideate/server/src/websocket/YjsCollaborationHandler.ts` - Add flushAndExtractMetadata
14. `apps/ideate/server/src/services/IdeaAgentService.ts` - Integrate event bus, extract metadata
15. `apps/ideate/server/src/websocket/WorkspaceWebSocketHandler.ts` - Broadcast resource updates
16. `apps/ideate/server/src/index.ts` - Wire up ResourceEventBus

### Modified Files (Client)
17. `apps/ideate/client/src/components/IdeaCard/IdeaCard.tsx` - Use useResource hook
18. `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx` - Use useResource hook
19. `apps/ideate/client/src/components/Things/ThingIdeas.tsx` - Simplify, use event bus

---

## Design Decisions

1. **Summary text while working**: Empty/blank until agent completes and extracts summary from document
2. **Subscription level**: Per-card subscription - each component uses `useResource('idea', ideaId)`
3. **Documentation**: Create `apps/ideate/docs/plans/chat-update-flow.md` during implementation
4. **Event bus location**: Separate `packages/event-bus` package for reusability across apps
5. **Reference counting**: Client-side event bus manages subscriber counts, single network connection per resource
6. **Provider pattern**: Lazy-loaded providers activate only when first subscriber needs that resource type
7. **Delta sync**: Providers cache state and merge updates, enabling efficient sync across subscriber lifespans

---

## Success Criteria

1. **Create idea, send prompt, close dialog immediately**
   - Kanban card shows "Running"
   - Card summary is empty/blank (not "Processing...")

2. **Wait for agent to complete (dialog closed)**
   - Kanban card updates to show actual title from document
   - Kanban card updates to show actual summary from document
   - Kanban card shows "Idle"

3. **Reopen dialog after completion**
   - Chat history shows full conversation
   - Document shows generated content
   - No "working" indicator (agent is idle)

4. **Reopen dialog while still processing**
   - Working indicator shows above chat input
   - Can see streaming response continuing
   - Document updates in real-time

5. **Works without workspace**
   - All above scenarios work for ideas not in a workspace
   - Updates are user-scoped (only owner sees them)

---

## Additional Artifacts

During implementation, create:
- `apps/ideate/docs/plans/chat-update-flow.md` - Copy of this design document for reference

---

## packages/event-bus README (Draft)

# @claude-flow/event-bus

A client-side event bus for real-time resource synchronization with reference counting and lazy-loaded providers.

## Overview

This package provides a general-purpose event bus that enables UI components to subscribe to resource updates. Key features:

- **Reference counting**: Multiple UI components can subscribe to the same resource, but only one network connection is maintained
- **Lazy-loaded providers**: Data providers activate only when first subscription occurs
- **Current state on subscribe**: Subscribers immediately receive cached state
- **Delta sync**: Efficient updates across different subscriber lifespans

## Installation

```bash
pnpm add @claude-flow/event-bus
```

## Usage

### Basic Usage

```typescript
import { eventBus, useResource } from '@claude-flow/event-bus';

// In a React component
function IdeaCard({ ideaId }: { ideaId: string }) {
  const { data: idea, isLoading, error } = useResource<Idea>('idea', ideaId);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <Card>
      <h3>{idea?.title}</h3>
      <p>{idea?.summary}</p>
    </Card>
  );
}
```

### Creating a Provider

Providers are responsible for fetching data from the server and publishing updates to the bus.

```typescript
import { ResourceProvider, EventBus } from '@claude-flow/event-bus';

class IdeaProvider implements ResourceProvider<Idea> {
  private ws: WebSocket | null = null;
  private cache = new Map<string, Idea>();
  private bus: EventBus | null = null;
  private subscribedIds = new Set<string>();

  activate(bus: EventBus): void {
    this.bus = bus;
    this.ws = new WebSocket(WORKSPACE_WS_URL);
    this.ws.onmessage = this.handleMessage;
  }

  deactivate(): void {
    this.ws?.close();
    this.ws = null;
    this.cache.clear();
    this.subscribedIds.clear();
  }

  getState(id: string): Idea | null {
    return this.cache.get(id) ?? null;
  }

  subscribe(id: string): void {
    if (!this.subscribedIds.has(id)) {
      this.subscribedIds.add(id);
      // Tell server we want updates for this resource
      this.ws?.send(JSON.stringify({
        type: 'subscribe_resource',
        resourceType: 'idea',
        resourceId: id
      }));
    }
  }

  unsubscribe(id: string): void {
    this.subscribedIds.delete(id);
    this.ws?.send(JSON.stringify({
      type: 'unsubscribe_resource',
      resourceType: 'idea',
      resourceId: id
    }));
  }

  private handleMessage = (event: MessageEvent) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'resource_updated' && msg.resourceType === 'idea') {
      const existing = this.cache.get(msg.resourceId);
      const updated = { ...existing, ...msg.data } as Idea;
      this.cache.set(msg.resourceId, updated);
      this.bus?.publish({ type: 'idea', id: msg.resourceId }, updated);
    }
  };
}
```

### Registering Providers

```typescript
import { eventBus } from '@claude-flow/event-bus';
import { IdeaProvider } from './providers/IdeaProvider';

// Register providers at app initialization
eventBus.registerProvider('idea', new IdeaProvider());
eventBus.registerProvider('thing', new ThingProvider());
eventBus.registerProvider('document', new DocumentProvider());
```

## API Reference

### EventBus

```typescript
class EventBus {
  /**
   * Subscribe to a resource. Returns current state immediately
   * and fires callback on subsequent changes.
   * @param key - Resource type and ID
   * @param callback - Called with (newState, prevState) on changes
   * @returns Unsubscribe function
   */
  subscribe<T>(key: ResourceKey, callback: SubscriptionCallback<T>): () => void;

  /**
   * Register a provider for a resource type.
   * Provider is lazy-loaded - only activated when first subscription occurs.
   */
  registerProvider<T>(type: string, provider: ResourceProvider<T>): void;

  /**
   * Publish an update to all subscribers of a resource.
   * Called by providers when they receive data from server.
   */
  publish<T>(key: ResourceKey, state: T): void;

  /**
   * Get current subscriber count for a resource (for testing/debugging)
   */
  getSubscriberCount(key: ResourceKey): number;
}
```

### useResource Hook

```typescript
function useResource<T>(
  type: string,
  id: string | null,
  initialData?: T
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}
```

### ResourceProvider Interface

```typescript
interface ResourceProvider<T> {
  /** Called when first subscriber subscribes to this resource type */
  activate(bus: EventBus): void;

  /** Called when last subscriber unsubscribes from this resource type */
  deactivate(): void;

  /** Get current cached state for a resource */
  getState(id: string): T | null;

  /** Called when a new resource ID is subscribed (for server notifications) */
  subscribe?(id: string): void;

  /** Called when last subscriber unsubscribes from a resource ID */
  unsubscribe?(id: string): void;
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         EventBus                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ subscribers: Map<'type:id', Set<Callback>>                  │ │
│  │ refCounts: Map<'type:id', number>                          │ │
│  │ providers: Map<'type', Provider>                           │ │
│  │ activeProviders: Set<'type'>                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│         subscribe('idea', 'abc')                                │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. refCount['idea:abc']++ (1)                              │ │
│  │ 2. if (refCount == 1 && !active['idea']):                  │ │
│  │       providers['idea'].activate()                          │ │
│  │       activeProviders.add('idea')                           │ │
│  │ 3. providers['idea'].subscribe('abc')                       │ │
│  │ 4. callback(providers['idea'].getState('abc'))              │ │
│  │ 5. subscribers['idea:abc'].add(callback)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│         unsubscribe() (returned from subscribe)                 │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. subscribers['idea:abc'].delete(callback)                 │ │
│  │ 2. refCount['idea:abc']-- (0)                              │ │
│  │ 3. if (refCount == 0):                                      │ │
│  │       providers['idea'].unsubscribe('abc')                  │ │
│  │ 4. if (no 'idea' subscriptions remain):                     │ │
│  │       providers['idea'].deactivate()                        │ │
│  │       activeProviders.delete('idea')                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Testing

The package includes comprehensive tests for:

- Reference counting behavior
- Provider activation/deactivation lifecycle
- Multiple subscribers to same resource
- Subscriber callbacks receiving current state
- Cleanup on unsubscribe

```bash
cd packages/event-bus
pnpm test
```

## License

MIT
