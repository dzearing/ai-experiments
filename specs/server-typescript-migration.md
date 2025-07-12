# Server TypeScript Migration & Architecture Redesign

## Executive Summary

The current Claude Flow server is a monolithic Node.js application written in JavaScript with significant architectural limitations. This document outlines a comprehensive plan to migrate the server to TypeScript with a modern, modular architecture that enables parallel development, improves maintainability, and provides robust real-time capabilities.

### Current State
- **9,000+ lines** of JavaScript code
- **5,355 lines** in a single `index.js` file
- **54+ API routes** mixed with business logic
- **File-based persistence** using JSON files
- **Limited real-time** capabilities via SSE
- **No unit tests** for most modules
- **Tight coupling** between components

### Target State
- **100% TypeScript** with strict mode
- **Modular architecture** with clear boundaries
- **SQLite database** with TypeORM for persistence
- **uWebSockets.js** for ultra-fast real-time communication
- **80%+ test coverage** with comprehensive unit tests
- **500 lines max** per file with single responsibility
- **Dependency injection** for loose coupling
- **Zero client bundle overhead** with native WebSocket

### Migration Strategy
- **6-phase migration** over 8-10 weeks
- **5+ parallel workstreams** for independent modules
- **Zero-downtime** migration with backwards compatibility
- **Incremental rollout** with feature flags

## Current Architecture Analysis

### File Structure
```
server/
├── index.js              # 5,355 lines - Monolithic entry point
├── claudeService.js      # 1,186 lines - Claude AI integration
├── sessionManager.js     #   290 lines - Session persistence
├── subscriptionManager.js #   307 lines - SSE subscriptions
├── feedbackHandler.js    #   210 lines - Feedback system
├── claudeflowSettings.js #   190 lines - Project settings
├── logger.js            #   167 lines - Logging utilities
├── paths.js             #    87 lines - Path configuration
└── mockServer.js        #   231 lines - Mock server for testing
```

### API Routes (54+ endpoints)
1. **Health & SSE**: 
   - `/api/health` - Server health check
   - `/api/sse/subscribe` - Server-sent events for real-time updates

2. **Authentication**: 
   - `/api/auth/github/*` (login, token, logout, accounts, verify)
   - GitHub OAuth flow and token management

3. **Claude AI Integration**: 
   - `/api/claude/debug` - Debug Claude responses
   - `/api/claude/process-idea` - Process work item ideas with AI
   - `/api/claude/refine-tasks` - Refine task descriptions
   - `/api/claude/code/*` - Claude Code chat sessions:
     - `start` - Start new chat session
     - `message` - Send message to Claude
     - `stream` - SSE endpoint for streaming responses
     - `cancel` - Cancel ongoing request
     - `end` - End chat session
   - `/api/claude/analyze-document` - Analyze uploaded documents
   - `/api/claude/analyze-work-item` - Analyze specific work item

4. **Workspace Management**: 
   - `/api/workspace/exists` - Check if workspace exists
   - `/api/workspace/read` - Read workspace data
   - `/api/workspace/reload` - Reload workspace from disk
   - `/api/browse/*` - Browse workspace directories

5. **Projects (CRUD)**:
   - `/api/projects` - GET (list), POST (create)
   - `/api/projects/:id` - GET (read), PUT (update), DELETE (delete)
   - `/api/projects/:id/hide` - Hide project
   - `/api/projects/:id/settings` - Manage project settings

6. **Work Items (CRUD)**:
   - `/api/work-items` - GET (list), POST (create)
   - `/api/work-items/:id` - GET (read), PUT (update), DELETE (delete)
   - `/api/work-items/:id/move` - Move between statuses

7. **Personas (CRUD)**:
   - `/api/personas` - GET (list), POST (create)
   - `/api/personas/:id` - GET (read), PUT (update), DELETE (delete)

8. **Repository Management**: 
   - `/api/repos/:projectPath/:repoName/status` - Git status
   - `/api/repos/:projectPath/:repoName/clone` - Clone repository
   - `/api/repos/:projectPath/:repoName/rebase` - Rebase branch
   - `/api/repos/:projectPath/:repoName/reset` - Reset changes
   - `/api/repos/:projectPath/:repoName` - DELETE repository

9. **Feedback System**: 
   - `/api/feedback/screenshot` - Upload screenshot
   - `/api/feedback/submit` - Submit feedback report

10. **GitHub Proxy**: 
    - `/api/github/proxy` - Proxy requests to GitHub API with authentication
    - Used for fetching repos, issues, PRs without exposing tokens to client

### Key Pain Points

#### 1. Monolithic Structure
- All routes defined in single file
- Business logic intertwined with HTTP handling
- Difficult to test individual components
- High risk of regression with changes

#### 2. Type Safety
- No TypeScript means runtime errors
- API contracts not enforced
- Difficult refactoring
- Poor IDE support

#### 3. Data Persistence
- JSON files cause race conditions
- No ACID transactions
- No query capabilities
- Performance issues with large datasets

#### 4. Real-time Communication
- SSE is unidirectional
- No reconnection logic
- Limited event types
- Manual subscription management

#### 5. Testing
- Minimal test coverage
- No unit tests for routes
- Integration tests only
- No performance benchmarks

#### 6. Scalability
- In-memory state limits horizontal scaling
- File I/O bottlenecks
- No caching strategy
- Synchronous operations

## Target Architecture Design

### Core Principles
1. **Type Safety First**: Full TypeScript with strict mode
2. **Modular Design**: Clear separation of concerns
3. **Testability**: Dependency injection and mocking
4. **Performance**: Async operations and caching
5. **Observability**: Comprehensive logging and metrics
6. **Real-time**: Bidirectional WebSocket communication
7. **Persistence**: Proper database with transactions

### Technology Stack

#### Core Framework
- **TypeScript 5.3+**: With strict mode and ES2022 target
- **Node.js 20+**: LTS version for stability
- **Express.js 5+**: Web framework (already in use)

#### Data Layer
- **SQLite**: Embedded database for simplicity
- **TypeORM**: Type-safe ORM with migrations
- **Redis** (optional): For caching and pub/sub

#### Real-time Communication
- **uWebSockets.js**: Ultra-fast C++ WebSocket server
  - 10-15x faster than Socket.io
  - 10x lower memory usage
  - Built-in pub/sub and routing
  - Zero-copy performance
  - HTTP/WebSocket on same port
- **Native WebSocket**: Zero bundle overhead on client
- **MessagePack**: Binary protocol (50-70% smaller than JSON)
- **Custom Reconnection**: Minimal client-side logic (~2KB)

#### Testing & Quality
- **Jest**: Unit and integration testing
- **Supertest**: HTTP endpoint testing
- **TypeScript ESLint**: Code quality
- **Prettier**: Code formatting

#### Infrastructure
- **TSyringe**: Dependency injection
- **Winston**: Structured logging
- **Joi**: Input validation
- **Helmet**: Security middleware

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   REST API   │  │  WebSocket   │  │  Authentication  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐            │
│  │   Claude   │  │  Project   │  │ Workspace │            │
│  │  Service   │  │  Service   │  │  Service  │            │
│  └────────────┘  └────────────┘  └───────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐            │
│  │ Repository │  │  Session   │  │ Feedback  │            │
│  │  Service   │  │  Service   │  │  Service  │            │
│  └────────────┘  └────────────┘  └───────────┘            │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐            │
│  │ Repository │  │   Entity   │  │   Query   │            │
│  │  Pattern   │  │  Managers  │  │  Builders │            │
│  └────────────┘  └────────────┘  └───────────┘            │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐            │
│  │  Database  │  │   Cache    │  │  Message  │            │
│  │  (SQLite)  │  │  (Redis)   │  │   Queue   │            │
│  └────────────┘  └────────────┘  └───────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Module Breakdown

### Module 1: Core Infrastructure (Agent 1)
**Estimated effort**: 2 weeks

#### Responsibilities
- Database setup and migrations
- Dependency injection configuration
- Base repository patterns
- Common utilities and types
- Error handling middleware
- Logging infrastructure

#### Key Components
```typescript
// src/infrastructure/database/
├── entities/          # TypeORM entities
├── migrations/        # Database migrations
├── repositories/      # Base repository classes
└── databaseModule.ts  # Database configuration

// src/infrastructure/core/
├── container.ts       # DI container setup
├── logger.ts         # Winston logger
├── errors.ts         # Custom error classes
└── validators.ts     # Joi validators
```

#### Deliverables
- Database schema and entities
- Migration scripts
- Base repository with CRUD operations
- Configured DI container
- Logging service
- Error handling middleware

### Module 2: Authentication & Security (Agent 2)
**Estimated effort**: 1.5 weeks

#### Responsibilities
- GitHub OAuth integration
- JWT token management
- Session handling
- Permission middleware
- Security headers

#### Key Components
```typescript
// src/modules/auth/
├── controllers/
│   └── authController.ts
├── services/
│   ├── authService.ts
│   ├── githubService.ts
│   └── tokenService.ts
├── middleware/
│   ├── authenticate.ts
│   └── authorize.ts
├── entities/
│   ├── user.ts
│   └── session.ts
└── authModule.ts
```

#### Deliverables
- OAuth flow implementation
- JWT token generation/validation
- Session persistence in database
- Authentication middleware
- User management APIs

### Module 3: Claude Integration (Agent 3)
**Estimated effort**: 2 weeks

#### Responsibilities
- Claude AI service wrapper
- Message streaming
- Tool execution handling
- Token counting
- Rate limiting

#### Key Components
```typescript
// src/modules/claude/
├── controllers/
│   └── claudeController.ts
├── services/
│   ├── claudeService.ts
│   ├── streamingService.ts
│   └── toolExecutorService.ts
├── entities/
│   ├── conversation.ts
│   ├── message.ts
│   └── toolExecution.ts
├── websocket/
│   └── claudeGateway.ts
└── claudeModule.ts
```

#### Deliverables
- Claude API integration
- WebSocket streaming
- Message persistence
- Tool execution framework
- Token usage tracking

### Module 4: Project Management (Agent 4)
**Estimated effort**: 2 weeks

#### Responsibilities
- Workspace reloading and browsing
- Project CRUD operations
- Work item CRUD operations
- Persona CRUD operations
- Repository operations (clone, status, reset, etc.)
- Settings management

#### Key Components
```typescript
// src/modules/project/
├── controllers/
│   ├── workspaceController.ts     # Reload, browse operations
│   ├── projectController.ts       # Full CRUD
│   ├── workItemController.ts      # Full CRUD
│   ├── personaController.ts       # Full CRUD
│   └── repositoryController.ts    # Git operations
├── services/
│   ├── workspaceService.ts        # Workspace scanning
│   ├── projectService.ts          # Project business logic
│   ├── workItemService.ts         # Work item management
│   ├── personaService.ts          # Persona management
│   ├── repositoryService.ts       # Repository management
│   └── gitService.ts              # Git command wrapper
├── entities/
│   ├── project.ts
│   ├── workItem.ts
│   ├── persona.ts
│   └── repository.ts
└── projectModule.ts
```

#### Deliverables
- Workspace reload and directory browsing
- Project CRUD with settings management
- Work item CRUD with status transitions
- Persona CRUD for AI agent definitions
- Git repository operations (clone, status, reset, rebase)
- Project-specific settings persistence

### Module 5: Real-time Communication (Agent 5)
**Estimated effort**: 1.5 weeks

#### Responsibilities
- uWebSockets.js server setup
- High-performance message routing
- Subscription management
- Connection pooling
- Binary protocol handling

#### Key Components
```typescript
// src/modules/realtime/
├── server/
│   ├── websocketServer.ts      # uWS server setup
│   ├── connectionPool.ts       # Connection management
│   └── messageRouter.ts        # Message routing logic
├── protocol/
│   ├── messageTypes.ts         # Protocol definitions
│   ├── encoder.ts              # MessagePack encoding
│   └── decoder.ts              # MessagePack decoding
├── services/
│   ├── broadcastService.ts     # Efficient broadcasting
│   ├── subscriptionService.ts  # Topic subscriptions
│   └── presenceService.ts      # User presence tracking
└── realtimeModule.ts
```

#### Deliverables
- uWebSockets.js server with 150K+ msg/sec capacity
- Binary message protocol with MessagePack
- Topic-based pub/sub system
- Connection pooling for 10K+ concurrent clients
- Presence tracking with minimal overhead

## WebSocket Protocol Design

### Message Format
All messages use MessagePack binary encoding for minimal overhead:

```typescript
// Base message structure
interface WSMessage {
  id?: string;        // Optional request ID for req/response tracking
  type: MessageType;  // Message type enum
  topic?: string;     // Topic for pub/sub
  payload?: any;      // Message payload
  error?: WSError;    // Error info if applicable
}

enum MessageType {
  // Client -> Server
  SUBSCRIBE = 1,
  UNSUBSCRIBE = 2,
  PUBLISH = 3,
  REQUEST = 4,
  
  // Server -> Client
  EVENT = 10,
  RESPONSE = 11,
  ERROR = 12,
  
  // Bidirectional
  PING = 20,
  PONG = 21,
}
```

### Server Implementation (uWebSockets.js)

```typescript
// src/modules/realtime/server/websocketServer.ts
import uWS from 'uWebSockets.js';
import { encode, decode } from '@msgpack/msgpack';

interface Client {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  isAlive: boolean;
}

export class WebSocketServer {
  private app: uWS.App;
  private clients = new Map<uWS.WebSocket, Client>();
  private topics = new Map<string, Set<uWS.WebSocket>>();
  
  constructor(private port: number) {
    this.app = uWS.App();
    this.setupRoutes();
  }
  
  private setupRoutes() {
    this.app.ws('/*', {
      // Optimize for performance
      compression: uWS.DEDICATED_COMPRESSOR_3KB,
      maxPayloadLength: 16 * 1024 * 1024, // 16MB
      idleTimeout: 60,
      
      open: (ws) => {
        const client: Client = {
          id: this.generateId(),
          subscriptions: new Set(),
          isAlive: true,
        };
        this.clients.set(ws, client);
        
        // Send welcome message
        this.sendToClient(ws, {
          type: MessageType.EVENT,
          topic: 'system',
          payload: { event: 'connected', clientId: client.id }
        });
      },
      
      message: (ws, message, isBinary) => {
        if (!isBinary) return; // Only accept binary
        
        try {
          const data = decode(new Uint8Array(message)) as WSMessage;
          this.handleMessage(ws, data);
        } catch (error) {
          this.sendError(ws, 'Invalid message format');
        }
      },
      
      close: (ws) => {
        const client = this.clients.get(ws);
        if (client) {
          // Unsubscribe from all topics
          client.subscriptions.forEach(topic => {
            const subs = this.topics.get(topic);
            if (subs) {
              subs.delete(ws);
              if (subs.size === 0) {
                this.topics.delete(topic);
              }
            }
          });
          this.clients.delete(ws);
        }
      },
      
      pong: (ws) => {
        const client = this.clients.get(ws);
        if (client) {
          client.isAlive = true;
        }
      }
    });
  }
  
  private handleMessage(ws: uWS.WebSocket, msg: WSMessage) {
    const client = this.clients.get(ws);
    if (!client) return;
    
    switch (msg.type) {
      case MessageType.SUBSCRIBE:
        this.handleSubscribe(ws, client, msg.topic!);
        break;
        
      case MessageType.UNSUBSCRIBE:
        this.handleUnsubscribe(ws, client, msg.topic!);
        break;
        
      case MessageType.PUBLISH:
        this.handlePublish(ws, msg.topic!, msg.payload);
        break;
        
      case MessageType.REQUEST:
        this.handleRequest(ws, msg);
        break;
        
      case MessageType.PING:
        this.sendToClient(ws, { type: MessageType.PONG });
        break;
    }
  }
  
  broadcast(topic: string, payload: any) {
    const subscribers = this.topics.get(topic);
    if (!subscribers || subscribers.size === 0) return;
    
    const message = encode({
      type: MessageType.EVENT,
      topic,
      payload
    });
    
    // Ultra-fast broadcasting
    subscribers.forEach(ws => {
      ws.send(message, true);
    });
  }
  
  listen() {
    this.app.listen(this.port, (listenSocket) => {
      if (listenSocket) {
        console.log(`WebSocket server listening on port ${this.port}`);
        this.startHeartbeat();
      }
    });
  }
}
```

## Client Integration Changes

### Observable Data Bus Pattern

#### Purpose and Benefits

The data bus pattern serves as a **centralized state management system** that bridges REST APIs and WebSocket real-time updates. It solves several key problems:

1. **Unified Data Access**: Components don't need to know whether data comes from REST or WebSocket
2. **Automatic Caching**: Prevents redundant API calls when data is already available
3. **Real-time Synchronization**: Automatically updates all subscribers when data changes
4. **Lazy Loading**: Data is only fetched when actually needed
5. **Optimistic Updates**: Can apply changes locally before server confirmation

#### How It Works

```typescript
// src/client/data-bus/data-bus.ts
export class DataBus {
  private cache = new Map<string, CacheEntry<any>>();
  private providers = new Map<string, DataProvider<any>>();
  private subscribers = new Map<string, Set<Subscriber<any>>>();
  
  // Register a data provider for a key pattern
  provide<T>(pattern: string, provider: DataProvider<T>) {
    this.providers.set(pattern, provider);
  }
  
  // Request data - returns cached if valid, otherwise fetches
  async request<T>(key: string): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && !this.isCacheExpired(cached)) {
      return cached.data;
    }
    
    // Find matching provider
    const provider = this.findProvider(key);
    if (!provider) {
      throw new Error(`No provider for key: ${key}`);
    }
    
    // Fetch fresh data
    const data = await provider.fetch(key);
    this.updateCache(key, data);
    
    // Setup real-time subscription if provider supports it
    if (provider.subscribe) {
      provider.subscribe(key, (newData) => {
        this.updateCache(key, newData);
        this.notifySubscribers(key, newData);
      });
    }
    
    return data;
  }
  
  // Subscribe to data changes
  subscribe<T>(key: string, callback: (data: T) => void): Unsubscribe {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
      // Trigger initial fetch if needed
      this.request(key).then(data => callback(data));
    }
    
    this.subscribers.get(key)!.add(callback);
    
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(key);
          // Clean up provider subscription
          this.cleanupProviderSubscription(key);
        }
      }
    };
  }
}

// Example provider for projects
class ProjectProvider implements DataProvider<Project> {
  constructor(
    private api: ApiClient,
    private websocket: ReconnectingWebSocket
  ) {}
  
  async fetch(key: string): Promise<Project> {
    const projectId = this.extractId(key);
    return this.api.get(`/api/projects/${projectId}`);
  }
  
  subscribe(key: string, callback: (data: Project) => void): Unsubscribe {
    const projectId = this.extractId(key);
    return this.websocket.subscribe(`project:${projectId}`, callback);
  }
  
  cache = {
    ttl: 5 * 60 * 1000, // 5 minutes
    strategy: 'time-based'
  };
}
```

#### Integration with React

```typescript
// src/client/hooks/useDataBus.ts
export function useDataBus<T>(key: string): {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [state, setState] = useState<DataBusState<T>>({
    data: dataBus.get(key),
    loading: !dataBus.get(key),
    error: null
  });
  
  useEffect(() => {
    let mounted = true;
    
    // Subscribe to changes
    const unsubscribe = dataBus.subscribe<T>(key, (data) => {
      if (mounted) {
        setState({ data, loading: false, error: null });
      }
    });
    
    // Initial fetch if not cached
    if (!state.data) {
      dataBus.request<T>(key)
        .then(data => {
          if (mounted) {
            setState({ data, loading: false, error: null });
          }
        })
        .catch(error => {
          if (mounted) {
            setState({ data: undefined, loading: false, error });
          }
        });
    }
    
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [key]);
  
  const refetch = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    dataBus.invalidate(key);
    dataBus.request<T>(key);
  }, [key]);
  
  return { ...state, refetch };
}
```

#### Real-World Usage Example

```typescript
// In a React component
function ProjectDashboard({ projectId }: Props) {
  // Automatically fetches via REST and subscribes to WebSocket updates
  const { data: project, loading } = useDataBus<Project>(`project:${projectId}`);
  const { data: workItems } = useDataBus<WorkItem[]>(`project:${projectId}:work-items`);
  const { data: repoStatus } = useDataBus<RepoStatus>(`repo-status:${projectId}`);
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      <h1>{project.name}</h1>
      <WorkItemList items={workItems} />
      <RepoStatusWidget status={repoStatus} />
    </div>
  );
}

// When a work item is created elsewhere
async function createWorkItem(projectId: string, data: CreateWorkItemDto) {
  // Optimistic update
  dataBus.optimisticUpdate(`project:${projectId}:work-items`, (items) => 
    [...items, { ...data, id: 'temp-id', status: 'creating' }]
  );
  
  try {
    const newItem = await api.post(`/api/work-items`, data);
    // Real update comes via WebSocket automatically
  } catch (error) {
    // Rollback optimistic update
    dataBus.rollback(`project:${projectId}:work-items`);
    throw error;
  }
}
```

#### Key Implementation Details

1. **Provider Registration**: Providers are registered once at app startup
2. **Key Patterns**: Use consistent patterns like `entity:id` or `entity:id:relation`
3. **Cache Strategies**: Time-based, version-based, or manual invalidation
4. **Error Handling**: Graceful fallbacks and retry logic
5. **Memory Management**: Automatic cleanup when no subscribers

### WebSocket Client (Zero Bundle Overhead)

```typescript
// src/client/websocket/reconnecting-websocket.ts
import { encode, decode } from '@msgpack/msgpack';

export class ReconnectingWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectInterval = 1000;
  private messageQueue: Uint8Array[] = [];
  private subscriptions = new Map<string, Set<(data: any) => void>>();
  
  constructor(private url: string) {
    this.connect();
  }
  
  private connect() {
    this.ws = new WebSocket(this.url);
    this.ws.binaryType = 'arraybuffer';
    
    this.ws.onopen = () => {
      this.reconnectInterval = 1000;
      this.reconnectTimer = null;
      // Send queued messages
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift()!;
        this.ws!.send(msg);
      }
      // Resubscribe to all topics
      this.subscriptions.forEach((_, topic) => {
        this.send({ type: 'subscribe', topic });
      });
    };
    
    this.ws.onmessage = (event) => {
      const data = decode(new Uint8Array(event.data)) as any;
      if (data.topic && this.subscriptions.has(data.topic)) {
        this.subscriptions.get(data.topic)!.forEach(cb => cb(data.payload));
      }
    };
    
    this.ws.onclose = () => {
      this.scheduleReconnect();
    };
  }
  
  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectInterval = Math.min(30000, this.reconnectInterval * 2);
        this.connect();
      }, this.reconnectInterval);
    }
  }
  
  subscribe(topic: string, callback: (data: any) => void) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
      this.send({ type: 'subscribe', topic });
    }
    this.subscriptions.get(topic)!.add(callback);
    
    return () => {
      const subs = this.subscriptions.get(topic);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscriptions.delete(topic);
          this.send({ type: 'unsubscribe', topic });
        }
      }
    };
  }
  
  send(data: any) {
    const encoded = encode(data);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(encoded);
    } else {
      this.messageQueue.push(encoded);
    }
  }
}
```

### Data Flow Architecture

The complete data flow shows how REST, WebSocket, and the data bus work together:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           React Components                            │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐              │
│  │ ProjectList │  │ WorkItemView │  │ ClaudeCodeChat│              │
│  └──────┬──────┘  └───────┬──────┘  └───────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
│                     useDataBus Hook                                   │
└─────────────────────────────┬─────────────────────────────────────────┘
                              │
┌─────────────────────────────┴─────────────────────────────────────────┐
│                         Data Bus Layer                                 │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Cache Management  │  Provider Registry  │  Subscription Manager│  │
│  └────────────────────────────────────────────────────────────────┘  │
│           │                      │                      │              │
│  ┌────────┴──────┐     ┌────────┴──────┐     ┌────────┴──────┐      │
│  │ProjectProvider│     │WorkItemProvider│     │ ChatProvider   │      │
│  └────────┬──────┘     └────────┬──────┘     └────────┬──────┘      │
└───────────┼─────────────────────┼─────────────────────┼──────────────┘
            │                     │                     │
    ┌───────┴───────┐    ┌────────┴────────┐   ┌──────┴──────┐
    │   REST API    │    │   REST API      │   │  WebSocket  │
    │  GET /projects│    │  POST /work-items│   │  Streaming  │
    └───────┬───────┘    └────────┬────────┘   └──────┬──────┘
            │                     │                     │
┌───────────┴─────────────────────┴─────────────────────┴──────────────┐
│                         TypeScript Server                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│  │Express Routes│  │ uWebSockets  │  │  SQLite Database           │  │
│  └─────────────┘  └──────────────┘  └────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

### Example: Complete Work Item Flow

```typescript
// 1. Initial page load - fetches all work items
function WorkItemsPage({ projectId }: Props) {
  const { data: workItems, loading } = useDataBus<WorkItem[]>(
    `project:${projectId}:work-items`
  );
  
  // Data bus automatically:
  // - Checks cache (empty on first load)
  // - Calls WorkItemProvider.fetch()
  // - Makes REST call: GET /api/projects/{id}/work-items
  // - Caches response for 5 minutes
  // - Subscribes to WebSocket topic: "project:{id}:work-items"
  // - Returns data to component
}

// 2. Another user creates a work item
// Server broadcasts via WebSocket:
{
  type: MessageType.EVENT,
  topic: "project:123:work-items",
  payload: {
    action: "created",
    item: { id: "456", title: "New Task", ... }
  }
}

// 3. Data bus receives WebSocket message
// - Finds all subscribers to "project:123:work-items"
// - Updates cache with new data
// - Notifies all useDataBus hooks
// - Components re-render automatically

// 4. User navigates away and comes back
// - useDataBus finds data still in cache (< 5 min old)
// - Returns immediately without API call
// - Still maintains WebSocket subscription for updates
```

### Provider Examples

```typescript
// Initialize providers at app startup
const dataBus = new DataBus();

// Project provider handles project CRUD
dataBus.provide('project:*', new ProjectProvider(apiClient, websocket));

// Work items provider with relationship pattern
dataBus.provide('project:*:work-items', new WorkItemsProvider(apiClient, websocket));

// Repository status provider (WebSocket only, no REST)
dataBus.provide('repo-status:*', new RepoStatusProvider(websocket));

// Claude chat provider (special handling for streaming)
dataBus.provide('claude-session:*', new ClaudeSessionProvider(apiClient, websocket));

// Workspace provider (REST only, no real-time updates)
dataBus.provide('workspace', new WorkspaceProvider(apiClient));
```

## Migration Phases

### Phase 1: Infrastructure Setup (Week 1-2)
**Team**: Agent 1

1. **TypeScript Configuration**
   - Setup tsconfig.json with strict mode
   - Configure build pipeline
   - Setup linting and formatting

2. **Database Setup**
   - Design schema for all entities
   - Create TypeORM configuration
   - Write initial migrations

3. **Core Infrastructure**
   - Implement DI container
   - Setup logging system
   - Create base classes

4. **Development Environment**
   - Docker compose for services
   - Hot reload configuration
   - Debug configuration

**Deliverable**: Working TypeScript server with database

### Phase 2: Core Module Development (Week 3-4)
**Team**: Agents 2-5 in parallel

1. **Authentication Module** (Agent 2)
   - Migrate OAuth flow
   - Implement JWT tokens
   - Create user/session entities

2. **Claude Module** (Agent 3)
   - Wrap Claude SDK
   - Implement streaming
   - Create message entities

3. **Project Module** (Agent 4)
   - Migrate workspace logic
   - Implement project CRUD
   - Create project entities

4. **Real-time Module** (Agent 5)
   - Setup Socket.io
   - Implement subscriptions
   - Create broadcasting service

**Deliverable**: All core modules with unit tests

### Phase 3: Feature Migration (Week 5-6)
**Team**: All agents

1. **API Migration**
   - Migrate all 54+ endpoints
   - Maintain backwards compatibility
   - Add request validation

2. **Business Logic**
   - Extract from routes
   - Implement in services
   - Add transaction support

3. **Integration Points**
   - Connect modules together
   - Implement event system
   - Add caching layer

**Deliverable**: Feature-complete TypeScript server

### Phase 4: Client Integration (Week 7)
**Team**: Frontend developers

1. **Data Bus Implementation**
   - Create observable store
   - Implement providers
   - Add caching logic

2. **WebSocket Integration**
   - Replace SSE with WebSocket
   - Add reconnection logic
   - Implement optimistic updates

3. **API Client Updates**
   - Generate TypeScript types
   - Update API calls
   - Add error handling

**Deliverable**: Integrated client with real-time updates

### Phase 5: Testing & Validation (Week 8)
**Team**: All agents

1. **Unit Testing**
   - Achieve 80% coverage
   - Mock all dependencies
   - Test error scenarios

2. **Integration Testing**
   - Test API endpoints
   - Validate WebSocket events
   - Test data persistence

3. **Performance Testing**
   - Benchmark API performance
   - Test concurrent connections
   - Validate memory usage

4. **E2E Testing**
   - Update existing tests
   - Add new scenarios
   - Test migration paths

**Deliverable**: Fully tested system

### Phase 6: Cutover & Cleanup (Week 9-10)
**Team**: DevOps + all agents

1. **Data Migration**
   - Migrate JSON files to SQLite
   - Validate data integrity
   - Create rollback plan

2. **Deployment**
   - Setup staging environment
   - Deploy with feature flags
   - Monitor performance

3. **Gradual Rollout**
   - Enable for internal users
   - Monitor for issues
   - Gradually increase traffic

4. **Cleanup**
   - Remove old code
   - Update documentation
   - Archive JSON files

**Deliverable**: Production TypeScript server

## Testing Strategy

### Unit Testing
```typescript
// Example unit test
describe('ProjectService', () => {
  let service: ProjectService;
  let repository: MockRepository<Project>;
  
  beforeEach(() => {
    repository = new MockRepository();
    service = new ProjectService(repository);
  });
  
  it('should create project', async () => {
    const project = await service.create({
      name: 'Test Project',
      workspaceId: '123'
    });
    
    expect(project).toMatchObject({
      name: 'Test Project',
      workspaceId: '123'
    });
    expect(repository.save).toHaveBeenCalled();
  });
});
```

### Integration Testing
```typescript
// Example API test
describe('POST /api/projects', () => {
  it('should create project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', 'Bearer token')
      .send({ name: 'Test Project' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### E2E Testing
```typescript
// Example E2E test
test('create and manage project', async ({ page }) => {
  await page.goto('/projects');
  await page.click('button:has-text("New Project")');
  await page.fill('input[name="name"]', 'Test Project');
  await page.click('button:has-text("Create")');
  
  await expect(page).toHaveURL(/\/projects\/\d+/);
  await expect(page.locator('h1')).toHaveText('Test Project');
});
```

## Data Migration Plan

### Migration Strategy
1. **Dual Write**: New system writes to both SQLite and JSON
2. **Background Migration**: Script to migrate existing data
3. **Validation**: Compare data between systems
4. **Cutover**: Switch reads to SQLite
5. **Cleanup**: Remove JSON files

### Schema Mapping
```sql
-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data JSON NOT NULL
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Migration Script
```typescript
// scripts/migrate-data.ts
async function migrateSessionFiles() {
  const files = await fs.readdir('./sessions');
  
  for (const file of files) {
    const data = await fs.readFile(`./sessions/${file}`, 'utf8');
    const session = JSON.parse(data);
    
    await db.transaction(async (manager) => {
      // Insert session
      await manager.insert(Session, {
        id: session.sessionId,
        userId: session.userName,
        projectId: session.projectId,
        data: session
      });
      
      // Insert messages
      for (const message of session.messages) {
        await manager.insert(Message, {
          id: message.id,
          sessionId: session.sessionId,
          role: message.role,
          content: message.content,
          metadata: message
        });
      }
    });
  }
}
```

## Performance Considerations

### Optimization Strategies
1. **uWebSockets.js**: 10-15x faster than Socket.io
2. **Binary Protocol**: MessagePack reduces payload size by 50-70%
3. **Connection Pooling**: Reuse database connections
4. **Query Optimization**: Use indexes and explain plans
5. **Caching Layer**: Redis for frequently accessed data
6. **Zero-copy Operations**: uWS provides zero-copy APIs
7. **Batch Operations**: Process multiple items together
8. **Async Processing**: Queue long-running tasks

### Performance Targets
- **API Response Time**: < 50ms for 95th percentile
- **WebSocket Latency**: < 5ms for message delivery
- **Message Throughput**: 150,000+ messages/second
- **Concurrent Connections**: 10,000+ simultaneous WebSocket clients
- **Database Queries**: < 10ms for common queries
- **Memory Usage**: < 10MB per 1000 connections
- **Client Bundle Impact**: 0KB (native WebSocket) + ~8KB (MessagePack)

### Benchmark Comparison
| Metric | Current (SSE) | Socket.io | uWebSockets.js |
|--------|---------------|-----------|----------------|
| Messages/sec | ~5K | ~20K | ~150K |
| Memory/1K clients | 200MB | 100MB | 10MB |
| Latency (p99) | 50ms | 5ms | <1ms |
| Client bundle | 0KB | 84KB | 0KB |

## Security Considerations

### Security Measures
1. **Input Validation**: Joi schemas for all inputs
2. **SQL Injection**: Parameterized queries via ORM
3. **XSS Protection**: Sanitize user content
4. **CSRF Protection**: Token validation
5. **Rate Limiting**: Prevent abuse
6. **Authentication**: JWT with refresh tokens
7. **Authorization**: Role-based access control
8. **Encryption**: TLS for all communications

### Security Headers
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

## Monitoring & Observability

### Logging Strategy
```typescript
// Structured logging with Winston
logger.info('Project created', {
  projectId: project.id,
  userId: user.id,
  duration: Date.now() - startTime,
  metadata: { name: project.name }
});
```

### Metrics Collection
- **API Metrics**: Response times, error rates
- **Database Metrics**: Query performance, connection pool
- **WebSocket Metrics**: Active connections, message rates
- **Business Metrics**: Projects created, messages sent
- **System Metrics**: CPU, memory, disk usage

### Health Checks
```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      claude: await checkClaude(),
    }
  };
  
  res.json(health);
});
```

## Rollback Plan

### Rollback Strategy
1. **Feature Flags**: Gradually enable features
2. **Blue-Green Deployment**: Switch between versions
3. **Database Compatibility**: Maintain schema compatibility
4. **API Versioning**: Support old and new APIs
5. **Data Backup**: Regular backups before migration

### Emergency Procedures
1. **Immediate Rollback**: Switch to old server
2. **Data Recovery**: Restore from backups
3. **Communication**: Notify users of issues
4. **Post-Mortem**: Analyze what went wrong
5. **Fix Forward**: Address issues and retry

## Success Criteria

### Technical Metrics
- ✅ 100% TypeScript coverage
- ✅ 80%+ unit test coverage
- ✅ All 54+ APIs migrated
- ✅ Zero data loss during migration
- ✅ Performance meets benchmarks
- ✅ No critical security issues

### Business Metrics
- ✅ Zero downtime during migration
- ✅ No user-facing errors
- ✅ Improved developer velocity
- ✅ Reduced bug rate
- ✅ Faster feature delivery

### Team Metrics
- ✅ All modules delivered on schedule
- ✅ Knowledge transfer completed
- ✅ Documentation updated
- ✅ Team trained on new stack
- ✅ Support handoff completed

## Appendix

### File Size Guidelines
To maintain the 500-line limit:
1. **Controllers**: Route handlers only
2. **Services**: Business logic split by domain
3. **Entities**: Simple data models
4. **Utilities**: Focused helper functions
5. **Tests**: One test file per source file

### Naming Conventions
- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Interfaces**: `IPascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Database**: `snake_case`

### Code Organization
```
src/
├── infrastructure/     # Core infrastructure
│   ├── database/      # Database configuration
│   ├── cache/         # Caching layer
│   └── core/          # DI, logging, errors
├── modules/           # Feature modules
│   ├── auth/          # Authentication
│   ├── claude/        # Claude integration
│   ├── project/       # Project management
│   └── realtime/      # WebSocket
├── shared/            # Shared utilities
│   ├── decorators/    # Custom decorators
│   ├── guards/        # Route guards
│   └── pipes/         # Validation pipes
└── main.ts           # Application entry
```

### Development Workflow
1. **Branch Strategy**: Feature branches from `develop`
2. **Code Review**: All PRs require approval
3. **CI/CD**: Automated testing and deployment
4. **Documentation**: Update with code changes
5. **Monitoring**: Track metrics from day one