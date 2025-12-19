# Ideate Server

Express v5 backend for the Ideate collaborative platform. Provides REST APIs, WebSocket-based real-time collaboration, and local network discovery.

## Architecture Overview

The server is a Node.js application using Express v5 with TypeScript. It provides:

- REST API for documents and authentication
- WebSocket server for real-time collaboration
- mDNS service discovery for local network sharing
- File-based document storage

## Technology Stack

- **Express v5** - Web framework
- **TypeScript** - Type safety
- **ws** - WebSocket library
- **bonjour-service** - mDNS/DNS-SD for service discovery
- **uuid** - Unique identifier generation
- **dotenv** - Environment configuration

## Project Structure

```
src/
├── index.ts                      # Application entry point
├── routes/
│   ├── auth.ts                   # Authentication endpoints
│   └── documents.ts              # Document CRUD endpoints
├── services/
│   ├── AuthService.ts            # Authentication logic
│   ├── DocumentService.ts        # Document persistence
│   └── DiscoveryService.ts       # mDNS network discovery
└── websocket/
    └── CollaborationHandler.ts   # Real-time collaboration
```

## Entry Point (`index.ts`)

Sets up the Express application with:

1. **Middleware**: CORS, JSON body parser (10MB limit)
2. **Routes**: Auth and documents REST APIs
3. **WebSocket**: Collaboration server on `/ws` path
4. **Discovery**: mDNS service advertisement
5. **Graceful Shutdown**: SIGTERM/SIGINT handlers

## REST API

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/google` | Exchange Google token for session |
| GET | `/me` | Get current authenticated user |
| POST | `/logout` | Invalidate session |

Authentication uses `Authorization: Bearer <sessionId>` header.

### Documents (`/api/documents`)

All endpoints require `x-user-id` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's documents |
| POST | `/` | Create new document |
| GET | `/:id` | Get document by ID |
| PATCH | `/:id` | Update document |
| DELETE | `/:id` | Delete document |
| POST | `/:id/share` | Generate share code |
| GET | `/:id/collaborators` | List document collaborators |

## Services

### AuthService

Handles user authentication and session management.

**Current Implementation:**
- Placeholder for Google OAuth token validation
- In-memory session storage

**Future:**
- Google OAuth integration
- JWT tokens
- Persistent session storage

### DocumentService

Manages document persistence using the file system.

**Storage Location:** `~/Ideate/documents/`

**File Structure:**
```
~/Ideate/documents/
├── <uuid>.md           # Document content (Markdown)
├── <uuid>.meta.json    # Document metadata
└── ...
```

**Metadata Schema:**
```typescript
interface DocumentMetadata {
  id: string;
  title: string;
  ownerId: string;
  collaboratorIds: string[];
  isPublic: boolean;
  shareCode?: string;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}
```

**Features:**
- CRUD operations with access control
- Owner-only delete permission
- Share code generation for public documents
- Listing by ownership or collaboration

### DiscoveryService

Enables peer-to-peer document discovery on local networks using mDNS (Bonjour/Avahi).

**Service Type:** `_ideate._tcp`

**Capabilities:**
- Publishes local Ideate instance on the network
- Browses for other Ideate instances
- Advertises public documents in service TXT records
- Automatic discovery of peer services

**Service Record:**
```
Name: Ideate-<hostname>
Type: _ideate._tcp
Port: 3002
TXT:
  version: 1.0.0
  hostname: <hostname>
  documentCount: <number>
  documents: [{"id": "...", "title": "..."}]
```

## WebSocket Collaboration

### Connection Flow

1. Client connects to `ws://localhost:3002/ws`
2. Server assigns unique client ID and color
3. Server sends `connected` message with client info
4. Client joins a document via `join` message
5. Client receives current document state and co-authors

### Message Types

**Client → Server:**

```typescript
// Join a document session
{ type: 'join', documentId: string, userId?: string, userName?: string, content?: string }

// Leave current document
{ type: 'leave' }

// Send edit operations
{ type: 'edit', edits: Array<{ from: number, to: number, insert: string }> }

// Update cursor position
{ type: 'cursor', cursorPosition: number, selectionStart: number, selectionEnd: number }
```

**Server → Client:**

```typescript
// Connection established
{ type: 'connected', clientId: string, color: string }

// Document state sync (on join)
{ type: 'sync', documentId: string, content: string, version: number, coAuthors: [...] }

// User joined/left document
{ type: 'presence', action: 'joined'|'left', userId: string, userName?: string, color?: string, clientId: string }

// Edit from another user
{ type: 'edit', edits: [...], version: number, clientId: string, userId: string, userName: string, color: string }

// Cursor update from another user
{ type: 'cursor', clientId: string, userId: string, userName: string, color: string, cursorPosition: number, selectionStart: number, selectionEnd: number }
```

### Collaboration Features

- **Session Management**: Documents have independent sessions with their own client lists
- **Edit Synchronization**: Edits are applied and broadcast to all session participants
- **Cursor Tracking**: Real-time cursor position and selection for each collaborator
- **Presence Tracking**: Join/leave notifications with user information
- **Color Assignment**: Each collaborator gets a unique color for identification

**Collaborator Colors:**
```
#FF6B6B (Red), #4ECDC4 (Teal), #45B7D1 (Blue), #96CEB4 (Green),
#FFEAA7 (Yellow), #DDA0DD (Plum), #98D8C8 (Mint), #F7DC6F (Gold)
```

## Configuration

Environment variables (via `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Server port |
| `CLIENT_URL` | `http://localhost:5174` | CORS allowed origin |
| `HOSTNAME` | `localhost` | mDNS service hostname |

## Development

```bash
# Start dev server (requires manual restart on changes)
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck
```

Default port: `3002`

## API Testing

```bash
# Health check
curl http://localhost:3002/health

# List documents (requires x-user-id header)
curl -H "x-user-id: user-1" http://localhost:3002/api/documents

# Create document
curl -X POST -H "Content-Type: application/json" -H "x-user-id: user-1" \
  -d '{"title": "New Document"}' \
  http://localhost:3002/api/documents

# WebSocket connection (using wscat)
wscat -c ws://localhost:3002/ws
> {"type":"join","documentId":"doc-1","userName":"Test User"}
```

## Future Features

### AI Agent Integration
- Claude Code SDK integration
- Agent session management
- Agent-initiated document edits

### Real-time Sync Improvements
- Operational Transformation (OT) or CRDTs for conflict resolution
- Version vector synchronization
- Offline support with sync queue

### Authentication
- Google OAuth implementation
- JWT token validation
- Refresh token rotation

### Work Item Tracking
- Task storage and API
- Priority/importance scoring
- Agent-generated work items

### Chat Sessions
- Per-document chat storage
- @mention notifications
- AI agent chat participation
