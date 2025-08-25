# Persistence Layer Design

## Overview

The persistence layer ensures complete state recovery after server restarts, maintaining conversation continuity and user context. This document details what needs to be persisted, how it's stored, and recovery mechanisms.

## What Needs to Be Persisted

### 1. Session State

#### Core Session Data
```typescript
interface PersistedSession {
  // Identity
  id: string;                    // UUID
  userId: string;                // User identifier
  
  // Conversation
  messages: Message[];           // Full conversation history
  model: string;                 // Current model (opus/sonnet/haiku)
  permissionMode: PermissionMode; // default/plan/acceptEdits/bypass
  
  // Context
  contextTokensUsed: number;     // Current context usage
  contextLimit: number;          // Max context tokens
  
  // Metadata
  createdAt: Date;
  lastActiveAt: Date;
  title?: string;                // Auto-generated or user-provided
  tags?: string[];               // User organization
}
```

#### Message Structure
```typescript
interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  metadata: {
    timestamp: Date;
    tokenCount?: number;
    toolUses?: ToolUse[];
    error?: string;
    model?: string;
  };
}

interface ToolUse {
  toolName: string;
  toolId: string;
  input: any;
  output?: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  error?: string;
}
```

### 2. Todo State

```typescript
interface TodoState {
  sessionId: string;
  items: TodoItem[];
  lastModified: Date;
}

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
  createdAt: Date;
  completedAt?: Date;
}
```

### 3. Background Processes

```typescript
interface BackgroundProcess {
  id: string;
  sessionId: string;
  type: 'shell' | 'tool' | 'query';
  
  // Shell-specific
  shellId?: string;
  command?: string;
  cwd?: string;
  env?: Record<string, string>;
  
  // State
  status: 'running' | 'completed' | 'failed' | 'killed';
  output: string[];
  exitCode?: number;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
}
```

### 4. User Settings & Preferences

```typescript
interface UserData {
  userId: string;
  
  // Settings
  settings: {
    theme?: 'light' | 'dark' | 'auto';
    fontSize?: number;
    keyBindings?: 'default' | 'vim' | 'emacs';
    autoSave?: boolean;
    notifications?: boolean;
  };
  
  // MCP Configurations
  mcpServers: Record<string, McpServerConfig>;
  
  // Hooks
  hooks: {
    preToolUse?: HookConfig[];
    postToolUse?: HookConfig[];
    notification?: HookConfig[];
    userPromptSubmit?: HookConfig[];
  };
  
  // Output Styles
  outputStyles: Record<string, OutputStyle>;
  
  // Custom System Prompts
  systemPrompts: Record<string, string>;
  
  // API Keys (encrypted)
  apiKeys: {
    anthropic?: string;  // Encrypted
    github?: string;     // Encrypted
  };
}
```

### 5. Cache Data

```typescript
interface CacheEntry {
  key: string;
  value: any;
  category: 'response' | 'tool_result' | 'completion';
  sessionId?: string;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessedAt: Date;
}
```

## Storage Strategy

### Primary Storage: PostgreSQL

```sql
-- Main schema
CREATE SCHEMA claude_web;

-- Sessions with JSONB for flexibility
CREATE TABLE claude_web.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(500),
  model VARCHAR(50) DEFAULT 'sonnet',
  permission_mode VARCHAR(20) DEFAULT 'default',
  context_tokens_used INTEGER DEFAULT 0,
  context_limit INTEGER DEFAULT 200000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  
  INDEX idx_user_sessions (user_id, last_active_at DESC),
  INDEX idx_active_sessions (last_active_at) WHERE last_active_at > NOW() - INTERVAL '24 hours'
);

-- Messages stored efficiently
CREATE TABLE claude_web.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES claude_web.sessions(id) ON DELETE CASCADE,
  sequence_num INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  content TEXT,
  content_blocks JSONB, -- For structured content
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, sequence_num),
  INDEX idx_session_messages (session_id, sequence_num)
);

-- Todos linked to sessions
CREATE TABLE claude_web.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES claude_web.sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  active_form TEXT,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  INDEX idx_session_todos (session_id, position)
);

-- Background processes
CREATE TABLE claude_web.background_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES claude_web.sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  command TEXT,
  cwd TEXT,
  env JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  output TEXT[],
  exit_code INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  INDEX idx_session_processes (session_id, status),
  INDEX idx_running_processes (status) WHERE status = 'running'
);

-- User data
CREATE TABLE claude_web.users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  settings JSONB DEFAULT '{}',
  mcp_configs JSONB DEFAULT '{}',
  hooks JSONB DEFAULT '{}',
  output_styles JSONB DEFAULT '{}',
  system_prompts JSONB DEFAULT '{}',
  encrypted_keys JSONB DEFAULT '{}', -- Encrypted API keys
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool executions for audit trail
CREATE TABLE claude_web.tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES claude_web.sessions(id) ON DELETE CASCADE,
  message_id UUID REFERENCES claude_web.messages(id),
  tool_name VARCHAR(100) NOT NULL,
  input JSONB,
  output JSONB,
  status VARCHAR(20) NOT NULL,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  INDEX idx_session_tools (session_id, started_at DESC)
);
```

### Secondary Storage: Redis Cache

```typescript
// Cache structure
interface RedisSchema {
  // Session cache (TTL: 1 hour)
  'session:{sessionId}': Session;
  
  // Active queries (TTL: 5 minutes)
  'query:{sessionId}': {
    queryId: string;
    status: 'active' | 'interrupted';
    startedAt: Date;
  };
  
  // Response cache (TTL: 24 hours)
  'response:{hash}': {
    prompt: string;
    response: string;
    model: string;
    timestamp: Date;
  };
  
  // User presence (TTL: 30 seconds)
  'presence:{userId}': {
    sessionId: string;
    lastSeen: Date;
  };
  
  // Rate limiting (TTL: varies)
  'ratelimit:{userId}:{action}': number;
}
```

### File Storage

```
/data/
├── sessions/
│   └── {session_id}/
│       ├── transcript.md        # Human-readable transcript
│       ├── attachments/         # User uploads
│       │   └── {file_id}
│       └── exports/            # Export formats
│           ├── conversation.json
│           └── conversation.pdf
├── users/
│   └── {user_id}/
│       ├── workspace/          # User's working directory
│       └── templates/          # Custom templates
└── temp/
    ├── uploads/               # Temporary upload storage
    └── processing/            # Files being processed
```

## Persistence Operations

### Save Session State

```typescript
class SessionPersistence {
  async saveSession(session: Session): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update session metadata
      await client.query(`
        UPDATE claude_web.sessions 
        SET last_active_at = NOW(),
            context_tokens_used = $2,
            permission_mode = $3,
            model = $4,
            metadata = $5
        WHERE id = $1
      `, [
        session.id,
        session.contextTokensUsed,
        session.permissionMode,
        session.model,
        JSON.stringify(session.metadata)
      ]);
      
      // Save new messages (incremental)
      for (const message of session.newMessages) {
        await client.query(`
          INSERT INTO claude_web.messages 
          (session_id, sequence_num, type, content, content_blocks, metadata)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          session.id,
          message.sequenceNum,
          message.type,
          message.content,
          JSON.stringify(message.contentBlocks),
          JSON.stringify(message.metadata)
        ]);
      }
      
      // Update todos
      await this.saveTodos(client, session.id, session.todos);
      
      // Update cache
      await this.redis.setex(
        `session:${session.id}`,
        3600, // 1 hour TTL
        JSON.stringify(session)
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async saveIncremental(sessionId: string, delta: SessionDelta): Promise<void> {
    // Save only changes for efficiency
    if (delta.messages?.length) {
      await this.appendMessages(sessionId, delta.messages);
    }
    if (delta.todos) {
      await this.updateTodos(sessionId, delta.todos);
    }
    if (delta.context) {
      await this.updateContext(sessionId, delta.context);
    }
  }
}
```

### Restore Session State

```typescript
class SessionRecovery {
  async recoverSession(sessionId: string): Promise<Session> {
    // Try cache first
    const cached = await this.redis.get(`session:${sessionId}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Load from database
    const client = await this.pool.connect();
    try {
      // Get session metadata
      const sessionResult = await client.query(`
        SELECT * FROM claude_web.sessions WHERE id = $1
      `, [sessionId]);
      
      if (sessionResult.rows.length === 0) {
        throw new Error('Session not found');
      }
      
      const sessionData = sessionResult.rows[0];
      
      // Load messages
      const messagesResult = await client.query(`
        SELECT * FROM claude_web.messages 
        WHERE session_id = $1 
        ORDER BY sequence_num
      `, [sessionId]);
      
      // Load todos
      const todosResult = await client.query(`
        SELECT * FROM claude_web.todos 
        WHERE session_id = $1 
        ORDER BY position
      `, [sessionId]);
      
      // Load active processes
      const processesResult = await client.query(`
        SELECT * FROM claude_web.background_processes
        WHERE session_id = $1 AND status = 'running'
      `, [sessionId]);
      
      // Reconstruct session
      const session: Session = {
        id: sessionData.id,
        userId: sessionData.user_id,
        messages: messagesResult.rows.map(this.mapMessage),
        todos: todosResult.rows.map(this.mapTodo),
        backgroundProcesses: processesResult.rows.map(this.mapProcess),
        model: sessionData.model,
        permissionMode: sessionData.permission_mode,
        contextTokensUsed: sessionData.context_tokens_used,
        contextLimit: sessionData.context_limit,
        metadata: sessionData.metadata,
        createdAt: sessionData.created_at,
        lastActiveAt: sessionData.last_active_at,
      };
      
      // Rebuild SDK query state if needed
      await this.rebuildQueryState(session);
      
      // Cache for next time
      await this.redis.setex(
        `session:${sessionId}`,
        3600,
        JSON.stringify(session)
      );
      
      return session;
    } finally {
      client.release();
    }
  }
  
  private async rebuildQueryState(session: Session): Promise<void> {
    // Check if there was an active query
    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage?.type === 'user' && !this.hasResponse(session, lastMessage)) {
      // Re-submit the query to SDK
      await this.resubmitQuery(session, lastMessage);
    }
  }
}
```

### Automatic Persistence

```typescript
class AutoPersistence {
  private pendingSaves = new Map<string, SessionDelta>();
  private saveInterval = 5000; // 5 seconds
  
  constructor(private persistence: SessionPersistence) {
    this.startBatchSaving();
  }
  
  markDirty(sessionId: string, delta: SessionDelta): void {
    const existing = this.pendingSaves.get(sessionId);
    if (existing) {
      this.mergeDelta(existing, delta);
    } else {
      this.pendingSaves.set(sessionId, delta);
    }
  }
  
  private startBatchSaving(): void {
    setInterval(async () => {
      const saves = Array.from(this.pendingSaves.entries());
      this.pendingSaves.clear();
      
      for (const [sessionId, delta] of saves) {
        try {
          await this.persistence.saveIncremental(sessionId, delta);
        } catch (error) {
          console.error(`Failed to save session ${sessionId}:`, error);
          // Re-add to pending for retry
          this.pendingSaves.set(sessionId, delta);
        }
      }
    }, this.saveInterval);
  }
  
  async flush(): Promise<void> {
    // Force immediate save of all pending changes
    const saves = Array.from(this.pendingSaves.entries());
    this.pendingSaves.clear();
    
    await Promise.all(
      saves.map(([id, delta]) => 
        this.persistence.saveIncremental(id, delta)
      )
    );
  }
}
```

## Recovery Scenarios

### 1. Server Crash Recovery

```typescript
class CrashRecovery {
  async recoverFromCrash(): Promise<void> {
    console.log('Starting crash recovery...');
    
    // 1. Find all active sessions
    const activeSessions = await this.db.query(`
      SELECT id FROM claude_web.sessions 
      WHERE last_active_at > NOW() - INTERVAL '24 hours'
    `);
    
    // 2. Recover each session
    for (const session of activeSessions.rows) {
      try {
        await this.recoverSession(session.id);
      } catch (error) {
        console.error(`Failed to recover session ${session.id}:`, error);
      }
    }
    
    // 3. Resume background processes
    const runningProcesses = await this.db.query(`
      SELECT * FROM claude_web.background_processes
      WHERE status = 'running'
    `);
    
    for (const process of runningProcesses.rows) {
      await this.resumeProcess(process);
    }
    
    // 4. Clean up stale data
    await this.cleanupStaleData();
    
    console.log('Crash recovery completed');
  }
}
```

### 2. Connection Recovery

```typescript
class ConnectionRecovery {
  async handleReconnect(
    userId: string, 
    sessionId: string,
    lastMessageId?: string
  ): Promise<ReconnectResult> {
    // Load session state
    const session = await this.sessionRecovery.recoverSession(sessionId);
    
    // Find messages since last seen
    const newMessages = lastMessageId 
      ? session.messages.filter(m => m.id > lastMessageId)
      : [];
    
    // Check for active operations
    const activeQuery = await this.redis.get(`query:${sessionId}`);
    
    return {
      session,
      newMessages,
      activeQuery: activeQuery ? JSON.parse(activeQuery) : null,
      todos: session.todos,
      backgroundProcesses: session.backgroundProcesses,
    };
  }
}
```

### 3. Partial State Recovery

```typescript
class PartialRecovery {
  async recoverPartialState(
    sessionId: string,
    components: ('messages' | 'todos' | 'processes')[]
  ): Promise<Partial<Session>> {
    const result: Partial<Session> = {};
    
    for (const component of components) {
      switch (component) {
        case 'messages':
          result.messages = await this.loadMessages(sessionId);
          break;
        case 'todos':
          result.todos = await this.loadTodos(sessionId);
          break;
        case 'processes':
          result.backgroundProcesses = await this.loadProcesses(sessionId);
          break;
      }
    }
    
    return result;
  }
}
```

## Data Integrity

### Consistency Checks

```typescript
class DataIntegrity {
  async validateSession(sessionId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    
    // Check message sequence
    const messages = await this.loadMessages(sessionId);
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].sequenceNum !== i) {
        errors.push(`Message sequence broken at position ${i}`);
      }
    }
    
    // Validate tool executions
    const tools = await this.loadToolExecutions(sessionId);
    for (const tool of tools) {
      if (tool.status === 'completed' && !tool.output) {
        errors.push(`Tool ${tool.id} marked complete but has no output`);
      }
    }
    
    // Check todo consistency
    const todos = await this.loadTodos(sessionId);
    const inProgress = todos.filter(t => t.status === 'in_progress');
    if (inProgress.length > 1) {
      errors.push(`Multiple todos marked as in_progress`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  async repairSession(sessionId: string): Promise<void> {
    const validation = await this.validateSession(sessionId);
    
    for (const error of validation.errors) {
      await this.repairError(sessionId, error);
    }
  }
}
```

## Backup & Export

### Automatic Backups

```typescript
class BackupManager {
  async scheduleBackups(): void {
    // Daily backups
    cron.schedule('0 2 * * *', async () => {
      await this.performBackup('daily');
    });
    
    // Weekly full backup
    cron.schedule('0 3 * * 0', async () => {
      await this.performFullBackup();
    });
  }
  
  async performBackup(type: 'daily' | 'weekly' | 'full'): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Export sessions
    await this.exportSessions(`backup-${type}-${timestamp}`);
    
    // Compress and store
    await this.compressAndStore(`backup-${type}-${timestamp}`);
    
    // Clean old backups
    await this.cleanOldBackups(type);
  }
}
```

### Export Formats

```typescript
class ExportManager {
  async exportSession(
    sessionId: string, 
    format: 'json' | 'markdown' | 'pdf'
  ): Promise<Buffer> {
    const session = await this.loadFullSession(sessionId);
    
    switch (format) {
      case 'json':
        return this.exportAsJSON(session);
      case 'markdown':
        return this.exportAsMarkdown(session);
      case 'pdf':
        return this.exportAsPDF(session);
    }
  }
  
  private exportAsMarkdown(session: Session): Buffer {
    let content = `# Claude Code Session\n\n`;
    content += `**Session ID**: ${session.id}\n`;
    content += `**Created**: ${session.createdAt}\n`;
    content += `**Model**: ${session.model}\n\n`;
    
    for (const message of session.messages) {
      content += `## ${message.type === 'user' ? 'User' : 'Assistant'}\n`;
      content += `${message.content}\n\n`;
      
      if (message.metadata.toolUses) {
        for (const tool of message.metadata.toolUses) {
          content += `### Tool: ${tool.toolName}\n`;
          content += `\`\`\`json\n${JSON.stringify(tool.input, null, 2)}\n\`\`\`\n`;
          if (tool.output) {
            content += `**Output**:\n`;
            content += `\`\`\`\n${tool.output}\n\`\`\`\n`;
          }
        }
      }
    }
    
    return Buffer.from(content);
  }
}
```