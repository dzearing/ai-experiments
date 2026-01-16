# 05: Agent Proxy Package

## Problem

Currently, the ideate server runs all agent sessions (IdeaAgent, PlanAgent, ExecutionAgent, etc.) in its own process. This causes issues:

1. **Process isolation**: Killing an agent can't cleanly terminate spawned subprocesses
2. **Event loop sharing**: All agents share the same Node.js event loop
3. **No remote execution**: Can't run agents on different machines
4. **Cleanup difficulty**: If an agent spawns processes (e.g., ExecutionAgent), they persist even after aborting

## Solution

Create `packages/agent-proxy/` - an independently testable package that provides:

1. **ProxyManager** - orchestrates multiple proxy processes from the host (ideate server)
2. **Proxy Process** - forked child process that runs a single agent session in isolation
3. **ProcessRegistry** - tracks and manages all subprocesses spawned by the agent

## Architecture

```
Ideate Server Process
└── ProxyManager (in-process manager object)
    ├── fork() → Proxy Process 1 → agent session → spawns subprocesses
    ├── fork() → Proxy Process 2 → agent session → spawns subprocesses
    └── ...

Communication: Node IPC (process.send / process.on('message'))
```

**Key Design Decisions:**

- **One session per proxy process** - clean isolation; killing a process terminates the session and all its subprocesses
- **Node `fork()`** - built-in IPC, shares code, automatic serialization
- **ProcessRegistry wraps SDK's `spawnClaudeCodeProcess`** - intercepts all spawns to track PIDs

## Package Structure

```
packages/agent-proxy/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                      # Public exports
│   ├── manager/
│   │   ├── ProxyManager.ts           # Orchestrator (runs in host process)
│   │   └── index.ts
│   ├── process/
│   │   ├── ProxyProcess.ts           # Entry point for forked process
│   │   ├── AgentRunner.ts            # Wraps SDK query() execution
│   │   └── index.ts
│   ├── registry/
│   │   ├── ProcessRegistry.ts        # Tracks spawned subprocesses
│   │   └── index.ts
│   ├── protocol/
│   │   ├── messages.ts               # IPC message type definitions
│   │   └── index.ts
│   └── types/
│       ├── session.ts                # Session configuration types
│       └── index.ts
└── tests/
    ├── ProxyManager.test.ts
    ├── ProcessRegistry.test.ts
    └── integration.test.ts
```

## Core Interfaces

### Session Configuration

```typescript
interface AgentSessionConfig {
  sessionId: string;
  agentType: 'idea' | 'plan' | 'execution' | 'import' | 'facilitator';
  userId: string;
  workspaceId?: string;
  cwd?: string;
  model?: string;
  systemPrompt: string;
  sdkOptions?: {
    maxTurns?: number;
    permissionMode?: string;
    tools?: string[];
    mcpServers?: Record<string, unknown>;
  };
}
```

### Process Info

```typescript
interface ProcessInfo {
  pid: number;
  sessionId: string;
  command: string;
  args: string[];
  cwd: string;
  startedAt: number;
  status: 'running' | 'completed' | 'killed' | 'error';
  exitCode?: number;
  error?: string;
}
```

## IPC Protocol

### Host → Proxy Messages

| Message | Description |
|---------|-------------|
| `session:start` | Start session with config and system prompt |
| `session:prompt` | Send user message to agent |
| `session:abort` | Cancel current execution (triggers AbortController) |
| `process:list` | Request list of spawned subprocesses |
| `process:kill` | Kill specific subprocess by PID |
| `process:kill_all` | Kill all subprocesses for this session |

### Proxy → Host Messages

| Message | Description |
|---------|-------------|
| `session:started` | Session initialized and ready |
| `session:idle` | Agent finished, waiting for next prompt |
| `stream:text` | Text chunk from assistant response |
| `stream:thinking` | Extended thinking content |
| `stream:tool_start` | Tool invocation started |
| `stream:tool_end` | Tool completed with result |
| `stream:complete` | Response finished with token usage |
| `stream:error` | Error occurred |
| `process:spawned` | New subprocess started (includes ProcessInfo) |
| `process:exited` | Subprocess ended (includes exit code) |
| `process:list_response` | Response to process:list |

## Implementation Steps

### Phase 1: Package Foundation

1. **Create package structure**
   - `packages/agent-proxy/` with standard layout
   - Configure `package.json` with `@anthropic-ai/claude-agent-sdk` dependency
   - Configure `tsconfig.json` extending root
   - Add to `pnpm-workspace.yaml`

2. **Define protocol types** (`protocol/messages.ts`)
   - All IPC message interfaces
   - Type guards for runtime validation
   - Union types for discriminated unions

3. **Define session types** (`types/session.ts`)
   - `AgentSessionConfig`
   - `ProcessInfo`
   - Status enums

### Phase 2: ProcessRegistry

4. **Implement ProcessRegistry** (`registry/ProcessRegistry.ts`)
   ```typescript
   class ProcessRegistry extends EventEmitter {
     createTrackedSpawn(sessionId: string): SpawnFunction
     listProcesses(): ProcessInfo[]
     killProcess(pid: number, signal?: 'SIGTERM' | 'SIGKILL'): boolean
     killAll(signal?: 'SIGTERM' | 'SIGKILL'): number
     cleanup(maxAgeMs?: number): void
   }
   ```
   - Wraps `child_process.spawn()`
   - Tracks all PIDs with metadata
   - Emits events: `spawned`, `exited`, `killed`, `error`
   - Returns function compatible with SDK's `spawnClaudeCodeProcess` option

### Phase 3: Proxy Process

5. **Implement AgentRunner** (`process/AgentRunner.ts`)
   - Accepts config, system prompt, and IPC send function
   - Calls SDK `query()` with tracked spawn function
   - Processes SDK stream messages
   - Forwards events via IPC
   - Handles abort signal

6. **Implement ProxyProcess** (`process/ProxyProcess.ts`)
   - Entry point for forked child
   - Listens for IPC messages from parent
   - Creates ProcessRegistry instance
   - On `session:start`: initialize, respond with `session:started`
   - On `session:prompt`: run AgentRunner
   - On `session:abort`: trigger abort
   - On `process:*`: delegate to registry

### Phase 4: ProxyManager

7. **Implement ProxyManager** (`manager/ProxyManager.ts`)
   ```typescript
   class ProxyManager extends EventEmitter {
     startSession(config: AgentSessionConfig): Promise<string>
     sendPrompt(sessionId: string, message: string): void
     abortSession(sessionId: string): void
     killSession(sessionId: string, killProcesses?: boolean): Promise<void>
     listProcesses(sessionId: string): Promise<ProcessInfo[]>
     listSessions(): SessionInfo[]
   }
   ```
   - `fork()` new process per session
   - Route IPC messages
   - Track active sessions
   - Emit events for consumers

### Phase 5: Testing

8. **Unit tests**
   - ProcessRegistry with mock spawn
   - Protocol message type guards
   - ProxyManager session lifecycle

9. **Integration tests**
   - Full flow: start session → prompt → stream → complete
   - Subprocess spawn and tracking
   - Abort mid-execution
   - Kill session with process cleanup

## Usage Example

```typescript
import { ProxyManager } from '@claude-flow/agent-proxy';

const manager = new ProxyManager();

// Start a session
const sessionId = await manager.startSession({
  sessionId: 'exec-123',
  agentType: 'execution',
  userId: 'user-1',
  cwd: '/path/to/workspace',
  systemPrompt: 'You are an execution agent...',
  sdkOptions: {
    maxTurns: 300,
    permissionMode: 'bypassPermissions',
  },
});

// Subscribe to events
manager.on('stream:text', (sessionId, text) => {
  console.log(`[${sessionId}] ${text}`);
});

manager.on('process:spawned', (sessionId, processInfo) => {
  console.log(`[${sessionId}] Spawned: ${processInfo.command}`);
});

// Send a prompt
manager.sendPrompt(sessionId, 'Implement the authentication module');

// Later: abort if needed
manager.abortSession(sessionId);

// Or kill entirely (terminates all spawned processes)
await manager.killSession(sessionId, true);
```

## Future: Ideate Integration

After the package is complete and tested, integrate with ideate server:

1. **Modify `ExecutionAgentService`**
   - Replace direct `query()` calls with `ProxyManager.startSession()`
   - Wire stream events to existing WebSocket broadcast
   - Use `killSession()` for abort with process cleanup

2. **Initialize ProxyManager in server startup** (`index.ts`)
   - Create single ProxyManager instance
   - Share across agent services

3. **Update package.json**
   - Add `@claude-flow/agent-proxy` dependency

## Dependencies

```json
{
  "name": "@claude-flow/agent-proxy",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.76"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "vitest": "^3.2.4"
  }
}
```

## Verification Checklist

- [ ] Package builds without errors (`pnpm build`)
- [ ] Unit tests pass (`pnpm test`)
- [ ] ProcessRegistry correctly tracks spawned processes
- [ ] ProxyManager can start/stop sessions
- [ ] IPC messages flow correctly in both directions
- [ ] Abort properly cancels running agent
- [ ] Kill session terminates all spawned subprocesses
- [ ] Integration with ideate server works (future)
