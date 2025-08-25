# Phase 1: Core Server Implementation

## Overview

Phase 1 establishes the foundation: a Node.js server that wraps the official `@anthropic-ai/claude-code` SDK and provides WebSocket-based communication with persistent state management.

## Implementation Steps

### Step 1: Project Setup

#### Directory Structure
```
claude-code-web/
├── server/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── server.ts             # Express/WebSocket setup
│   │   ├── sdk/
│   │   │   ├── claude-wrapper.ts # SDK wrapper
│   │   │   ├── query-manager.ts  # Query lifecycle
│   │   │   └── tool-executor.ts  # Tool handling
│   │   ├── session/
│   │   │   ├── session-manager.ts
│   │   │   ├── session-store.ts
│   │   │   └── session-types.ts
│   │   ├── websocket/
│   │   │   ├── ws-handler.ts
│   │   │   ├── message-types.ts
│   │   │   └── connection-manager.ts
│   │   ├── persistence/
│   │   │   ├── database.ts
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   └── utils/
│   │       ├── logger.ts
│   │       ├── config.ts
│   │       └── crypto.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── client/                       # Phase 3
├── docker-compose.yml
└── README.md
```

#### Package Dependencies
```json
{
  "name": "claude-code-web-server",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-code": "^1.0.89",
    "express": "^5.0.0",
    "ws": "^8.18.0",
    "uuid": "^10.0.0",
    "pg": "^8.12.0",
    "redis": "^4.7.0",
    "dotenv": "^16.4.5",
    "winston": "^3.14.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/express": "^4.17.21",
    "@types/ws": "^8.5.10",
    "typescript": "^5.5.0",
    "tsx": "^4.16.0",
    "nodemon": "^3.1.0",
    "vitest": "^2.0.0"
  }
}
```

### Step 2: SDK Integration

#### Claude SDK Wrapper
```typescript
// src/sdk/claude-wrapper.ts
import { query, Query, SDKMessage, Options } from '@anthropic-ai/claude-code';
import { EventEmitter } from 'events';

export class ClaudeSDKWrapper extends EventEmitter {
  private activeQueries = new Map<string, Query>();
  
  async createQuery(
    sessionId: string,
    prompt: string | AsyncIterable<SDKUserMessage>,
    options: ClaudeQueryOptions
  ): Promise<void> {
    // Build SDK options
    const sdkOptions: Options = {
      model: options.model || 'sonnet',
      permissionMode: options.permissionMode || 'default',
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      maxTurns: options.maxTurns || 30,
      canUseTool: this.createPermissionHandler(sessionId),
      hooks: this.createHooks(sessionId),
      allowedTools: options.allowedTools,
      disallowedTools: options.disallowedTools,
      additionalDirectories: options.additionalDirectories,
      appendSystemPrompt: options.appendSystemPrompt,
      mcpServers: options.mcpServers,
    };
    
    // Create query
    const q = query({ prompt, options: sdkOptions });
    this.activeQueries.set(sessionId, q);
    
    try {
      // Process messages
      for await (const message of q) {
        await this.handleSDKMessage(sessionId, message);
      }
    } catch (error) {
      this.emit('error', { sessionId, error });
    } finally {
      this.activeQueries.delete(sessionId);
    }
  }
  
  private async handleSDKMessage(
    sessionId: string, 
    message: SDKMessage
  ): Promise<void> {
    switch (message.type) {
      case 'user':
        this.emit('userMessage', { sessionId, message });
        break;
        
      case 'assistant':
        this.emit('assistantMessage', { sessionId, message });
        await this.processToolUses(sessionId, message);
        break;
        
      case 'system':
        this.emit('systemMessage', { sessionId, message });
        break;
        
      case 'result':
        this.emit('result', { sessionId, result: message });
        break;
    }
  }
  
  private async processToolUses(
    sessionId: string,
    message: SDKAssistantMessage
  ): Promise<void> {
    if (!message.message.content) return;
    
    for (const block of message.message.content) {
      if (block.type === 'tool_use') {
        this.emit('toolUse', {
          sessionId,
          toolUse: {
            id: block.id,
            name: block.name,
            input: block.input,
            status: 'executing'
          }
        });
      }
    }
  }
  
  async interrupt(sessionId: string): Promise<void> {
    const query = this.activeQueries.get(sessionId);
    if (query?.interrupt) {
      await query.interrupt();
    }
  }
  
  async setPermissionMode(
    sessionId: string, 
    mode: PermissionMode
  ): Promise<void> {
    const query = this.activeQueries.get(sessionId);
    if (query?.setPermissionMode) {
      await query.setPermissionMode(mode);
    }
  }
  
  private createPermissionHandler(sessionId: string): CanUseTool {
    return async (toolName, input, { signal }) => {
      // Emit permission check event
      this.emit('permissionCheck', { 
        sessionId, 
        toolName, 
        input 
      });
      
      // Wait for permission decision
      return new Promise((resolve) => {
        const handler = (decision: PermissionResult) => {
          resolve(decision);
        };
        
        this.once(`permission:${sessionId}:${toolName}`, handler);
        
        // Handle abort
        signal.addEventListener('abort', () => {
          this.off(`permission:${sessionId}:${toolName}`, handler);
          resolve({ behavior: 'deny', message: 'Aborted' });
        });
      });
    };
  }
  
  private createHooks(sessionId: string): Partial<Record<HookEvent, HookCallbackMatcher[]>> {
    return {
      PreToolUse: [{
        hooks: [async (input, toolUseId, { signal }) => {
          this.emit('hook:preToolUse', { sessionId, input, toolUseId });
          return { continue: true };
        }]
      }],
      
      PostToolUse: [{
        hooks: [async (input, toolUseId, { signal }) => {
          this.emit('hook:postToolUse', { sessionId, input, toolUseId });
          return { continue: true };
        }]
      }],
      
      UserPromptSubmit: [{
        hooks: [async (input, toolUseId, { signal }) => {
          this.emit('hook:userPromptSubmit', { sessionId, input });
          return { continue: true };
        }]
      }],
    };
  }
}
```

#### Query Manager
```typescript
// src/sdk/query-manager.ts
export class QueryManager {
  private wrapper: ClaudeSDKWrapper;
  private sessionManager: SessionManager;
  
  constructor(wrapper: ClaudeSDKWrapper, sessionManager: SessionManager) {
    this.wrapper = wrapper;
    this.sessionManager = sessionManager;
    this.setupEventHandlers();
  }
  
  async submitQuery(
    sessionId: string,
    prompt: string,
    options?: Partial<ClaudeQueryOptions>
  ): Promise<void> {
    const session = await this.sessionManager.getSession(sessionId);
    
    // Build options from session state
    const queryOptions: ClaudeQueryOptions = {
      model: options?.model || session.model,
      permissionMode: options?.permissionMode || session.permissionMode,
      cwd: session.workingDirectory,
      env: session.environment,
      mcpServers: session.mcpServers,
      allowedTools: session.allowedTools,
      disallowedTools: session.disallowedTools,
      ...options
    };
    
    // Track query start
    session.currentQuery = {
      id: uuidv4(),
      prompt,
      startedAt: new Date(),
      status: 'active'
    };
    
    await this.sessionManager.saveSession(session);
    
    // Execute query
    await this.wrapper.createQuery(sessionId, prompt, queryOptions);
  }
  
  async resumeQuery(sessionId: string): Promise<void> {
    const session = await this.sessionManager.getSession(sessionId);
    
    if (!session.currentQuery || session.currentQuery.status !== 'interrupted') {
      throw new Error('No interrupted query to resume');
    }
    
    // Build streaming input from message history
    const messages = this.buildStreamingMessages(session);
    
    await this.wrapper.createQuery(
      sessionId,
      messages,
      this.buildOptionsFromSession(session)
    );
  }
  
  private buildStreamingMessages(session: Session): AsyncIterable<SDKUserMessage> {
    return {
      async *[Symbol.asyncIterator]() {
        // Yield all previous user messages
        for (const msg of session.messages) {
          if (msg.type === 'user') {
            yield {
              type: 'user',
              message: msg.content,
              session_id: session.id,
            };
          }
        }
      }
    };
  }
  
  private setupEventHandlers(): void {
    // Handle assistant messages
    this.wrapper.on('assistantMessage', async ({ sessionId, message }) => {
      const session = await this.sessionManager.getSession(sessionId);
      
      session.messages.push({
        id: uuidv4(),
        type: 'assistant',
        content: message.message.content,
        metadata: {
          timestamp: new Date(),
          model: message.message.model,
        }
      });
      
      // Update context usage
      if (message.message.usage) {
        session.contextTokensUsed = message.message.usage.input_tokens;
      }
      
      await this.sessionManager.saveSession(session);
    });
    
    // Handle tool uses
    this.wrapper.on('toolUse', async ({ sessionId, toolUse }) => {
      const session = await this.sessionManager.getSession(sessionId);
      
      // Track tool execution
      session.toolExecutions = session.toolExecutions || [];
      session.toolExecutions.push({
        id: toolUse.id,
        name: toolUse.name,
        input: toolUse.input,
        status: 'executing',
        startedAt: new Date()
      });
      
      await this.sessionManager.saveSession(session);
    });
    
    // Handle results
    this.wrapper.on('result', async ({ sessionId, result }) => {
      const session = await this.sessionManager.getSession(sessionId);
      
      session.currentQuery = {
        ...session.currentQuery!,
        status: 'completed',
        completedAt: new Date(),
        result: result.subtype
      };
      
      await this.sessionManager.saveSession(session);
    });
  }
}
```

### Step 3: Session Management

#### Session Manager
```typescript
// src/session/session-manager.ts
import { EventEmitter } from 'events';

export class SessionManager extends EventEmitter {
  private store: SessionStore;
  private activeSessions = new Map<string, Session>();
  
  constructor(store: SessionStore) {
    super();
    this.store = store;
  }
  
  async createSession(userId: string, options?: CreateSessionOptions): Promise<Session> {
    const session: Session = {
      id: uuidv4(),
      userId,
      messages: [],
      model: options?.model || 'sonnet',
      permissionMode: options?.permissionMode || 'default',
      contextTokensUsed: 0,
      contextLimit: 200000,
      todos: [],
      backgroundProcesses: [],
      workingDirectory: options?.cwd || process.cwd(),
      environment: options?.env || {},
      mcpServers: options?.mcpServers || {},
      allowedTools: options?.allowedTools,
      disallowedTools: options?.disallowedTools,
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
    
    await this.store.save(session);
    this.activeSessions.set(session.id, session);
    
    this.emit('sessionCreated', session);
    return session;
  }
  
  async getSession(sessionId: string): Promise<Session> {
    // Check active sessions first
    let session = this.activeSessions.get(sessionId);
    
    if (!session) {
      // Load from store
      session = await this.store.load(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      this.activeSessions.set(sessionId, session);
    }
    
    // Update last active time
    session.lastActiveAt = new Date();
    return session;
  }
  
  async saveSession(session: Session): Promise<void> {
    // Update in memory
    this.activeSessions.set(session.id, session);
    
    // Persist to store
    await this.store.save(session);
    
    this.emit('sessionUpdated', session);
  }
  
  async listSessions(userId: string): Promise<SessionInfo[]> {
    return this.store.listByUser(userId);
  }
  
  async resumeSession(sessionId: string): Promise<Session> {
    const session = await this.getSession(sessionId);
    
    // Rebuild any necessary state
    if (session.currentQuery?.status === 'active') {
      // Query was interrupted, mark for resumption
      session.currentQuery.status = 'interrupted';
    }
    
    // Reconnect background processes
    for (const process of session.backgroundProcesses) {
      if (process.status === 'running') {
        await this.reconnectProcess(process);
      }
    }
    
    this.emit('sessionResumed', session);
    return session;
  }
  
  async deleteSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);
    await this.store.delete(sessionId);
    this.emit('sessionDeleted', sessionId);
  }
  
  // Periodic cleanup
  startCleanup(): void {
    setInterval(async () => {
      // Remove inactive sessions from memory
      for (const [id, session] of this.activeSessions) {
        const inactiveTime = Date.now() - session.lastActiveAt.getTime();
        if (inactiveTime > 3600000) { // 1 hour
          this.activeSessions.delete(id);
        }
      }
      
      // Clean up old sessions from store
      await this.store.cleanupOld();
    }, 300000); // Every 5 minutes
  }
}
```

#### Session Store
```typescript
// src/session/session-store.ts
import { Pool } from 'pg';

export class SessionStore {
  constructor(private pool: Pool) {}
  
  async save(session: Session): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Upsert session
      await client.query(`
        INSERT INTO claude_web.sessions (
          id, user_id, title, model, permission_mode,
          context_tokens_used, context_limit,
          created_at, last_active_at, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          model = EXCLUDED.model,
          permission_mode = EXCLUDED.permission_mode,
          context_tokens_used = EXCLUDED.context_tokens_used,
          last_active_at = EXCLUDED.last_active_at,
          metadata = EXCLUDED.metadata
      `, [
        session.id,
        session.userId,
        session.title || null,
        session.model,
        session.permissionMode,
        session.contextTokensUsed,
        session.contextLimit,
        session.createdAt,
        session.lastActiveAt,
        JSON.stringify({
          workingDirectory: session.workingDirectory,
          environment: session.environment,
          mcpServers: session.mcpServers,
          allowedTools: session.allowedTools,
          disallowedTools: session.disallowedTools,
          currentQuery: session.currentQuery,
        })
      ]);
      
      // Save messages
      await this.saveMessages(client, session.id, session.messages);
      
      // Save todos
      await this.saveTodos(client, session.id, session.todos);
      
      // Save background processes
      await this.saveProcesses(client, session.id, session.backgroundProcesses);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async load(sessionId: string): Promise<Session | null> {
    const client = await this.pool.connect();
    try {
      // Load session
      const sessionResult = await client.query(`
        SELECT * FROM claude_web.sessions WHERE id = $1
      `, [sessionId]);
      
      if (sessionResult.rows.length === 0) {
        return null;
      }
      
      const row = sessionResult.rows[0];
      const metadata = row.metadata || {};
      
      // Load related data
      const messages = await this.loadMessages(client, sessionId);
      const todos = await this.loadTodos(client, sessionId);
      const processes = await this.loadProcesses(client, sessionId);
      
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        messages,
        todos,
        backgroundProcesses: processes,
        model: row.model,
        permissionMode: row.permission_mode,
        contextTokensUsed: row.context_tokens_used,
        contextLimit: row.context_limit,
        workingDirectory: metadata.workingDirectory || process.cwd(),
        environment: metadata.environment || {},
        mcpServers: metadata.mcpServers || {},
        allowedTools: metadata.allowedTools,
        disallowedTools: metadata.disallowedTools,
        currentQuery: metadata.currentQuery,
        createdAt: row.created_at,
        lastActiveAt: row.last_active_at,
      };
    } finally {
      client.release();
    }
  }
  
  async listByUser(userId: string): Promise<SessionInfo[]> {
    const result = await this.pool.query(`
      SELECT id, title, model, created_at, last_active_at,
             (SELECT COUNT(*) FROM claude_web.messages WHERE session_id = s.id) as message_count
      FROM claude_web.sessions s
      WHERE user_id = $1
      ORDER BY last_active_at DESC
      LIMIT 50
    `, [userId]);
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title || 'Untitled Session',
      model: row.model,
      messageCount: parseInt(row.message_count),
      createdAt: row.created_at,
      lastActiveAt: row.last_active_at,
    }));
  }
}
```

### Step 4: WebSocket Handler

#### WebSocket Server
```typescript
// src/websocket/ws-handler.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export class WSHandler {
  private wss: WebSocketServer;
  private connections = new Map<string, WSConnection>();
  private sessionManager: SessionManager;
  private queryManager: QueryManager;
  
  constructor(
    server: Server,
    sessionManager: SessionManager,
    queryManager: QueryManager
  ) {
    this.wss = new WebSocketServer({ server });
    this.sessionManager = sessionManager;
    this.queryManager = queryManager;
    
    this.setupWebSocketServer();
    this.setupSessionEventHandlers();
  }
  
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const connection = new WSConnection(ws, req);
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(connection, message);
        } catch (error) {
          connection.sendError(error.message);
        }
      });
      
      ws.on('close', () => {
        this.handleDisconnect(connection);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }
  
  private async handleMessage(
    connection: WSConnection,
    message: ClientMessage
  ): Promise<void> {
    switch (message.type) {
      case 'init':
        await this.handleInit(connection, message);
        break;
        
      case 'prompt':
        await this.handlePrompt(connection, message);
        break;
        
      case 'command':
        await this.handleCommand(connection, message);
        break;
        
      case 'interrupt':
        await this.handleInterrupt(connection);
        break;
        
      case 'setMode':
        await this.handleSetMode(connection, message);
        break;
        
      case 'keyPress':
        await this.handleKeyPress(connection, message);
        break;
    }
  }
  
  private async handleInit(
    connection: WSConnection,
    message: InitMessage
  ): Promise<void> {
    // Authenticate user
    const userId = await this.authenticate(message.token);
    connection.userId = userId;
    
    // Create or resume session
    let session: Session;
    if (message.sessionId) {
      session = await this.sessionManager.resumeSession(message.sessionId);
    } else {
      session = await this.sessionManager.createSession(userId);
    }
    
    connection.sessionId = session.id;
    this.connections.set(session.id, connection);
    
    // Send session info
    connection.send({
      type: 'session',
      session: {
        id: session.id,
        model: session.model,
        permissionMode: session.permissionMode,
        contextUsage: {
          used: session.contextTokensUsed,
          limit: session.contextLimit
        },
        messages: session.messages,
        todos: session.todos,
        backgroundProcesses: session.backgroundProcesses
      }
    });
  }
  
  private async handlePrompt(
    connection: WSConnection,
    message: PromptMessage
  ): Promise<void> {
    if (!connection.sessionId) {
      throw new Error('No active session');
    }
    
    // Save user message
    const session = await this.sessionManager.getSession(connection.sessionId);
    session.messages.push({
      id: uuidv4(),
      type: 'user',
      content: message.content,
      metadata: {
        timestamp: new Date()
      }
    });
    await this.sessionManager.saveSession(session);
    
    // Echo user message back
    connection.send({
      type: 'message',
      message: session.messages[session.messages.length - 1]
    });
    
    // Submit to SDK
    await this.queryManager.submitQuery(
      connection.sessionId,
      message.content
    );
  }
  
  private setupSessionEventHandlers(): void {
    // Forward session events to WebSocket clients
    this.sessionManager.on('sessionUpdated', (session: Session) => {
      const connection = this.connections.get(session.id);
      if (connection) {
        connection.send({
          type: 'context',
          usage: {
            used: session.contextTokensUsed,
            limit: session.contextLimit
          }
        });
        
        if (session.todos) {
          connection.send({
            type: 'todos',
            items: session.todos
          });
        }
      }
    });
    
    // Forward SDK events
    this.queryManager.wrapper.on('assistantMessage', ({ sessionId, message }) => {
      const connection = this.connections.get(sessionId);
      if (connection) {
        connection.send({
          type: 'message',
          message: {
            type: 'assistant',
            content: message.message.content,
            metadata: {
              timestamp: new Date(),
              model: message.message.model
            }
          }
        });
      }
    });
    
    this.queryManager.wrapper.on('toolUse', ({ sessionId, toolUse }) => {
      const connection = this.connections.get(sessionId);
      if (connection) {
        connection.send({
          type: 'toolUse',
          tool: toolUse
        });
      }
    });
  }
}

class WSConnection {
  userId?: string;
  sessionId?: string;
  
  constructor(
    private ws: WebSocket,
    private req: IncomingMessage
  ) {}
  
  send(message: ServerMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  sendError(error: string): void {
    this.send({ type: 'error', error });
  }
}
```

### Step 5: Server Entry Point

#### Main Server
```typescript
// src/server.ts
import express from 'express';
import { createServer } from 'http';
import { Pool } from 'pg';
import { ClaudeSDKWrapper } from './sdk/claude-wrapper';
import { QueryManager } from './sdk/query-manager';
import { SessionManager } from './session/session-manager';
import { SessionStore } from './session/session-store';
import { WSHandler } from './websocket/ws-handler';

export async function createClaudeWebServer(config: ServerConfig) {
  const app = express();
  const server = createServer(app);
  
  // Database connection
  const pool = new Pool(config.database);
  
  // Initialize components
  const sessionStore = new SessionStore(pool);
  const sessionManager = new SessionManager(sessionStore);
  const sdkWrapper = new ClaudeSDKWrapper();
  const queryManager = new QueryManager(sdkWrapper, sessionManager);
  const wsHandler = new WSHandler(server, sessionManager, queryManager);
  
  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'healthy' });
    } catch (error) {
      res.status(503).json({ status: 'unhealthy', error: error.message });
    }
  });
  
  // Session list endpoint
  app.get('/api/sessions', authenticate, async (req, res) => {
    const sessions = await sessionManager.listSessions(req.user.id);
    res.json(sessions);
  });
  
  // Export session endpoint
  app.get('/api/sessions/:id/export', authenticate, async (req, res) => {
    const session = await sessionManager.getSession(req.params.id);
    res.json(session);
  });
  
  // Start periodic tasks
  sessionManager.startCleanup();
  
  // Start server
  server.listen(config.port, () => {
    console.log(`Claude Code Web Server running on port ${config.port}`);
  });
  
  return { app, server, wsHandler };
}
```

## Testing Strategy

### Unit Tests
```typescript
// src/sdk/claude-wrapper.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ClaudeSDKWrapper } from './claude-wrapper';

describe('ClaudeSDKWrapper', () => {
  it('should create a query with correct options', async () => {
    const wrapper = new ClaudeSDKWrapper();
    const mockQuery = vi.fn();
    
    await wrapper.createQuery('session-1', 'test prompt', {
      model: 'sonnet',
      permissionMode: 'plan'
    });
    
    expect(mockQuery).toHaveBeenCalledWith({
      prompt: 'test prompt',
      options: expect.objectContaining({
        model: 'sonnet',
        permissionMode: 'plan'
      })
    });
  });
});
```

### Integration Tests
```typescript
// tests/integration/session-flow.test.ts
describe('Session Flow', () => {
  it('should create, query, and resume a session', async () => {
    // Create session
    const ws = new WebSocket('ws://localhost:3000');
    await waitForConnection(ws);
    
    ws.send(JSON.stringify({
      type: 'init',
      token: 'test-token'
    }));
    
    const sessionMsg = await waitForMessage(ws, 'session');
    expect(sessionMsg.session.id).toBeDefined();
    
    // Send prompt
    ws.send(JSON.stringify({
      type: 'prompt',
      content: 'Hello, Claude!'
    }));
    
    // Wait for response
    const assistantMsg = await waitForMessage(ws, 'message');
    expect(assistantMsg.message.type).toBe('assistant');
    
    // Disconnect and reconnect
    ws.close();
    
    const ws2 = new WebSocket('ws://localhost:3000');
    ws2.send(JSON.stringify({
      type: 'init',
      token: 'test-token',
      sessionId: sessionMsg.session.id
    }));
    
    const resumedSession = await waitForMessage(ws2, 'session');
    expect(resumedSession.session.messages.length).toBeGreaterThan(0);
  });
});
```

## Deployment Considerations

### Docker Setup
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Environment Variables
```env
# .env.example
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/claude_web

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key

# Claude Code
CLAUDE_MODEL=sonnet
CLAUDE_MAX_TURNS=30

# Logging
LOG_LEVEL=info
```

## Monitoring & Metrics

### Key Metrics
- Active sessions count
- WebSocket connections count
- Query execution time
- Tool execution success rate
- Context usage distribution
- Error rates by type

### Logging
```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## Next Steps

After completing Phase 1:
1. Verify SDK integration with test queries
2. Test session persistence and recovery
3. Implement basic authentication
4. Set up monitoring and logging
5. Deploy to staging environment
6. Proceed to Phase 2 (CLI features)