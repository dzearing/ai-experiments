# External Integrations

**Analysis Date:** 2026-01-19

**Scope:** `/apps/ideate/` and `/packages/ui-kit/`

## APIs & External Services

### AI Services

**Anthropic Claude:**
- Purpose: AI-powered ideation, facilitation, planning, and execution agents
- SDKs:
  - `@anthropic-ai/claude-agent-sdk` - Primary SDK for agent functionality
  - `@anthropic-ai/claude-code` - Code-specific Claude integration
- Auth: Uses environment-based API key (managed by SDK)
- Services using Claude:
  - `FacilitatorService.ts` - AI facilitator for conversations
  - `IdeaAgentService.ts` - Idea generation and refinement
  - `PlanAgentService.ts` - Planning assistance
  - `ExecutionAgentService.ts` - Execution guidance
  - `ImportAgentService.ts` - Import processing
  - `JobOrchestrator.ts` - Job coordination

**Claude Integration Pattern:**
```typescript
// Common import pattern
import { query, type SDKAssistantMessage } from '@anthropic-ai/claude-agent-sdk';
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
```

**MCP Tools (Model Context Protocol):**
- `FacilitatorMcpTools.ts` - Facilitator-specific tools
- `IdeateMcpTools.ts` - Ideation tools
- `topicToolsMcp.ts` - Topic management tools
- `MCPToolsService.ts` - Central MCP tools service (55KB, extensive)

### Network Discovery

**mDNS/Bonjour:**
- Package: `bonjour-service` 1.2.1
- Purpose: Local network service discovery for LAN collaboration
- Location: `/apps/ideate/server/src/services/DiscoveryService.ts`
- Service type: `ideate`
- Service port: 3002
- Features:
  - Publishes service on local network
  - Discovers other Ideate instances
  - Broadcasts document availability

## Data Storage

### File System (Primary)

**Workspace Storage:**
- Location: `~/Ideate/workspaces/`
- Format: JSON metadata files (`{id}.meta.json`)
- Service: `/apps/ideate/server/src/services/WorkspaceService.ts`

**Document Storage:**
- Markdown files for documents
- Service: `/apps/ideate/server/src/services/DocumentService.ts`

**Yjs Persistence:**
- Server-side: `data/yjs-docs/` (configurable via `YjsCollaborationHandler`)
- Client-side: IndexedDB via `y-indexeddb`
- Debounced persistence (2000ms default)

### Client-Side Storage

**localStorage:**
- `ideate-user` - User authentication data
- `ideate-workspaces` - Workspace access data
- `ideate:current-workspace` - Current workspace ID
- `ideate:workspace-access` - Workspace access timestamps
- Model preference storage

**sessionStorage:**
- Session ID persistence
- Pending navigation state (`pendingOpenIdea`)

**IndexedDB:**
- Yjs document offline persistence (via `y-indexeddb`)
- Automatic sync when reconnected

### Databases

- **None** - Application uses file system storage
- In-memory session store for auth (see note in AuthService)

### File Storage

- Local filesystem only
- No cloud storage integration

### Caching

- In-memory session cache (server-side)
- React Context state caching (client-side)
- Yjs document caching (both sides)

## Authentication & Identity

### Current Implementation

**Nickname-based Auth:**
- Simple localStorage-based user identity
- Service: `/apps/ideate/server/src/services/AuthService.ts`
- No actual authentication verification
- Sessions stored in-memory Map

**Google OAuth (Stubbed):**
- Route exists: `POST /api/auth/google`
- Implementation: Mock only (returns demo user)
- Token validation: TODO (not implemented)

**Auth Flow:**
```typescript
// Current stub implementation
POST /api/auth/google { token } -> Session { sessionId, user, expiresAt }
GET /api/auth/me (Authorization: Bearer {sessionId}) -> User
POST /api/auth/logout
```

**Session Management:**
- 7-day session expiry (stubbed)
- Bearer token in Authorization header
- No JWT, no refresh tokens

### Collaboration Identity

- Session-based color assignment for cursors
- Username from auth context
- Awareness protocol for real-time presence

## Real-Time Communication

### WebSocket Endpoints

**Server:** `/apps/ideate/server/src/index.ts`

| Endpoint | Handler | Purpose |
|----------|---------|---------|
| `/yjs` | `YjsCollaborationHandler` | Yjs document sync (binary protocol) |
| `/diagnostics-ws` | `DiagnosticsHandler` | Server monitoring |
| `/claude-diagnostics-ws` | `ClaudeDiagnosticsHandler` | Claude session monitoring |
| `/chat-ws` | `ChatWebSocketHandler` | Chat room messaging |
| `/workspace-ws` | `WorkspaceWebSocketHandler` | Workspace updates |
| `/facilitator-ws` | `FacilitatorWebSocketHandler` | AI facilitator chat |
| `/idea-agent-ws` | `IdeaAgentWebSocketHandler` | Idea agent interactions |
| `/import-ws` | `ImportWebSocketHandler` | Import processing |
| `/plan-agent-ws` | `PlanAgentWebSocketHandler` | Planning agent |
| `/execution-agent-ws` | `ExecutionAgentWebSocketHandler` | Execution agent |

**Client Connections:**
- Config: `/apps/ideate/client/src/config.ts`
- WebSocket URL derived from window.location
- Automatic reconnection handling

### Event Bus

**ResourceEventBus:**
- Location: `/apps/ideate/server/src/services/resourceEventBus/`
- Purpose: Real-time resource update notifications
- Pattern: Pub/sub for workspace changes
- Consumers: `WorkspaceWebSocketHandler`

## Monitoring & Observability

### Error Tracking

- **None** - No Sentry, Bugsnag, or similar

### Logging

**Server-side:**
- `console.log/warn/error` with prefixes
- Structured logging for client logs via `/api/log`

**Client-side:**
- `createLogger` utility (`/apps/ideate/client/src/utils/clientLogger.ts`)
- Batched log shipping to server (500ms interval)
- `sendBeacon` on page unload

**Log Format:**
```
[Client HH:MM:SS.mmm] [Tag] Message {data}
```

### Diagnostics

- REST: `GET /api/diagnostics`
- WebSocket: `/diagnostics-ws` (real-time server state)
- WebSocket: `/claude-diagnostics-ws` (Claude session monitoring)
- Client page: `/diagnostics`

## CI/CD & Deployment

### Hosting

- **Not configured** - Local development only
- Expected: Static hosting for client, Node.js hosting for server

### CI Pipeline

- **None detected** - No GitHub Actions, CircleCI, etc.

### Build Commands

```bash
# Monorepo
pnpm build        # Build all packages (Lage orchestrated)
pnpm check        # Full CI check (format, build, test, lint)

# Ideate specific
pnpm build:v1     # Build V1 (not ideate-specific)
```

## Environment Configuration

### Required Environment Variables

**Server (`/apps/ideate/server/`):**
- `PORT` - Server port (default: 3002)
- `HOSTNAME` - Hostname for service discovery

**Client:**
- None required (uses Vite env injection)

### Secrets Location

- Not committed to repo
- Expected in `.env` files (gitignored)
- Anthropic API key managed by Claude SDK

## Webhooks & Callbacks

### Incoming

- None detected

### Outgoing

- None detected

## API Endpoints

### REST API (`/apps/ideate/server/`)

| Route | Purpose |
|-------|---------|
| `/api/auth/*` | Authentication |
| `/api/documents/*` | Document CRUD |
| `/api/workspaces/*` | Workspace management |
| `/api/chatrooms/*` | Chat room management |
| `/api/personas/*` | AI persona management |
| `/api/ideas/*` | Idea management |
| `/api/topics/*` | Topic management |
| `/api/fs/*` | File system operations |
| `/api/facts/*` | Facts/knowledge base |
| `/api/diagnostics/*` | Server diagnostics |
| `/api/session` | Session management |
| `/api/log` | Client log ingestion |
| `/health` | Health check |

### Client Proxy

Vite dev server proxies `/api` to `http://localhost:3002`

## Third-Party Service Status

| Service | Status | Notes |
|---------|--------|-------|
| Anthropic Claude | Integrated | Core AI functionality |
| Google OAuth | Stubbed | Mock implementation only |
| mDNS/Bonjour | Integrated | LAN discovery |
| External databases | None | File system only |
| Cloud storage | None | Local only |
| Error tracking | None | Console logging only |
| Analytics | None | Not implemented |

---

*Integration audit: 2026-01-19*
