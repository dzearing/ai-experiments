# Claude Code Web Architecture

## System Architecture

### Overview

The Claude Code Web implementation consists of three main layers:

1. **Web Client**: Browser-based terminal interface
2. **Node.js Server**: SDK wrapper and state manager
3. **Persistence Layer**: Database and file storage

### Component Diagram

```
┌────────────────────────────────────────────────────────────┐
│                        Web Browser                         │
├────────────────────────────────────────────────────────────┤
│  Terminal UI │ Command Parser │ WebSocket Client │ State   │
└──────────────┴────────────────┴──────┬───────────┴─────────┘
                                        │
                              WebSocket │ (bidirectional)
                                        │
┌───────────────────────────────────────▼────────────────────┐
│                      Node.js Server                        │
├─────────────────────────────────────────────────────────────┤
│  WebSocket Handler │ Session Manager │ Command Processor   │
│  SDK Integration   │ Tool Executor   │ Permission Manager  │
│  MCP Manager       │ Hook System     │ Cache Layer         │
└───────────────────┴─────────┬───────┴─────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
            ┌───────▼──┐ ┌────▼────┐ ┌──▼──────┐
            │ Database │ │  Files  │ │  Redis  │
            │(Sessions)│ │(Configs)│ │ (Cache) │
            └──────────┘ └─────────┘ └─────────┘
```

## Core Components

### 1. Web Client Layer

#### Terminal UI Component
```typescript
interface TerminalUI {
  // Display management
  render(message: Message): void;
  clear(): void;
  showProgress(tool: ToolExecution): void;
  
  // Input handling
  onCommand(callback: (cmd: string) => void): void;
  onKeyPress(callback: (key: KeyEvent) => void): void;
  
  // History management
  addToHistory(command: string): void;
  navigateHistory(direction: 'up' | 'down'): string;
}
```

#### WebSocket Client
```typescript
interface WSClient {
  connect(sessionId?: string): Promise<void>;
  send(message: ClientMessage): void;
  on(event: string, handler: Function): void;
  reconnect(): Promise<void>;
}
```

#### State Management
```typescript
interface ClientState {
  sessionId: string;
  messages: Message[];
  context: ContextInfo;
  todos: TodoItem[];
  mode: 'default' | 'plan';
  model: string;
  connected: boolean;
}
```

### 2. Server Layer

#### Session Manager
```typescript
interface SessionManager {
  createSession(userId: string): Session;
  resumeSession(sessionId: string): Session;
  saveSession(session: Session): Promise<void>;
  listSessions(userId: string): SessionInfo[];
  
  // Persistence
  persist(): Promise<void>;
  restore(sessionId: string): Promise<Session>;
}

interface Session {
  id: string;
  userId: string;
  messages: Message[];
  model: string;
  permissionMode: PermissionMode;
  context: ContextState;
  todos: TodoItem[];
  backgroundShells: ShellProcess[];
  createdAt: Date;
  lastActiveAt: Date;
}
```

#### SDK Integration
```typescript
class ClaudeSDKWrapper {
  private sdk: ClaudeSDK;
  private activeQuery?: Query;
  
  async initialize(options: SDKOptions): Promise<void>;
  
  async query(
    prompt: string,
    session: Session,
    callbacks: QueryCallbacks
  ): Promise<void>;
  
  async interrupt(): Promise<void>;
  
  setPermissionMode(mode: PermissionMode): Promise<void>;
}

interface QueryCallbacks {
  onMessage(message: SDKMessage): void;
  onToolUse(tool: ToolExecution): void;
  onError(error: Error): void;
  onComplete(result: Result): void;
}
```

#### Command Processor
```typescript
interface CommandProcessor {
  process(input: string, session: Session): Promise<CommandResult>;
  
  // Slash commands
  executeSlashCommand(cmd: string, args: string[]): Promise<void>;
  
  // Regular prompts
  executePrompt(prompt: string): Promise<void>;
}

const SLASH_COMMANDS = {
  '/help': showHelp,
  '/clear': clearConversation,
  '/context': showContext,
  '/bug': reportBug,
  '/todos': manageTodos,
  '/bashes': listBackgroundShells,
  '/compact': compactConversation,
  '/plan': togglePlanMode,
  '/settings': manageSettings,
  '/stop': stopOperation,
} as const;
```

#### Tool Executor
```typescript
interface ToolExecutor {
  execute(tool: Tool, input: any): Promise<ToolResult>;
  
  // Permission checking
  checkPermission(tool: Tool, input: any): Promise<boolean>;
  
  // Progress tracking
  trackProgress(toolId: string, progress: Progress): void;
  
  // Background execution
  executeInBackground(tool: Tool, input: any): string;
}
```

### 3. Persistence Layer

#### Database Schema
```sql
-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  model VARCHAR(50),
  permission_mode VARCHAR(20),
  context_tokens_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  type VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_session_messages (session_id, created_at)
);

-- Todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'pending', 'in_progress', 'completed'
  active_form TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tool executions table
CREATE TABLE tool_executions (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  tool_name VARCHAR(100),
  input JSONB,
  output JSONB,
  status VARCHAR(20),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error TEXT
);

-- User settings table
CREATE TABLE user_settings (
  user_id VARCHAR(255) PRIMARY KEY,
  settings JSONB,
  mcp_configs JSONB,
  hooks JSONB,
  output_styles JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Background processes table
CREATE TABLE background_processes (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  type VARCHAR(50), -- 'shell', 'tool'
  command TEXT,
  status VARCHAR(20),
  output TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### File Storage Structure
```
/storage/
├── sessions/
│   └── {session_id}/
│       ├── transcript.md
│       ├── attachments/
│       └── exports/
├── users/
│   └── {user_id}/
│       ├── settings.json
│       ├── mcp-servers.json
│       ├── hooks/
│       └── output-styles/
└── cache/
    ├── responses/
    └── tool-results/
```

## Communication Protocol

### WebSocket Messages

#### Client → Server
```typescript
type ClientMessage = 
  | { type: 'init'; sessionId?: string; token: string }
  | { type: 'prompt'; content: string }
  | { type: 'command'; name: string; args: string[] }
  | { type: 'interrupt' }
  | { type: 'setMode'; mode: PermissionMode }
  | { type: 'keyPress'; key: string; modifiers: string[] }
  | { type: 'resize'; cols: number; rows: number };
```

#### Server → Client
```typescript
type ServerMessage =
  | { type: 'session'; session: SessionInfo }
  | { type: 'message'; message: Message }
  | { type: 'toolUse'; tool: ToolExecution }
  | { type: 'context'; usage: ContextUsage }
  | { type: 'todos'; items: TodoItem[] }
  | { type: 'error'; error: string }
  | { type: 'progress'; toolId: string; progress: number }
  | { type: 'complete'; result: Result };
```

## State Management

### Server State
```typescript
class ServerState {
  // Active sessions
  private sessions: Map<string, Session>;
  
  // Active SDK queries
  private queries: Map<string, Query>;
  
  // Background processes
  private processes: Map<string, Process>;
  
  // WebSocket connections
  private connections: Map<string, WebSocket>;
  
  // Restore state on startup
  async initialize(): Promise<void> {
    await this.restoreSessions();
    await this.restoreProcesses();
  }
  
  // Periodic persistence
  startPersistence(): void {
    setInterval(() => this.persistAll(), 30000); // Every 30s
  }
}
```

### Client State Sync
```typescript
class StateSync {
  // Optimistic updates
  applyOptimisticUpdate(action: Action): void;
  
  // Conflict resolution
  resolveConflict(local: State, server: State): State;
  
  // Incremental sync
  syncDelta(delta: StateDelta): void;
  
  // Full sync on reconnect
  fullSync(state: State): void;
}
```

## Security Architecture

### Authentication Flow
```
1. User logs in via web UI
2. Server validates credentials
3. Server generates JWT token
4. Client stores token in localStorage
5. Client includes token in WebSocket connection
6. Server validates token on each message
```

### Permission System
```typescript
interface PermissionManager {
  // Tool permissions
  canUseTool(user: User, tool: string, input: any): boolean;
  
  // File access permissions
  canAccessPath(user: User, path: string): boolean;
  
  // Rate limiting
  checkRateLimit(user: User, action: string): boolean;
  
  // Session limits
  checkSessionLimit(user: User): boolean;
}
```

## Scalability Considerations

### Horizontal Scaling
- Use Redis for session sharing across servers
- Implement sticky sessions for WebSocket connections
- Use message queue for background tasks

### Performance Optimizations
- Connection pooling for database
- Response caching for repeated queries
- Lazy loading of message history
- Virtual scrolling in UI
- Debounced state persistence

### Resource Management
```typescript
interface ResourceManager {
  // Memory management
  enforceMemoryLimit(session: Session): void;
  
  // Process limits
  enforceProcessLimit(user: User): void;
  
  // Storage quotas
  enforceStorageQuota(user: User): void;
  
  // Cleanup
  cleanupInactiveSessions(): void;
  cleanupOldData(): void;
}
```

## Error Handling

### Error Categories
1. **SDK Errors**: API limits, model errors
2. **Network Errors**: WebSocket disconnections
3. **Permission Errors**: Unauthorized tool use
4. **System Errors**: Database failures, OOM

### Recovery Strategies
```typescript
class ErrorRecovery {
  // Automatic retry with backoff
  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T>;
  
  // Fallback to cached responses
  getCachedFallback(query: string): CachedResponse | null;
  
  // Graceful degradation
  degradeFeatures(error: Error): void;
  
  // Session recovery
  async recoverSession(sessionId: string): Session;
}
```

## Monitoring & Observability

### Metrics
- Request latency
- WebSocket connection count
- Active sessions
- Tool execution times
- Error rates
- Token usage

### Logging
```typescript
interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error): void;
  
  // Structured logging
  log(level: string, event: LogEvent): void;
}

interface LogEvent {
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  action: string;
  metadata: Record<string, any>;
}
```

### Health Checks
```typescript
interface HealthCheck {
  checkDatabase(): Promise<boolean>;
  checkSDK(): Promise<boolean>;
  checkRedis(): Promise<boolean>;
  checkDiskSpace(): Promise<boolean>;
  
  getStatus(): HealthStatus;
}
```