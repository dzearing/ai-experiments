# Server-Side Slash Command System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a futureproof, extensible slash command system for apps/ideate that mirrors Claude Code's architecture, with all commands executing server-side for consistency and plugin support.

**Architecture:** Create a server-side `SlashCommandRegistry` that holds registered commands (built-in + plugin-loaded). Commands execute server-side via WebSocket. The client discovers available commands from server initialization and routes all `/command` input to the server. Results are returned and displayed in chat.

**Tech Stack:** TypeScript, WebSocket messaging, Claude Agent SDK types for compatibility, Express/Node.js server.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ChatInput ──→ detects /command ──→ useAgentSocket.executeCommand() │
│                                              │                       │
│                                              ▼                       │
│                              WebSocket { type: 'slash_command',      │
│                                          command: 'context',         │
│                                          args: '' }                  │
│                                                                      │
│  ◄── receives { type: 'command_result', result: {...} } ◄───────────│
│                     │                                                │
│                     ▼                                                │
│            Display result in chat                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVER                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  WebSocketHandler ──→ SlashCommandRegistry.execute(command, args,   │
│                                                    context)          │
│                              │                                       │
│                              ▼                                       │
│                    ┌─────────────────┐                               │
│                    │ Command Handler │                               │
│                    │  (registered)   │                               │
│                    └─────────────────┘                               │
│                              │                                       │
│                              ▼                                       │
│              SlashCommandResult { content, format }                  │
│                                                                      │
│  Built-in handlers:        Plugin handlers:                          │
│  - /context                - (discovered at startup)                 │
│  - /help                   - (loaded from plugin dirs)               │
│  - /clear                                                            │
│  - /model                                                            │
│  - /mcp                                                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Types (SDK-Compatible)

```typescript
// Matches Claude Code SDK SlashCommand type
interface SlashCommand {
  name: string;           // Command name without /
  description: string;    // Human-readable description
  argumentHint: string;   // Usage hint, e.g. "<file>" or "" for no args
}

// Server-side handler interface
interface SlashCommandHandler {
  command: SlashCommand;
  execute(args: string, context: CommandContext): Promise<SlashCommandResult>;
}

// Execution context (what the handler has access to)
interface CommandContext {
  userId: string;
  sessionId: string;
  ideaId?: string;
  tokenUsage?: TokenUsage;
  sessionInfo?: SessionInfo;
  messageCount: number;
  // Add more as needed
}

// Result returned by handlers
interface SlashCommandResult {
  content: string;        // The result content
  format: 'markdown' | 'text' | 'json';
  ephemeral?: boolean;    // If true, don't persist to chat history
}

// WebSocket message types
interface SlashCommandRequest {
  type: 'slash_command';
  command: string;
  args: string;
}

interface SlashCommandResponse {
  type: 'command_result';
  command: string;
  result: SlashCommandResult;
  error?: string;
}

interface CommandListResponse {
  type: 'available_commands';
  commands: SlashCommand[];
}
```

---

## Task 1: Create Shared Slash Command Types

**Files:**
- Create: `apps/ideate/server/src/shared/slashCommandTypes.ts`

Create the shared type definitions that both server and client will use.

```typescript
/**
 * Slash command types - compatible with Claude Code SDK
 */

/**
 * Slash command definition (matches SDK SlashCommand type)
 */
export interface SlashCommand {
  /** Command name without leading slash */
  name: string;
  /** Human-readable description */
  description: string;
  /** Usage hint for arguments, e.g. "<file>" or "" for no args */
  argumentHint: string;
}

/**
 * Context available to command handlers during execution
 */
export interface CommandContext {
  /** User executing the command */
  userId: string;
  /** Current session ID */
  sessionId: string;
  /** Idea ID if in idea context */
  ideaId?: string;
  /** Current token usage for the session */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
  };
  /** SDK session info */
  sessionInfo?: {
    sessionId?: string;
    model?: string;
    tools?: string[];
    mcpServers?: string[];
  };
  /** Number of messages in current session */
  messageCount: number;
}

/**
 * Result returned by command handlers
 */
export interface SlashCommandResult {
  /** The result content to display */
  content: string;
  /** Format of the content */
  format: 'markdown' | 'text' | 'json';
  /** If true, show but don't persist to chat history */
  ephemeral?: boolean;
}

/**
 * Handler interface for implementing slash commands
 */
export interface SlashCommandHandler {
  /** Command metadata */
  command: SlashCommand;
  /** Execute the command */
  execute(args: string, context: CommandContext): Promise<SlashCommandResult>;
}

// WebSocket message types

export interface SlashCommandRequest {
  type: 'slash_command';
  command: string;
  args: string;
}

export interface SlashCommandResponse {
  type: 'command_result';
  command: string;
  result: SlashCommandResult;
  error?: string;
}

export interface AvailableCommandsMessage {
  type: 'available_commands';
  commands: SlashCommand[];
}
```

**Verification:** `cd apps/ideate/server && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/server/src/shared/slashCommandTypes.ts && git commit -m "feat(ideate): add slash command type definitions"`

---

## Task 2: Create SlashCommandRegistry

**Files:**
- Create: `apps/ideate/server/src/services/SlashCommandRegistry.ts`

The registry holds all registered commands and routes execution.

```typescript
import type {
  SlashCommand,
  SlashCommandHandler,
  SlashCommandResult,
  CommandContext,
} from '../shared/slashCommandTypes.js';

/**
 * Registry for slash commands.
 * Singleton that holds all registered command handlers.
 */
export class SlashCommandRegistry {
  private static instance: SlashCommandRegistry;
  private handlers: Map<string, SlashCommandHandler> = new Map();

  private constructor() {}

  static getInstance(): SlashCommandRegistry {
    if (!SlashCommandRegistry.instance) {
      SlashCommandRegistry.instance = new SlashCommandRegistry();
    }
    return SlashCommandRegistry.instance;
  }

  /**
   * Register a command handler
   */
  register(handler: SlashCommandHandler): void {
    const name = handler.command.name.toLowerCase();
    if (this.handlers.has(name)) {
      console.warn(`[SlashCommandRegistry] Overwriting existing handler for /${name}`);
    }
    this.handlers.set(name, handler);
    console.log(`[SlashCommandRegistry] Registered /${name}`);
  }

  /**
   * Unregister a command
   */
  unregister(name: string): boolean {
    return this.handlers.delete(name.toLowerCase());
  }

  /**
   * Get all available commands
   */
  getCommands(): SlashCommand[] {
    return Array.from(this.handlers.values()).map(h => h.command);
  }

  /**
   * Check if a command exists
   */
  hasCommand(name: string): boolean {
    return this.handlers.has(name.toLowerCase());
  }

  /**
   * Execute a command
   */
  async execute(
    name: string,
    args: string,
    context: CommandContext
  ): Promise<SlashCommandResult> {
    const handler = this.handlers.get(name.toLowerCase());

    if (!handler) {
      return {
        content: `Unknown command: /${name}\n\nType /help to see available commands.`,
        format: 'markdown',
      };
    }

    try {
      return await handler.execute(args, context);
    } catch (error) {
      console.error(`[SlashCommandRegistry] Error executing /${name}:`, error);
      return {
        content: `Error executing /${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        format: 'text',
      };
    }
  }
}

// Export singleton accessor
export function getCommandRegistry(): SlashCommandRegistry {
  return SlashCommandRegistry.getInstance();
}
```

**Verification:** `cd apps/ideate/server && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/server/src/services/SlashCommandRegistry.ts && git commit -m "feat(ideate): add SlashCommandRegistry for server-side commands"`

---

## Task 3: Create Built-in Command Handlers

**Files:**
- Create: `apps/ideate/server/src/commands/helpCommand.ts`
- Create: `apps/ideate/server/src/commands/clearCommand.ts`
- Create: `apps/ideate/server/src/commands/contextCommand.ts`
- Create: `apps/ideate/server/src/commands/index.ts`

### helpCommand.ts

```typescript
import type { SlashCommandHandler, CommandContext, SlashCommandResult } from '../shared/slashCommandTypes.js';
import { getCommandRegistry } from '../services/SlashCommandRegistry.js';

export const helpCommand: SlashCommandHandler = {
  command: {
    name: 'help',
    description: 'Show available commands',
    argumentHint: '',
  },

  async execute(_args: string, _context: CommandContext): Promise<SlashCommandResult> {
    const registry = getCommandRegistry();
    const commands = registry.getCommands();

    const lines = ['## Available Commands\n'];

    for (const cmd of commands.sort((a, b) => a.name.localeCompare(b.name))) {
      const usage = cmd.argumentHint ? ` ${cmd.argumentHint}` : '';
      lines.push(`- **/${cmd.name}**${usage} - ${cmd.description}`);
    }

    lines.push('\nType a command to execute it.');

    return {
      content: lines.join('\n'),
      format: 'markdown',
    };
  },
};
```

### clearCommand.ts

```typescript
import type { SlashCommandHandler, CommandContext, SlashCommandResult } from '../shared/slashCommandTypes.js';

export const clearCommand: SlashCommandHandler = {
  command: {
    name: 'clear',
    description: 'Clear chat history',
    argumentHint: '',
  },

  async execute(_args: string, _context: CommandContext): Promise<SlashCommandResult> {
    // The actual clearing is handled by the WebSocket handler
    // This just returns a confirmation
    return {
      content: 'Chat history cleared.',
      format: 'text',
      ephemeral: true,
    };
  },
};
```

### contextCommand.ts

```typescript
import type { SlashCommandHandler, CommandContext, SlashCommandResult } from '../shared/slashCommandTypes.js';

/**
 * Model context limits
 */
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  'claude-opus-4-5-20251101': 200000,
  'claude-sonnet-4-20250514': 200000,
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-opus-20240229': 200000,
  'claude-3-sonnet-20240229': 200000,
  'claude-3-haiku-20240307': 200000,
  'default': 200000,
};

const ESTIMATED_SYSTEM_OVERHEAD = 3000;
const ESTIMATED_TOOL_OVERHEAD = 30;

function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}

function generateProgressBar(percentage: number, width = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '\u2593'.repeat(filled) + '\u2591'.repeat(empty);
}

function getUsageIndicator(percentage: number): string {
  if (percentage < 50) return '\u{1F7E2}'; // Green
  if (percentage < 80) return '\u{1F7E1}'; // Yellow
  return '\u{1F534}'; // Red
}

export const contextCommand: SlashCommandHandler = {
  command: {
    name: 'context',
    description: 'Show context window usage and session info',
    argumentHint: '',
  },

  async execute(_args: string, context: CommandContext): Promise<SlashCommandResult> {
    const model = context.sessionInfo?.model || 'unknown';
    const maxTokens = MODEL_CONTEXT_LIMITS[model] || MODEL_CONTEXT_LIMITS.default;

    const inputTokens = context.tokenUsage?.inputTokens || 0;
    const outputTokens = context.tokenUsage?.outputTokens || 0;
    const messageTokens = inputTokens + outputTokens;

    const toolCount = context.sessionInfo?.tools?.length || 0;
    const systemOverhead = ESTIMATED_SYSTEM_OVERHEAD + (toolCount * ESTIMATED_TOOL_OVERHEAD);

    const totalTokens = messageTokens + systemOverhead;
    const usagePercent = Math.round((totalTokens / maxTokens) * 100 * 10) / 10;

    const lines: string[] = [];

    // Header
    lines.push('## Context Usage\n');

    const indicator = getUsageIndicator(usagePercent);
    const bar = generateProgressBar(usagePercent);

    lines.push(`${indicator} **${model}**`);
    lines.push(`\`${bar}\` ${formatTokenCount(totalTokens)}/${formatTokenCount(maxTokens)} tokens (${usagePercent.toFixed(1)}%)\n`);

    // Category breakdown
    lines.push('### Estimated Usage by Category\n');
    lines.push(`- **System Prompt**: ~${formatTokenCount(ESTIMATED_SYSTEM_OVERHEAD)} (${((ESTIMATED_SYSTEM_OVERHEAD / maxTokens) * 100).toFixed(1)}%)`);

    if (toolCount > 0) {
      const toolTokens = toolCount * ESTIMATED_TOOL_OVERHEAD;
      lines.push(`- **Tools** (${toolCount}): ~${formatTokenCount(toolTokens)} (${((toolTokens / maxTokens) * 100).toFixed(1)}%)`);
    }

    lines.push(`- **Messages (Input)**: ${formatTokenCount(inputTokens)} (${((inputTokens / maxTokens) * 100).toFixed(1)}%)`);
    lines.push(`- **Messages (Output)**: ${formatTokenCount(outputTokens)} (${((outputTokens / maxTokens) * 100).toFixed(1)}%)`);

    // MCP servers
    if (context.sessionInfo?.mcpServers && context.sessionInfo.mcpServers.length > 0) {
      lines.push(`- **MCP Servers** (${context.sessionInfo.mcpServers.length}): ~${formatTokenCount(context.sessionInfo.mcpServers.length * 50)}`);
    }

    // Session info
    lines.push('\n### Session Info\n');
    lines.push(`- **Session ID**: \`${(context.sessionId || 'unknown').slice(0, 8)}...\``);
    lines.push(`- **Messages**: ${context.messageCount}`);

    // Remaining capacity
    const remaining = maxTokens - totalTokens;
    const remainingPercent = (remaining / maxTokens) * 100;
    lines.push(`\n**Remaining capacity**: ${formatTokenCount(remaining)} tokens (${remainingPercent.toFixed(1)}%)`);

    return {
      content: lines.join('\n'),
      format: 'markdown',
    };
  },
};
```

### index.ts (command registration)

```typescript
import { getCommandRegistry } from '../services/SlashCommandRegistry.js';
import { helpCommand } from './helpCommand.js';
import { clearCommand } from './clearCommand.js';
import { contextCommand } from './contextCommand.js';

/**
 * Register all built-in commands
 */
export function registerBuiltInCommands(): void {
  const registry = getCommandRegistry();

  registry.register(helpCommand);
  registry.register(clearCommand);
  registry.register(contextCommand);

  console.log('[Commands] Built-in commands registered');
}

export { helpCommand, clearCommand, contextCommand };
```

**Verification:** `cd apps/ideate/server && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/server/src/commands && git commit -m "feat(ideate): add built-in slash command handlers (help, clear, context)"`

---

## Task 4: Integrate Commands into Server Startup

**Files:**
- Modify: `apps/ideate/server/src/index.ts` (or wherever server initializes)

Add command registration to server startup:

```typescript
import { registerBuiltInCommands } from './commands/index.js';

// During server initialization
registerBuiltInCommands();
```

**Verification:** `cd apps/ideate/server && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/server/src/index.ts && git commit -m "feat(ideate): register slash commands on server startup"`

---

## Task 5: Add Slash Command Handling to WebSocket Handler

**Files:**
- Modify: `apps/ideate/server/src/websocket/IdeaAgentWebSocketHandler.ts`

Add handling for `slash_command` message type:

1. Import the registry and types
2. Add case for `slash_command` in message handler
3. Build CommandContext from client state
4. Execute command and send result

```typescript
// In handleMessage switch:
case 'slash_command': {
  const commandContext: CommandContext = {
    userId: client.userId,
    sessionId: chatId,
    ideaId: client.ideaId || undefined,
    tokenUsage: client.tokenUsage,
    sessionInfo: client.sessionInfo,
    messageCount: client.messageCount || 0,
  };

  const result = await getCommandRegistry().execute(
    clientMessage.command,
    clientMessage.args || '',
    commandContext
  );

  // Handle special commands
  if (clientMessage.command === 'clear') {
    await this.handleClearHistory(client);
  }

  this.sendToClient(ws, {
    type: 'command_result',
    command: clientMessage.command,
    result,
  });
  break;
}
```

Also send available commands in the connection/init phase.

**Verification:** `cd apps/ideate/server && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/server/src/websocket/IdeaAgentWebSocketHandler.ts && git commit -m "feat(ideate): add slash command execution to WebSocket handler"`

---

## Task 6: Update Client Types and useAgentSocket

**Files:**
- Create: `apps/ideate/client/src/types/slashCommandTypes.ts` (copy from server shared)
- Modify: `apps/ideate/client/src/hooks/useAgentSocket.ts`

Add:
1. SlashCommand type (for available commands from server)
2. State for `availableCommands: SlashCommand[]`
3. Handle `available_commands` and `command_result` message types
4. Add `executeCommand(name: string, args: string)` method

```typescript
// New state
const [availableCommands, setAvailableCommands] = useState<SlashCommand[]>([]);

// In handleMessage:
case 'available_commands':
  if (data.commands) {
    setAvailableCommands(data.commands);
  }
  break;

case 'command_result':
  if (data.result) {
    // Add result as assistant message
    addMessage({
      id: `cmd-${Date.now()}`,
      role: 'assistant',
      content: data.result.content,
      timestamp: Date.now(),
    });
  }
  break;

// New method
const executeCommand = useCallback((command: string, args: string) => {
  if (wsRef.current?.readyState === WebSocket.OPEN) {
    wsRef.current.send(JSON.stringify({
      type: 'slash_command',
      command,
      args,
    }));
  }
}, []);

// Return availableCommands and executeCommand
```

**Verification:** `cd apps/ideate/client && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/client/src && git commit -m "feat(ideate): add client-side slash command support to useAgentSocket"`

---

## Task 7: Refactor useChatCommands to Use Server Commands

**Files:**
- Modify: `apps/ideate/client/src/hooks/useChatCommands.tsx`

Change from local command handling to server-based:
1. Accept `availableCommands: SlashCommand[]` and `executeCommand` from agent socket
2. Convert SDK SlashCommand[] to UI SlashCommand[] format
3. Route all commands through executeCommand instead of local handlers

```typescript
export interface UseChatCommandsOptions {
  /** Available commands from server */
  availableCommands: SlashCommand[];
  /** Execute command via server */
  executeCommand: (command: string, args: string) => void;
  /** Additional client-only commands (rarely needed) */
  clientOnlyCommands?: UISlashCommand[];
}

export function useChatCommands({
  availableCommands,
  executeCommand,
  clientOnlyCommands = [],
}: UseChatCommandsOptions) {
  // Convert server commands to UI format
  const commands: UISlashCommand[] = useMemo(() => [
    ...availableCommands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      usage: cmd.argumentHint ? `/${cmd.name} ${cmd.argumentHint}` : `/${cmd.name}`,
    })),
    ...clientOnlyCommands,
  ], [availableCommands, clientOnlyCommands]);

  const handleCommand = useCallback((command: string, args: string): SlashCommandResult => {
    // Check for client-only commands first
    const clientCmd = clientOnlyCommands.find(c => c.name === command);
    if (clientCmd?.handler) {
      return clientCmd.handler(args);
    }

    // Route to server
    executeCommand(command, args);
    return { handled: true, clearInput: true };
  }, [executeCommand, clientOnlyCommands]);

  return { commands, handleCommand };
}
```

**Verification:** `cd apps/ideate/client && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/client/src/hooks/useChatCommands.tsx && git commit -m "refactor(ideate): route slash commands through server"`

---

## Task 8: Update Agent Hooks to Expose Commands

**Files:**
- Modify: `apps/ideate/client/src/hooks/useIdeaAgent.ts`
- Modify: `apps/ideate/client/src/hooks/usePlanAgent.ts`
- Modify: `apps/ideate/client/src/hooks/useExecutionAgent.ts`

Each agent hook should expose:
- `availableCommands` from useAgentSocket
- `executeCommand` from useAgentSocket

These are already returned from useAgentSocket, just need to be re-exported from agent-specific hooks.

**Verification:** `cd apps/ideate/client && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/client/src/hooks/use*Agent.ts && git commit -m "feat(ideate): expose slash commands from agent hooks"`

---

## Task 9: Update IdeaDialog to Use Server Commands

**Files:**
- Modify: `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx`

Update useChatCommands call to use the new interface:

```typescript
const { availableCommands, executeCommand } = useIdeaAgent(...);

const { commands, handleCommand } = useChatCommands({
  availableCommands,
  executeCommand,
});
```

**Verification:** `cd apps/ideate/client && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/client/src/components/IdeaDialog && git commit -m "feat(ideate): wire up server-side commands in IdeaDialog"`

---

## Task 10: Apply Same Pattern to Plan and Execution Dialogs

**Files:**
- Find and modify plan dialog component
- Find and modify execution dialog component

Apply the same pattern as IdeaDialog.

**Verification:** `cd apps/ideate/client && pnpm tsc --noEmit`

**Commit:** `git commit -m "feat(ideate): wire up server-side commands in plan and execution views"`

---

## Task 11: Add Model Command

**Files:**
- Create: `apps/ideate/server/src/commands/modelCommand.ts`
- Modify: `apps/ideate/server/src/commands/index.ts`

```typescript
export const modelCommand: SlashCommandHandler = {
  command: {
    name: 'model',
    description: 'View or change the AI model',
    argumentHint: '[model-name]',
  },

  async execute(args: string, context: CommandContext): Promise<SlashCommandResult> {
    // If no args, show current model and available options
    // If args, validate and return instruction for model change
    // (Actual model change happens via separate mechanism)
  },
};
```

**Verification:** `cd apps/ideate/server && pnpm tsc --noEmit`

**Commit:** `git add apps/ideate/server/src/commands && git commit -m "feat(ideate): add /model slash command"`

---

## Task 12: Full Build and Integration Test

**Files:** All

1. Run full build: `pnpm build`
2. Run linter: `pnpm lint`
3. Run typecheck: `pnpm typecheck`
4. Start dev server: `pnpm dev:v1`
5. Test `/help` - should show all commands
6. Test `/context` - should show context usage
7. Test `/clear` - should clear history
8. Test unknown command - should show error

**Fix any issues found.**

**Commit:** `git commit -m "fix(ideate): address build issues for slash command system"`

---

## Task 13: Document Plugin Command Registration

**Files:**
- Create: `apps/ideate/docs/slash-commands.md`

Document:
1. How to create a new command handler
2. How to register commands
3. The CommandContext available to handlers
4. Future plugin loading mechanism

This establishes the pattern for future extensibility.

**Commit:** `git add apps/ideate/docs && git commit -m "docs(ideate): document slash command system"`

---

## Future Extensions (Not in This Plan)

1. **Plugin Loading**: Add `loadPluginCommands(pluginPath)` that discovers and registers commands from plugin directories
2. **Additional Commands**: /mcp, /agents, /memory, /config, etc.
3. **Command Permissions**: Some commands may need authorization checks
4. **Command Arguments Schema**: Add Zod validation for command arguments
5. **Async Command Results**: For long-running commands, support streaming results

---

## Summary of Files

**New Files (Server):**
- `apps/ideate/server/src/shared/slashCommandTypes.ts`
- `apps/ideate/server/src/services/SlashCommandRegistry.ts`
- `apps/ideate/server/src/commands/helpCommand.ts`
- `apps/ideate/server/src/commands/clearCommand.ts`
- `apps/ideate/server/src/commands/contextCommand.ts`
- `apps/ideate/server/src/commands/modelCommand.ts`
- `apps/ideate/server/src/commands/index.ts`

**New Files (Client):**
- `apps/ideate/client/src/types/slashCommandTypes.ts`

**Modified Files:**
- `apps/ideate/server/src/index.ts` - register commands
- `apps/ideate/server/src/websocket/IdeaAgentWebSocketHandler.ts` - handle commands
- `apps/ideate/client/src/hooks/useAgentSocket.ts` - command state and execution
- `apps/ideate/client/src/hooks/useChatCommands.tsx` - refactor to use server
- `apps/ideate/client/src/hooks/useIdeaAgent.ts` - expose commands
- `apps/ideate/client/src/hooks/usePlanAgent.ts` - expose commands
- `apps/ideate/client/src/hooks/useExecutionAgent.ts` - expose commands
- `apps/ideate/client/src/components/IdeaDialog/IdeaDialog.tsx` - wire up

**Documentation:**
- `apps/ideate/docs/slash-commands.md`
