# Document Editing Architecture

This document explains how real-time collaborative editing works in Ideate using Yjs and related libraries.

## Overview

Ideate uses **Yjs** for conflict-free real-time collaboration. When multiple users edit the same document simultaneously, their changes are merged automatically without conflicts - even if they're editing offline.

### Key Libraries

| Library | Purpose |
|---------|---------|
| `yjs` | Core CRDT (Conflict-free Replicated Data Type) library |
| `y-websocket` | WebSocket provider for syncing Yjs documents |
| `y-codemirror.next` | Binds Yjs to CodeMirror 6 editor |
| `y-protocols` | Low-level sync and awareness protocols |

## What is a CRDT?

A **CRDT** (Conflict-free Replicated Data Type) is a data structure that can be replicated across multiple computers, edited independently, and merged automatically without conflicts.

Think of it like Google Docs - multiple people can type at the same time, and everyone sees a consistent result. But unlike Google Docs, CRDTs work **offline** too.

### How Yjs Works (Simplified)

1. Instead of storing plain text, Yjs stores a sequence of **operations** (insertions/deletions)
2. Each operation has a unique ID based on who made it and when
3. Operations can be applied in any order and still produce the same result
4. When two users type simultaneously, both operations are kept and merged

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌─────────────────┐    ┌────────────────────────┐  │
│  │  CodeMirror  │◄──►│  y-codemirror   │◄──►│        Y.Doc           │  │
│  │   Editor     │    │   (binding)     │    │   ┌──────────────┐     │  │
│  └──────────────┘    └─────────────────┘    │   │   Y.Text     │     │  │
│                                              │   │  'content'   │     │  │
│                                              │   └──────────────┘     │  │
│                                              │   ┌──────────────┐     │  │
│                                              │   │  Awareness   │     │  │
│                                              │   │(cursor, user)│     │  │
│                                              │   └──────────────┘     │  │
│                                              └───────────┬────────────┘  │
│                                                          │               │
│  ┌───────────────────────────────────────────────────────┴────────────┐  │
│  │                    WebsocketProvider (y-websocket)                  │  │
│  │         Syncs Y.Doc and Awareness over WebSocket                   │  │
│  └───────────────────────────────────────────────────────┬────────────┘  │
│                                                          │               │
└──────────────────────────────────────────────────────────┼───────────────┘
                                                           │
                                         WebSocket Connection
                                          ws://server/yjs/:roomId
                                                           │
┌──────────────────────────────────────────────────────────┼───────────────┐
│                              SERVER                       │               │
├──────────────────────────────────────────────────────────┼───────────────┤
│                                                          │               │
│  ┌───────────────────────────────────────────────────────┴────────────┐  │
│  │                    YjsCollaborationHandler                          │  │
│  │                                                                      │  │
│  │   ┌─────────────────────────────────────────────────────────────┐   │  │
│  │   │                         ROOMS                                │   │  │
│  │   │                                                              │   │  │
│  │   │  Room: "f87316ed-a9e0-442d-..."                              │   │  │
│  │   │  ┌──────────┐  ┌───────────┐  ┌─────────────────────────┐   │   │  │
│  │   │  │  Y.Doc   │  │ Awareness │  │ Clients: [ws1, ws2, ...]│   │   │  │
│  │   │  └──────────┘  └───────────┘  └─────────────────────────┘   │   │  │
│  │   │                                                              │   │  │
│  │   └─────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │   Responsibilities:                                                  │  │
│  │   - Relay updates between clients                                    │  │
│  │   - Persist Y.Doc state to .yjs files                               │  │
│  │   - Broadcast awareness (cursors) to all clients                    │  │
│  │   - Clean up empty rooms after 30 seconds                           │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    File System Storage                               │  │
│  │                                                                       │  │
│  │   ~/Ideate/documents/                                                │  │
│  │   ├── {id}.md           # Human-readable markdown                    │  │
│  │   └── {id}.meta.json    # Document metadata                          │  │
│  │                                                                       │  │
│  │   ~/Ideate/yjs-state/   (or server/data/yjs-docs/)                   │  │
│  │   └── {id}.yjs          # Binary CRDT state                          │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Y.Doc

The `Y.Doc` is the root container for all shared data. In Ideate, each document has one Y.Doc containing:

- **Y.Text('content')** - The shared text content (markdown)

```typescript
const doc = new Y.Doc();
const text = doc.getText('content');  // Get or create shared text
text.insert(0, 'Hello');              // Insert at position 0
```

### Y.Text

A shared text type that supports:
- Concurrent insertions/deletions
- Cursor positions
- Rich text attributes (though we use plain markdown)

### Awareness

**Awareness** is a lightweight protocol for sharing ephemeral state like:
- Cursor positions
- User names and colors
- Selection ranges
- "User is typing..." indicators

Unlike Y.Doc changes, awareness state is **not persisted** - it only exists while users are connected.

```typescript
awareness.setLocalStateField('user', {
  name: 'Alice',
  color: '#FF6B6B'
});

// See other users
awareness.getStates();  // Map<clientId, { user: { name, color }, cursor: {...} }>
```

### .yjs Files

The `.yjs` files store the **binary CRDT state** - the complete history of operations needed to reconstruct the document. This is different from the `.md` files which store human-readable markdown.

| File | Purpose | Format |
|------|---------|--------|
| `{id}.yjs` | CRDT state with full history | Binary (Yjs encoding) |
| `{id}.md` | Human-readable content | Plain text markdown |
| `{id}.meta.json` | Document metadata | JSON |

The `.yjs` file enables:
- Fast sync when reconnecting (only send missing operations)
- Offline editing (merge changes when back online)
- Full undo/redo history

## Flows

### 1. Creating a New Document

```
User clicks "New Document"
         │
         ▼
┌─────────────────────────────────┐
│  Client: POST /api/documents    │
│  { title: "My Document" }       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Server: DocumentService        │
│  1. Generate UUID               │
│  2. Create {id}.meta.json       │
│  3. Create {id}.md with         │
│     "# My Document\n\n"         │
│  4. Return document ID          │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Client: Navigate to            │
│  /documents/{id}                │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Client: useYjsCollaboration()  │
│  1. Create Y.Doc                │
│  2. Create WebsocketProvider    │
│  3. Connect to ws://server/yjs/{id}
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Server: YjsCollaborationHandler│
│  1. getOrCreateRoom(id)         │
│  2. No .yjs file exists         │
│  3. Load {id}.md content        │
│  4. Initialize Y.Text with md   │
│  5. Save initial .yjs state     │
│  6. Send sync step 1 to client  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Client receives sync           │
│  1. Apply server state to Y.Doc │
│  2. y-codemirror updates editor │
│  3. User sees "# My Document"   │
└─────────────────────────────────┘
```

### 2. Making an Edit (Single User)

```
User types "Hello" in editor
         │
         ▼
┌─────────────────────────────────┐
│  CodeMirror: Text change event  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  y-codemirror: Translates to    │
│  Y.Text operations              │
│  text.insert(pos, "Hello")      │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Y.Doc: Generates update        │
│  (binary diff of operations)    │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  WebsocketProvider: Sends       │
│  update to server               │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Server: Receives update        │
│  1. Apply to server's Y.Doc     │
│  2. Broadcast to other clients  │
│  3. Schedule persist (debounced)│
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Server: Persist (after 5s)     │
│  1. Encode Y.Doc state          │
│  2. Write to {id}.yjs           │
└─────────────────────────────────┘
```

### 3. Co-author Makes an Edit

```
       Alice (Client 1)                    Bob (Client 2)
            │                                   │
            │                                   │
            ▼                                   ▼
    ┌───────────────┐                   ┌───────────────┐
    │ Types "Hello" │                   │ Types "World" │
    │ at position 0 │                   │ at position 0 │
    └───────────────┘                   └───────────────┘
            │                                   │
            │         ┌─────────────┐           │
            └────────►│   SERVER    │◄──────────┘
                      │             │
                      │ Receives:   │
                      │ - Alice's   │
                      │   update    │
                      │ - Bob's     │
                      │   update    │
                      │             │
                      │ Broadcasts: │
                      │ - To Alice: │
                      │   Bob's op  │
                      │ - To Bob:   │
                      │   Alice's op│
                      └─────────────┘
                           │  │
              ┌────────────┘  └────────────┐
              ▼                            ▼
    ┌───────────────┐                ┌───────────────┐
    │ Alice's Y.Doc │                │ Bob's Y.Doc   │
    │ applies Bob's │                │ applies       │
    │ operation     │                │ Alice's op    │
    └───────────────┘                └───────────────┘
              │                            │
              ▼                            ▼
    ┌───────────────┐                ┌───────────────┐
    │ Both see:     │                │ Both see:     │
    │ "HelloWorld"  │                │ "HelloWorld"  │
    │ or            │                │ or            │
    │ "WorldHello"  │                │ "WorldHello"  │
    │               │                │               │
    │ (CRDT ensures │                │ (same result  │
    │ same result)  │                │ on both)      │
    └───────────────┘                └───────────────┘
```

**Key Point**: Even though Alice and Bob both typed at position 0, the CRDT ensures they see the **same final result**. The order depends on the unique operation IDs (typically whoever's operation has the "lower" ID goes first).

### 4. Awareness (Cursor Sync)

```
Alice moves cursor to position 42
         │
         ▼
┌─────────────────────────────────┐
│  y-codemirror detects cursor    │
│  position change                │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Awareness: setLocalStateField  │
│  { cursor: { anchor: 42 } }     │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  WebsocketProvider: Sends       │
│  awareness update               │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Server: Broadcasts to all      │
│  OTHER clients in the room      │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Bob's client receives          │
│  awareness update               │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  y-codemirror renders Alice's   │
│  cursor with her name/color     │
└─────────────────────────────────┘
```

## Server Room Lifecycle

```
                    ┌──────────────────┐
                    │   No Room        │
                    │   (document      │
                    │    exists on     │
                    │    disk only)    │
                    └────────┬─────────┘
                             │
                    First client connects
                             │
                             ▼
                    ┌──────────────────┐
                    │  Room Created    │
                    │  - Y.Doc loaded  │
                    │  - .yjs loaded   │
                    │    (or init from │
                    │     .md)         │
                    └────────┬─────────┘
                             │
                    Client joins room
                             │
                             ▼
                    ┌──────────────────┐
        ┌──────────│  Room Active     │◄──────────┐
        │          │  - clients > 0   │           │
        │          │  - sync running  │           │
        │          └────────┬─────────┘           │
        │                   │                     │
   More clients        Last client              Client
   connect              disconnects            reconnects
        │                   │                   (within 30s)
        │                   ▼                     │
        │          ┌──────────────────┐           │
        └─────────►│  Room Empty      │───────────┘
                   │  - clients = 0   │
                   │  - 30s countdown │
                   └────────┬─────────┘
                            │
                   30 seconds pass
                   (no reconnections)
                            │
                            ▼
                   ┌──────────────────┐
                   │  Room Destroyed  │
                   │  - .yjs persisted│
                   │  - Memory freed  │
                   └──────────────────┘
```

## Sync Protocol

When a client connects, Yjs uses a 2-step sync protocol:

### Step 1: Server → Client
Server sends its **state vector** (a summary of what operations it has)

### Step 2: Client → Server
Client compares state vectors and sends only the operations the server is missing

This is highly efficient - if you reconnect after being offline, only your new changes are sent, not the entire document.

## Why Two File Formats?

| `.yjs` (Binary CRDT) | `.md` (Markdown) |
|---------------------|------------------|
| Used for sync | Human-readable backup |
| Contains full history | Current content only |
| Enables efficient reconnection | Can be edited manually |
| Required for real-time collab | Optional, for compatibility |

The server syncs `.md` from `.yjs` periodically so you always have a readable backup.

## Common Scenarios

### Offline Editing
1. User edits while disconnected
2. Operations stored in local Y.Doc
3. When reconnecting, sync protocol exchanges missing operations
4. All changes merged automatically

### Conflicting Edits
1. Two users edit same line simultaneously
2. Both operations have unique IDs
3. CRDT algorithm deterministically orders them
4. Both users see identical final result

### Late Joiner
1. New user opens document with 2 existing editors
2. Server sends full Y.Doc state (sync step 1)
3. New user's Y.Doc applies state
4. Server sends awareness for existing cursors
5. New user sees document + other cursors

## Files Reference

### Client
- `src/hooks/useYjsCollaboration.ts` - Main hook for Yjs integration
- `src/pages/DocumentEditor.tsx` - Editor component using the hook

### Server
- `src/websocket/YjsCollaborationHandler.ts` - WebSocket handler for Yjs
- `src/services/DocumentService.ts` - Document CRUD + Yjs state management

### Storage
- `~/Ideate/documents/{id}.md` - Markdown content
- `~/Ideate/documents/{id}.meta.json` - Metadata
- `server/data/yjs-docs/{id}.yjs` - Binary CRDT state
