# Slash Command System

The Ideate app includes an extensible slash command system that executes commands server-side, enabling consistent behavior across all agents and supporting future plugin integration.

## Architecture

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
└─────────────────────────────────────────────────────────────────────┘
```

## Built-in Commands

| Command | Description |
|---------|-------------|
| `/help` | Lists all available commands |
| `/clear` | Clears chat history |
| `/context` | Shows context window usage and session info |
| `/model` | Shows current model and available options |

## Creating a New Command

### 1. Create the command handler file

Create a new file in `apps/ideate/server/src/commands/`:

```typescript
// apps/ideate/server/src/commands/myCommand.ts
import type { SlashCommandHandler, CommandContext, SlashCommandResult } from '../shared/slashCommandTypes.js';

export const myCommand: SlashCommandHandler = {
  command: {
    name: 'mycommand',           // Command name without /
    description: 'What it does', // Shown in /help
    argumentHint: '[optional]',  // Usage hint (empty string if no args)
  },

  async execute(args: string, context: CommandContext): Promise<SlashCommandResult> {
    // args: everything after the command name
    // context: session info, user info, token usage, etc.

    return {
      content: 'Command output here',
      format: 'markdown',  // 'markdown' | 'text' | 'json'
      ephemeral: false,    // if true, not persisted to chat history
    };
  },
};
```

### 2. Register the command

Add to `apps/ideate/server/src/commands/index.ts`:

```typescript
import { myCommand } from './myCommand.js';

export function registerBuiltInCommands(): void {
  const registry = getCommandRegistry();

  // ... existing commands ...
  registry.register(myCommand);
}

export { /* ... */, myCommand };
```

## CommandContext

The context object provides information about the current session:

```typescript
interface CommandContext {
  userId: string;            // User executing the command
  sessionId: string;         // Current session ID
  ideaId?: string;           // Idea ID if in idea context
  tokenUsage?: {             // Current token usage
    inputTokens: number;
    outputTokens: number;
  };
  sessionInfo?: {            // SDK session info
    sessionId?: string;
    model?: string;
    tools?: string[];
    mcpServers?: string[];
  };
  messageCount: number;      // Messages in current session
}
```

## SlashCommandResult

Commands return a result object:

```typescript
interface SlashCommandResult {
  content: string;                      // Output to display
  format: 'markdown' | 'text' | 'json'; // How to render
  ephemeral?: boolean;                  // Don't persist to history
}
```

## Client Integration

### Agent Hooks

All agent hooks expose slash commands:

```typescript
const { availableCommands, executeCommand } = useIdeaAgent({...});
const { availableCommands, executeCommand } = usePlanAgent({...});
const { availableCommands, executeCommand } = useExecutionAgent({...});
```

### useChatCommands

The `useChatCommands` hook converts server commands to UI format:

```typescript
const { commands, handleCommand } = useChatCommands({
  availableCommands,  // From agent hook
  executeCommand,     // From agent hook
});
```

## Future Extensions

### Plugin Commands

The architecture supports loading commands from plugins:

```typescript
// Future API (not yet implemented)
async function loadPluginCommands(pluginPath: string): Promise<void> {
  const plugin = await import(pluginPath);
  if (plugin.commands) {
    for (const handler of plugin.commands) {
      registry.register(handler);
    }
  }
}
```

### Additional Planned Commands

- `/mcp` - List connected MCP servers and tools
- `/agents` - Show active agents
- `/memory` - Manage conversation memory
- `/config` - View/modify settings

## WebSocket Protocol

### Client to Server

```typescript
interface SlashCommandRequest {
  type: 'slash_command';
  command: string;  // Command name without /
  args: string;     // Arguments string
}
```

### Server to Client

```typescript
// Available commands (sent on connection)
interface AvailableCommandsMessage {
  type: 'available_commands';
  commands: SlashCommand[];
}

// Command result
interface SlashCommandResponse {
  type: 'command_result';
  command: string;
  result: SlashCommandResult;
  error?: string;
}
```
