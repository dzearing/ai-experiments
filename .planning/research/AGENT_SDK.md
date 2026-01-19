# Claude Agent SDK Research

**Researched:** 2026-01-19
**Package:** `@anthropic-ai/claude-agent-sdk`
**Version:** 0.2.12 (as of Jan 2026)
**Confidence:** HIGH (official documentation verified)

## Executive Summary

The Claude Agent SDK (formerly Claude Code SDK) provides programmatic access to Claude's agentic capabilities. It enables building autonomous agents that can read files, run commands, edit code, search the web, and execute complex workflows. The SDK uses Claude Code as its runtime and provides a TypeScript/Python interface for building custom applications.

**Key insight for web implementation:** The SDK is designed for server-side use. For a web-based clone, you would run the Agent SDK on your backend server and forward streaming messages to the web client via WebSocket or Server-Sent Events (SSE).

---

## 1. Core API - `query()` Function

### Function Signature

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

function query({
  prompt,
  options
}: {
  prompt: string | AsyncIterable<SDKUserMessage>;
  options?: Options;
}): Query
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | `string \| AsyncIterable<SDKUserMessage>` | Input as string (single message) or async iterable (streaming input for multi-turn) |
| `options` | `Options` | Configuration object (see below) |

### Returns: Query Object

```typescript
interface Query extends AsyncGenerator<SDKMessage, void> {
  interrupt(): Promise<void>;
  rewindFiles(userMessageUuid: string): Promise<void>;
  setPermissionMode(mode: PermissionMode): Promise<void>;
  setModel(model?: string): Promise<void>;
  setMaxThinkingTokens(maxThinkingTokens: number | null): Promise<void>;
  supportedCommands(): Promise<SlashCommand[]>;
  supportedModels(): Promise<ModelInfo[]>;
  mcpServerStatus(): Promise<McpServerStatus[]>;
  accountInfo(): Promise<AccountInfo>;
}
```

### Options Interface (Complete)

```typescript
interface Options {
  // Core configuration
  model?: string;                          // Claude model to use
  cwd?: string;                            // Working directory (default: process.cwd())
  maxTurns?: number;                       // Maximum conversation turns
  maxBudgetUsd?: number;                   // Maximum budget in USD
  maxThinkingTokens?: number;              // Maximum tokens for thinking process

  // Tools & Permissions
  allowedTools?: string[];                 // Whitelist of tool names
  disallowedTools?: string[];              // Blacklist of tool names
  tools?: string[] | { type: 'preset'; preset: 'claude_code' };
  permissionMode?: PermissionMode;         // 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'
  canUseTool?: CanUseTool;                 // Custom permission callback
  allowDangerouslySkipPermissions?: boolean;

  // System prompt & behavior
  systemPrompt?: string | { type: 'preset'; preset: 'claude_code'; append?: string };

  // Session management
  resume?: string;                         // Session ID to resume
  forkSession?: boolean;                   // Fork instead of continuing session
  continue?: boolean;                      // Continue most recent conversation
  resumeSessionAt?: string;                // Resume at specific message UUID

  // MCP servers
  mcpServers?: Record<string, McpServerConfig>;
  strictMcpConfig?: boolean;

  // Hooks
  hooks?: Partial<Record<HookEvent, HookCallbackMatcher[]>>;

  // Subagents
  agents?: Record<string, AgentDefinition>;

  // Sandbox configuration
  sandbox?: SandboxSettings;

  // Settings sources
  settingSources?: SettingSource[];        // 'user' | 'project' | 'local'

  // Output
  outputFormat?: { type: 'json_schema'; schema: JSONSchema };
  includePartialMessages?: boolean;        // Include streaming partial messages

  // Environment
  env?: Dict<string>;                      // Environment variables
  additionalDirectories?: string[];        // Additional accessible directories

  // Advanced
  abortController?: AbortController;
  executable?: 'bun' | 'deno' | 'node';
  executableArgs?: string[];
  pathToClaudeCodeExecutable?: string;
  stderr?: (data: string) => void;
  fallbackModel?: string;
  betas?: SdkBeta[];                       // e.g., ['context-1m-2025-08-07']
  enableFileCheckpointing?: boolean;
  plugins?: SdkPluginConfig[];
  permissionPromptToolName?: string;
}
```

---

## 2. Message Types During Streaming

The `query()` function returns an async generator that yields `SDKMessage` objects.

### SDKMessage Union Type

```typescript
type SDKMessage =
  | SDKAssistantMessage
  | SDKUserMessage
  | SDKUserMessageReplay
  | SDKResultMessage
  | SDKSystemMessage
  | SDKPartialAssistantMessage
  | SDKCompactBoundaryMessage;
```

### Message Type Details

#### SDKSystemMessage (First message - initialization)
```typescript
type SDKSystemMessage = {
  type: 'system';
  subtype: 'init';
  uuid: UUID;
  session_id: string;
  apiKeySource: ApiKeySource;
  cwd: string;
  tools: string[];
  mcp_servers: { name: string; status: string; }[];
  model: string;
  permissionMode: PermissionMode;
  slash_commands: string[];
  output_style: string;
}
```

#### SDKAssistantMessage (Claude's responses)
```typescript
type SDKAssistantMessage = {
  type: 'assistant';
  uuid: UUID;
  session_id: string;
  message: APIAssistantMessage; // From Anthropic SDK - contains content blocks
  parent_tool_use_id: string | null; // Non-null if from subagent
}
```

**Content blocks in `message.content`:**
- `TextBlock`: `{ type: 'text', text: string }`
- `ToolUseBlock`: `{ type: 'tool_use', id: string, name: string, input: object }`
- `ThinkingBlock`: `{ type: 'thinking', thinking: string }`

#### SDKUserMessage (User input)
```typescript
type SDKUserMessage = {
  type: 'user';
  uuid?: UUID;
  session_id: string;
  message: APIUserMessage;
  parent_tool_use_id: string | null;
}
```

#### SDKResultMessage (Final result)
```typescript
type SDKResultMessage = {
  type: 'result';
  subtype: 'success' | 'error_max_turns' | 'error_during_execution' |
           'error_max_budget_usd' | 'error_max_structured_output_retries';
  uuid: UUID;
  session_id: string;
  duration_ms: number;
  duration_api_ms: number;
  is_error: boolean;
  num_turns: number;
  result: string;
  total_cost_usd: number;
  usage: NonNullableUsage;
  modelUsage: { [modelName: string]: ModelUsage };
  permission_denials: SDKPermissionDenial[];
  structured_output?: unknown;  // If outputFormat was specified
  errors?: string[];            // If error subtype
}
```

#### SDKPartialAssistantMessage (Streaming tokens)
```typescript
// Only when includePartialMessages: true
type SDKPartialAssistantMessage = {
  type: 'stream_event';
  event: RawMessageStreamEvent; // From Anthropic SDK
  parent_tool_use_id: string | null;
  uuid: UUID;
  session_id: string;
}
```

---

## 3. Session Management

### Creating a Session

Sessions are automatically created when you call `query()`. Capture the session ID from messages:

```typescript
let sessionId: string;

for await (const message of query({ prompt: "Hello" })) {
  if (message.type === 'system' && message.subtype === 'init') {
    sessionId = message.session_id;
  }
  // Session ID also available on all messages
  sessionId = message.session_id;
}
```

### Resuming a Session

```typescript
const result = query({
  prompt: "Continue our work",
  options: {
    resume: sessionId  // Pass the captured session ID
  }
});
```

### Forking a Session

Creates a new branch from an existing session:

```typescript
const result = query({
  prompt: "Try a different approach",
  options: {
    resume: sessionId,
    forkSession: true  // Creates new session ID from resume point
  }
});
```

### Session Storage

Sessions are persisted to disk by Claude Code runtime. Location:
- Mac/Linux: `~/.claude-code/sessions/`
- Cleanup: Controlled by `cleanupPeriodDays` setting (default: 30 days)

---

## 4. Tool System

### Built-in Tools

| Tool | Description | Input Schema |
|------|-------------|--------------|
| `Read` | Read files | `{ file_path, offset?, limit? }` |
| `Write` | Write files | `{ file_path, content }` |
| `Edit` | Edit files (string replacement) | `{ file_path, old_string, new_string, replace_all? }` |
| `Bash` | Execute commands | `{ command, timeout?, description?, run_in_background? }` |
| `BashOutput` | Get background command output | `{ bash_id, filter? }` |
| `KillBash` | Kill background shell | `{ shell_id }` |
| `Glob` | Find files by pattern | `{ pattern, path? }` |
| `Grep` | Search file contents | `{ pattern, path?, glob?, type?, output_mode?, ... }` |
| `WebSearch` | Search the web | `{ query, allowed_domains?, blocked_domains? }` |
| `WebFetch` | Fetch and analyze URL | `{ url, prompt }` |
| `Task` | Spawn subagent | `{ description, prompt, subagent_type }` |
| `AskUserQuestion` | Ask clarifying questions | `{ questions, answers? }` |
| `TodoWrite` | Manage task list | `{ todos }` |
| `NotebookEdit` | Edit Jupyter notebooks | `{ notebook_path, cell_id?, new_source, cell_type?, edit_mode? }` |
| `ListMcpResources` | List MCP resources | `{ server? }` |
| `ReadMcpResource` | Read MCP resource | `{ server, uri }` |
| `ExitPlanMode` | Exit planning mode | `{ plan }` |

### Configuring Allowed Tools

```typescript
// Whitelist specific tools
options: {
  allowedTools: ['Read', 'Grep', 'Glob', 'Bash']
}

// Or use Claude Code's default set
options: {
  tools: { type: 'preset', preset: 'claude_code' }
}

// Blacklist tools
options: {
  disallowedTools: ['Bash', 'Write', 'Edit']
}
```

### Custom Tools via MCP

```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const customServer = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [
    tool(
      "get_user",
      "Fetch user details",
      {
        userId: z.string().describe("User ID")
      },
      async (args) => {
        const user = await fetchUser(args.userId);
        return {
          content: [{ type: "text", text: JSON.stringify(user) }]
        };
      }
    )
  ]
});

// Use in query (requires streaming input mode)
async function* messageGenerator() {
  yield { type: "user", message: { role: "user", content: "Get user 123" } };
}

for await (const msg of query({
  prompt: messageGenerator(),
  options: {
    mcpServers: { "my-tools": customServer },
    allowedTools: ["mcp__my-tools__get_user"]
  }
})) { /* ... */ }
```

---

## 5. Hooks System

### Available Hook Events

| Event | Description | Supports Matcher |
|-------|-------------|------------------|
| `PreToolUse` | Before tool executes (can block/modify) | Yes |
| `PostToolUse` | After tool executes | Yes |
| `PostToolUseFailure` | When tool fails (TS only) | Yes |
| `UserPromptSubmit` | When user submits prompt | No |
| `SessionStart` | Session initializes (TS only) | No |
| `SessionEnd` | Session terminates (TS only) | No |
| `Stop` | Execution stops | No |
| `SubagentStart` | Subagent starts (TS only) | No |
| `SubagentStop` | Subagent completes | No |
| `PreCompact` | Before conversation compaction | No |
| `PermissionRequest` | Permission prompt (TS only) | Yes |
| `Notification` | Status messages (TS only) | No |

### Hook Callback Signature

```typescript
type HookCallback = (
  input: HookInput,
  toolUseID: string | undefined,
  options: { signal: AbortSignal }
) => Promise<HookJSONOutput>;
```

### Hook Configuration

```typescript
options: {
  hooks: {
    PreToolUse: [
      {
        matcher: 'Write|Edit',  // Regex to match tool names
        hooks: [myHookCallback]
      }
    ],
    PostToolUse: [
      { hooks: [logToolUse] }  // No matcher = all tools
    ]
  }
}
```

### Hook Input Types

```typescript
// PreToolUse
type PreToolUseHookInput = BaseHookInput & {
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: unknown;
}

// PostToolUse
type PostToolUseHookInput = BaseHookInput & {
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: unknown;
  tool_response: unknown;
}

// Base fields present in all
type BaseHookInput = {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
}
```

### Hook Return Types

```typescript
type HookJSONOutput = {
  continue?: boolean;          // Should agent continue (default: true)
  stopReason?: string;         // Message if continue: false
  suppressOutput?: boolean;    // Hide output from transcript
  systemMessage?: string;      // Inject message for Claude
  hookSpecificOutput?: {
    hookEventName: string;
    permissionDecision?: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
    updatedInput?: Record<string, unknown>;  // Modified tool input
    additionalContext?: string;
  };
};
```

### Example: Block Dangerous Commands

```typescript
const blockDangerousCommands: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== 'PreToolUse') return {};

  const preInput = input as PreToolUseHookInput;
  if (preInput.tool_name === 'Bash' &&
      preInput.tool_input.command?.includes('rm -rf /')) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Dangerous command blocked'
      }
    };
  }
  return {};
};
```

---

## 6. MCP Integration

### Server Configuration Types

```typescript
// Stdio (local process)
type McpStdioServerConfig = {
  type?: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

// HTTP (REST endpoint)
type McpHttpServerConfig = {
  type: 'http';
  url: string;
  headers?: Record<string, string>;
}

// SSE (Server-Sent Events)
type McpSSEServerConfig = {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
}

// SDK (in-process)
type McpSdkServerConfigWithInstance = {
  type: 'sdk';
  name: string;
  instance: McpServer;
}
```

### Example Configurations

```typescript
options: {
  mcpServers: {
    // Local process (stdio)
    github: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
    },

    // Remote HTTP
    "my-api": {
      type: "http",
      url: "https://api.example.com/mcp",
      headers: { Authorization: `Bearer ${token}` }
    },

    // In-process SDK server
    "custom": customMcpServer
  },

  // Allow MCP tools (pattern: mcp__{server}__{tool})
  allowedTools: [
    "mcp__github__list_issues",
    "mcp__my-api__*",  // Wildcard
  ]
}
```

### MCP Tool Naming Convention

MCP tools follow the pattern: `mcp__{server-name}__{tool-name}`

Example: Server `github` with tool `list_issues` → `mcp__github__list_issues`

---

## 7. Subagents

### Defining Subagents

```typescript
type AgentDefinition = {
  description: string;  // When to use this agent
  prompt: string;       // Agent's system prompt
  tools?: string[];     // Allowed tools (inherits if omitted)
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
}

options: {
  allowedTools: ['Read', 'Grep', 'Task'],  // Task required for subagents
  agents: {
    "code-reviewer": {
      description: "Expert code reviewer for security and quality",
      prompt: "You are a security-focused code reviewer...",
      tools: ['Read', 'Grep', 'Glob'],
      model: 'sonnet'
    },
    "test-runner": {
      description: "Runs and analyzes test suites",
      prompt: "You are a test execution specialist...",
      tools: ['Bash', 'Read', 'Grep']
    }
  }
}
```

### Detecting Subagent Activity

Messages from subagents have `parent_tool_use_id` set:

```typescript
for await (const message of query({ prompt: "Review code", options })) {
  if (message.parent_tool_use_id) {
    console.log("Message from subagent");
  }

  // Detect subagent invocation
  if (message.type === 'assistant') {
    for (const block of message.message.content) {
      if (block.type === 'tool_use' && block.name === 'Task') {
        console.log(`Spawning subagent: ${block.input.subagent_type}`);
      }
    }
  }
}
```

### Built-in Subagent

Without defining custom agents, Claude can spawn a `general-purpose` subagent for delegation when `Task` is in `allowedTools`.

---

## 8. Permission Handling

### Permission Modes

```typescript
type PermissionMode =
  | 'default'           // Standard - requires approval for most tools
  | 'acceptEdits'       // Auto-approve file edits
  | 'bypassPermissions' // Auto-approve everything (dangerous)
  | 'plan'              // Planning only - no execution
```

### Custom Permission Handler (canUseTool)

```typescript
type CanUseTool = (
  toolName: string,
  input: ToolInput,
  options: { signal: AbortSignal; suggestions?: PermissionUpdate[] }
) => Promise<PermissionResult>;

type PermissionResult =
  | { behavior: 'allow'; updatedInput: ToolInput; updatedPermissions?: PermissionUpdate[] }
  | { behavior: 'deny'; message: string; interrupt?: boolean };
```

### Example: Interactive Approval

```typescript
options: {
  canUseTool: async (toolName, input, { signal }) => {
    // AskUserQuestion: Return answers
    if (toolName === 'AskUserQuestion') {
      const answers = await getUserAnswers(input.questions);
      return {
        behavior: 'allow',
        updatedInput: { ...input, answers }
      };
    }

    // Bash commands: Prompt for approval
    if (toolName === 'Bash') {
      const approved = await promptUser(`Allow: ${input.command}?`);
      if (approved) {
        return { behavior: 'allow', updatedInput: input };
      }
      return { behavior: 'deny', message: 'User rejected' };
    }

    // Auto-allow read-only tools
    return { behavior: 'allow', updatedInput: input };
  }
}
```

---

## 9. Streaming Architecture for Web

### Server-Side (Node.js/Express)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import express from "express";

const app = express();

// SSE endpoint
app.get("/api/chat/stream", async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { prompt, sessionId } = req.query;

  try {
    for await (const message of query({
      prompt: prompt as string,
      options: {
        resume: sessionId as string | undefined,
        includePartialMessages: true  // Get streaming tokens
      }
    })) {
      // Forward each message to client
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
  } finally {
    res.end();
  }
});
```

### Client-Side (React)

```typescript
function useAgentStream(prompt: string) {
  const [messages, setMessages] = useState<SDKMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = useCallback(async () => {
    setIsStreaming(true);

    const eventSource = new EventSource(
      `/api/chat/stream?prompt=${encodeURIComponent(prompt)}`
    );

    eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);

      // Handle specific message types
      if (message.type === 'result') {
        eventSource.close();
        setIsStreaming(false);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
    };
  }, [prompt]);

  return { messages, isStreaming, startStream };
}
```

### Message Types to Handle on Client

```typescript
function renderMessage(message: SDKMessage) {
  switch (message.type) {
    case 'system':
      if (message.subtype === 'init') {
        // Session initialized - store session_id
        return <SessionInit tools={message.tools} />;
      }
      break;

    case 'assistant':
      return (
        <AssistantMessage>
          {message.message.content.map(block => {
            if (block.type === 'text') return <Text>{block.text}</Text>;
            if (block.type === 'tool_use') return <ToolUse tool={block} />;
          })}
        </AssistantMessage>
      );

    case 'stream_event':
      // Partial streaming updates
      return <StreamingText event={message.event} />;

    case 'result':
      return <ResultMessage success={message.subtype === 'success'} />;
  }
}
```

---

## 10. Configuration & Environment

### CLAUDE.md Loading

CLAUDE.md files are loaded when `settingSources` includes `'project'`:

```typescript
options: {
  settingSources: ['project'],  // Load CLAUDE.md
  systemPrompt: { type: 'preset', preset: 'claude_code' }  // Required
}
```

### Settings Precedence

1. Programmatic options (highest)
2. Local settings (`.claude/settings.local.json`)
3. Project settings (`.claude/settings.json`)
4. User settings (`~/.claude/settings.json`)

### Environment Variables

```typescript
// Required
ANTHROPIC_API_KEY=sk-ant-...

// Alternative providers
CLAUDE_CODE_USE_BEDROCK=1    // Use AWS Bedrock
CLAUDE_CODE_USE_VERTEX=1     // Use Google Vertex AI
CLAUDE_CODE_USE_FOUNDRY=1    // Use Azure Foundry

// Tool search
ENABLE_TOOL_SEARCH=auto      // auto | auto:N | true | false
```

---

## 11. V2 Preview API (Simplified)

A new simplified API is in preview:

```typescript
import {
  unstable_v2_createSession,
  unstable_v2_resumeSession,
  unstable_v2_prompt
} from '@anthropic-ai/claude-agent-sdk';

// One-shot prompt
const result = await unstable_v2_prompt('What is 2 + 2?', {
  model: 'claude-sonnet-4-5-20250929'
});
console.log(result.result);

// Session-based
await using session = unstable_v2_createSession({
  model: 'claude-sonnet-4-5-20250929'
});

await session.send('Hello!');
for await (const msg of session.stream()) {
  if (msg.type === 'assistant') {
    console.log(msg.message.content);
  }
}

// Multi-turn
await session.send('Follow up question');
for await (const msg of session.stream()) { /* ... */ }
```

**Note:** V2 is unstable/preview. Some V1 features like session forking are not yet available.

---

## 12. Structured Outputs

Get validated JSON from agents:

```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  items: z.array(z.object({
    title: z.string(),
    completed: z.boolean()
  }))
});

for await (const message of query({
  prompt: "Extract TODO items from the codebase",
  options: {
    outputFormat: {
      type: 'json_schema',
      schema: z.toJSONSchema(schema)
    }
  }
})) {
  if (message.type === 'result' && message.structured_output) {
    const data = schema.parse(message.structured_output);
    console.log(data);  // Fully typed
  }
}
```

---

## 13. Sandbox Configuration

```typescript
type SandboxSettings = {
  enabled?: boolean;
  autoAllowBashIfSandboxed?: boolean;
  excludedCommands?: string[];           // Commands that bypass sandbox
  allowUnsandboxedCommands?: boolean;    // Allow model to request unsandboxed
  network?: {
    allowLocalBinding?: boolean;
    allowUnixSockets?: string[];
    allowAllUnixSockets?: boolean;
    httpProxyPort?: number;
    socksProxyPort?: number;
  };
  ignoreViolations?: {
    file?: string[];
    network?: string[];
  };
  enableWeakerNestedSandbox?: boolean;
}

options: {
  sandbox: {
    enabled: true,
    autoAllowBashIfSandboxed: true,
    network: { allowLocalBinding: true }
  }
}
```

---

## Sources

### Official Documentation
- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [TypeScript SDK Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [TypeScript V2 Preview](https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview)
- [Migration Guide](https://platform.claude.com/docs/en/agent-sdk/migration-guide)
- [Hooks Guide](https://platform.claude.com/docs/en/agent-sdk/hooks)
- [MCP Guide](https://platform.claude.com/docs/en/agent-sdk/mcp)
- [Subagents Guide](https://platform.claude.com/docs/en/agent-sdk/subagents)
- [Sessions Guide](https://platform.claude.com/docs/en/agent-sdk/sessions)
- [Streaming Input Guide](https://platform.claude.com/docs/en/agent-sdk/streaming-vs-single-mode)
- [Permissions Guide](https://platform.claude.com/docs/en/agent-sdk/permissions)
- [User Input Guide](https://platform.claude.com/docs/en/agent-sdk/user-input)
- [Structured Outputs Guide](https://platform.claude.com/docs/en/agent-sdk/structured-outputs)
- [Custom Tools Guide](https://platform.claude.com/docs/en/agent-sdk/custom-tools)

### GitHub
- [claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript)
- [claude-agent-sdk-demos](https://github.com/anthropics/claude-agent-sdk-demos)

### NPM
- [@anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)

---

## Implementation Recommendations for Web Clone

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Web Client                         │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │ Chat UI       │  │ Tool Display  │  │ File Tree   │ │
│  └───────┬───────┘  └───────────────┘  └─────────────┘ │
│          │                                              │
│          │ WebSocket / SSE                              │
└──────────┼──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend Server (Node.js)               │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │ Express/Hono  │  │ Session Mgmt  │  │ Auth        │ │
│  └───────┬───────┘  └───────────────┘  └─────────────┘ │
│          │                                              │
│          │ query()                                      │
│          ▼                                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │             Claude Agent SDK                       │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │ │
│  │  │ Tools   │  │ Hooks   │  │ MCP Servers     │   │ │
│  │  └─────────┘  └─────────┘  └─────────────────┘   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Implementation Points

1. **Server-Side SDK:** The Agent SDK runs on the server, not in browser
2. **Stream Forwarding:** Use SSE or WebSocket to forward messages to client
3. **Session Persistence:** Store session IDs per user for resume functionality
4. **Permission Handling:** Implement `canUseTool` to surface approval prompts to UI
5. **Partial Messages:** Enable `includePartialMessages: true` for real-time streaming
6. **Tool Visualization:** Parse `tool_use` blocks to show what Claude is doing
7. **MCP for Extensions:** Use custom MCP servers for additional capabilities

### Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core API | HIGH | Official docs verified |
| Message Types | HIGH | Comprehensive type definitions |
| Hooks | HIGH | Full documentation available |
| MCP | HIGH | Multiple examples and guides |
| Session Management | HIGH | Well documented |
| Streaming | MEDIUM | Examples exist, some assembly required |
| V2 API | MEDIUM | Preview/unstable, API may change |
