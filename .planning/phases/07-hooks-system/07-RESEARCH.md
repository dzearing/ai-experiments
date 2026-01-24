# Phase 7: Hooks System - Research

**Researched:** 2026-01-24
**Domain:** Agent execution interception, tool lifecycle, session lifecycle
**Confidence:** HIGH

## Summary

Phase 7 implements the hooks system that allows interception and modification of tool execution at all lifecycle points. The Claude Agent SDK provides a comprehensive hooks API with TypeScript callback functions that can block, modify, or enhance tool operations. For the web app, hooks are configured via `options.hooks` in the SDK `query()` call.

The hooks system in Claude Code has two distinct implementation paths:
1. **CLI hooks** - Bash/Python scripts configured in settings.json that run as subprocesses
2. **SDK hooks** - TypeScript callback functions passed directly to `query()` options

For Claude Code Web, we implement SDK hooks (TypeScript callbacks) as the primary mechanism, matching how the existing `canUseTool` permission callback already works. The architecture pattern is: hooks are TypeScript functions on the server that intercept SDK events, can send SSE notifications to the client for visibility, and return structured decisions.

**Primary recommendation:** Implement hooks as TypeScript callbacks passed to the SDK `query()` function via `options.hooks`. Load hook configuration from settings.json (already parsed by ConfigService) and create callback functions that implement the configured behavior. Send hook activity notifications to the client via existing SSE channel.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/claude-agent-sdk | 0.2.12+ | Hooks API via options.hooks | Official SDK, already integrated |
| minimatch | existing | Glob pattern matching for hook matchers | Already used in ConfigService for rules |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | existing | Hook configuration validation | Validate settings.json hooks schema |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SDK hooks (callbacks) | CLI hooks (bash scripts) | SDK hooks are simpler for web app, no subprocess spawning needed |
| TypeScript hooks | External hook server via HTTP | TypeScript callbacks are synchronous with SDK, no network latency |

**Installation:**
```bash
# No new dependencies needed - all tools already in project
```

## Architecture Patterns

### Recommended Project Structure
```
apps/claude-code-web/server/src/
├── services/
│   ├── agentService.ts           # Extend to pass hooks to query()
│   ├── configService.ts          # Already loads settings.json
│   └── hooksService.ts           # NEW: Build hooks from config
├── hooks/
│   ├── createHookCallbacks.ts    # NEW: Factory for hook callbacks
│   ├── preToolUseHook.ts         # NEW: PreToolUse logic
│   ├── postToolUseHook.ts        # NEW: PostToolUse logic
│   ├── sessionHooks.ts           # NEW: Session lifecycle hooks
│   ├── subagentHooks.ts          # NEW: Subagent tracking hooks
│   └── types.ts                  # NEW: Hook type definitions
└── types/
    └── config.ts                 # Extend with HookConfig types
```

### Pattern 1: SDK Hooks Configuration
**What:** Pass TypeScript callback functions to SDK via options.hooks
**When to use:** All hook implementations in Claude Code Web
**Example:**
```typescript
// Source: Official SDK hooks documentation
import { query, HookCallback, PreToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";

const preToolUseHook: HookCallback = async (input, toolUseID, { signal }) => {
  const preInput = input as PreToolUseHookInput;

  // Block dangerous operations
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

  return {}; // Allow operation
};

for await (const message of query({
  prompt: "Do something",
  options: {
    hooks: {
      PreToolUse: [{ matcher: 'Bash', hooks: [preToolUseHook] }]
    }
  }
})) {
  // Process messages
}
```

### Pattern 2: Hook Configuration from Settings
**What:** Load hook definitions from settings.json and build SDK callbacks
**When to use:** When hooks are user-configured via settings files
**Example:**
```typescript
// settings.json format (loaded by ConfigService)
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "type": "builtin",
        "action": "log" // or "notify", "block-pattern", etc.
      }
    ]
  }
}

// Service transforms to SDK callbacks
function buildHooksFromConfig(config: HooksConfig): SDKHooksOptions {
  const hooks: SDKHooksOptions = {};

  for (const [event, matchers] of Object.entries(config)) {
    hooks[event] = matchers.map(m => ({
      matcher: m.matcher,
      hooks: [createCallbackForAction(m.action, m.options)]
    }));
  }

  return hooks;
}
```

### Pattern 3: Client Notification via SSE
**What:** Send hook activity to client for visibility
**When to use:** SessionStart, PreToolUse blocking, PostToolUse events
**Example:**
```typescript
// Extend existing SSE channel with hook events
interface HookNotificationEvent {
  type: 'hook_activity';
  hookEvent: string;
  toolName?: string;
  decision?: 'allow' | 'deny' | 'ask';
  reason?: string;
  timestamp: number;
}

// In hook callback
const preToolUseHook: HookCallback = async (input, toolUseID, { signal }) => {
  const preInput = input as PreToolUseHookInput;

  // Notify client about hook activity
  sendSSEEvent(sessionId, {
    type: 'hook_activity',
    hookEvent: 'PreToolUse',
    toolName: preInput.tool_name,
    timestamp: Date.now()
  });

  return {};
};
```

### Pattern 4: Input Modification Hook
**What:** PreToolUse hooks that modify tool input before execution
**When to use:** Sanitizing inputs, redirecting paths, injecting parameters
**Example:**
```typescript
// Source: Official SDK hooks documentation
const redirectToSandbox: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== 'PreToolUse') return {};

  const preInput = input as PreToolUseHookInput;
  if (preInput.tool_name === 'Write') {
    const originalPath = preInput.tool_input.file_path as string;
    return {
      hookSpecificOutput: {
        hookEventName: input.hook_event_name,
        permissionDecision: 'allow',
        updatedInput: {
          ...preInput.tool_input,
          file_path: `/sandbox${originalPath}`
        }
      }
    };
  }
  return {};
};
```

### Anti-Patterns to Avoid
- **Blocking forever in hooks:** Hooks have timeout limits, don't do long-running operations
- **Mutating input directly:** Return new object with updatedInput, don't mutate
- **Ignoring AbortSignal:** Pass signal to async operations like fetch() for proper cancellation
- **Hardcoding hook logic:** Load configuration from settings.json for user customization
- **Mixing CLI and SDK hooks:** For web app, use SDK hooks only (TypeScript callbacks)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pattern matching for tool names | Custom regex engine | SDK matcher parameter | SDK handles the pattern matching internally |
| Hook execution ordering | Custom priority system | SDK built-in ordering | Deny > Ask > Allow, well defined |
| Permission decision flow | Custom state machine | SDK hookSpecificOutput | SDK handles the decision cascade |
| Session lifecycle | Manual tracking | SessionStart/SessionEnd hooks | SDK fires at correct lifecycle points |
| Subagent tracking | Custom parent-child tracking | SubagentStart/SubagentStop hooks | SDK provides agent_id correlation |

**Key insight:** The SDK handles all hook orchestration, pattern matching, and decision cascading. The web app only needs to:
1. Define callback functions with the decision logic
2. Pass them to query() via options.hooks
3. Optionally notify the client via SSE

## Common Pitfalls

### Pitfall 1: Hook Timeout
**What goes wrong:** Hook callback takes too long and is cancelled
**Why it happens:** Default timeout is 60 seconds, async operations may exceed
**How to avoid:** Pass AbortSignal to async operations, set appropriate timeout in matcher config
**Warning signs:** Hook silently fails, operation proceeds without hook decision

### Pitfall 2: Missing hookEventName in Output
**What goes wrong:** Hook decision not applied
**Why it happens:** hookSpecificOutput requires hookEventName field
**How to avoid:** Always include `hookEventName: input.hook_event_name` in hookSpecificOutput
**Warning signs:** Tool operation proceeds despite deny decision

### Pitfall 3: Input Modification Without Allow
**What goes wrong:** updatedInput ignored
**Why it happens:** updatedInput requires permissionDecision: 'allow'
**How to avoid:** Always return permissionDecision with updatedInput
**Warning signs:** Tool executes with original input, not modified

### Pitfall 4: Deny Override Confusion
**What goes wrong:** Expecting allow to override another hook's deny
**Why it happens:** Deny takes precedence in SDK decision flow
**How to avoid:** Understand: any deny = blocked, multiple allows still proceed
**Warning signs:** Operation blocked when expecting it to proceed

### Pitfall 5: TypeScript-Only Hooks in Wrong Context
**What goes wrong:** Using SessionStart in Python context or vice versa
**Why it happens:** Some hooks are TypeScript SDK only
**How to avoid:** For web app (TypeScript), all hooks available. Check compatibility table for CLI
**Warning signs:** N/A for web app (all TypeScript)

### Pitfall 6: CLI vs SDK Hooks Confusion
**What goes wrong:** Trying to configure bash scripts in web app hooks
**Why it happens:** Documentation covers both CLI and SDK hooks
**How to avoid:** Web app uses SDK hooks (TypeScript callbacks), not CLI hooks (bash scripts)
**Warning signs:** Looking for command/type fields instead of hooks array with callbacks

## Code Examples

Verified patterns from official SDK documentation:

### SDK Hook Types (TypeScript)
```typescript
// Source: Official SDK TypeScript reference
type HookCallback = (
  input: HookInput,
  toolUseID: string | undefined,
  options: { signal: AbortSignal }
) => Promise<HookJSONOutput>;

// Available hook events
type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PostToolUseFailure'  // TS only
  | 'UserPromptSubmit'
  | 'SessionStart'        // TS only
  | 'SessionEnd'          // TS only
  | 'Stop'
  | 'SubagentStart'       // TS only
  | 'SubagentStop'
  | 'PreCompact'
  | 'PermissionRequest'   // TS only
  | 'Notification';       // TS only

// Hook input base fields (all hooks)
interface BaseHookInput {
  hook_event_name: string;
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode?: string;
}

// PreToolUse specific input
interface PreToolUseHookInput extends BaseHookInput {
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: Record<string, unknown>;
}

// PostToolUse specific input
interface PostToolUseHookInput extends BaseHookInput {
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: unknown;
}

// SessionStart specific input
interface SessionStartHookInput extends BaseHookInput {
  hook_event_name: 'SessionStart';
  source: 'startup' | 'resume' | 'clear' | 'compact';
}

// SessionEnd specific input
interface SessionEndHookInput extends BaseHookInput {
  hook_event_name: 'SessionEnd';
  reason: 'clear' | 'logout' | 'prompt_input_exit' | 'bypass_permissions_disabled' | 'other';
}

// SubagentStart specific input
interface SubagentStartHookInput extends BaseHookInput {
  hook_event_name: 'SubagentStart';
  agent_id: string;
  agent_type: string;
}

// SubagentStop specific input
interface SubagentStopHookInput extends BaseHookInput {
  hook_event_name: 'SubagentStop';
  stop_hook_active: boolean;
  agent_id: string;
  agent_transcript_path: string;
}

// UserPromptSubmit specific input
interface UserPromptSubmitHookInput extends BaseHookInput {
  hook_event_name: 'UserPromptSubmit';
  prompt: string;
}

// PreCompact specific input
interface PreCompactHookInput extends BaseHookInput {
  hook_event_name: 'PreCompact';
  trigger: 'manual' | 'auto';
  custom_instructions?: string;
}

// PermissionRequest specific input
interface PermissionRequestHookInput extends BaseHookInput {
  hook_event_name: 'PermissionRequest';
  tool_name: string;
  tool_input: Record<string, unknown>;
  permission_suggestions?: PermissionUpdate[];
}
```

### Hook Output Structure
```typescript
// Source: Official SDK TypeScript reference
interface HookJSONOutput {
  continue?: boolean;          // Should agent continue (default: true)
  stopReason?: string;         // Message if continue: false
  suppressOutput?: boolean;    // Hide output from transcript
  systemMessage?: string;      // Inject message for Claude to see
  hookSpecificOutput?: {
    hookEventName: string;     // Required: match input.hook_event_name
    permissionDecision?: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
    updatedInput?: Record<string, unknown>;  // Modified tool input
    additionalContext?: string;              // Context for Claude
  };
}
```

### Complete PreToolUse Hook Example
```typescript
// Source: Official SDK hooks documentation
import { query, HookCallback, PreToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";

// Block dangerous bash commands
const blockDangerousCommands: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== 'PreToolUse') return {};

  const preInput = input as PreToolUseHookInput;
  if (preInput.tool_name !== 'Bash') return {};

  const command = preInput.tool_input.command as string;

  // Block dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf\s+\//,
    /mkfs\./,
    /dd\s+if=.*of=\/dev/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `Blocked dangerous command matching: ${pattern}`
        }
      };
    }
  }

  return {}; // Allow
};

// Auto-approve read-only tools
const autoApproveReadOnly: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== 'PreToolUse') return {};

  const preInput = input as PreToolUseHookInput;
  const readOnlyTools = ['Read', 'Glob', 'Grep'];

  if (readOnlyTools.includes(preInput.tool_name)) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: 'Read-only tool auto-approved'
      }
    };
  }

  return {};
};

// Use in query
for await (const message of query({
  prompt: "Analyze the codebase",
  options: {
    hooks: {
      PreToolUse: [
        { matcher: 'Bash', hooks: [blockDangerousCommands] },
        { matcher: 'Read|Glob|Grep', hooks: [autoApproveReadOnly] }
      ]
    }
  }
})) {
  console.log(message);
}
```

### Session Lifecycle Hooks Example
```typescript
// Source: Official SDK hooks documentation
const sessionStartHook: HookCallback = async (input, toolUseID, { signal }) => {
  const sessionInput = input as SessionStartHookInput;

  console.log(`Session started: ${sessionInput.session_id}`);
  console.log(`Source: ${sessionInput.source}`);

  // Inject context at session start
  return {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `Session started at ${new Date().toISOString()}`
    }
  };
};

const sessionEndHook: HookCallback = async (input, toolUseID, { signal }) => {
  const sessionInput = input as SessionEndHookInput;

  console.log(`Session ended: ${sessionInput.session_id}`);
  console.log(`Reason: ${sessionInput.reason}`);

  // Cleanup logic here
  return {};
};

// Use in query
for await (const message of query({
  prompt: "Do work",
  options: {
    hooks: {
      SessionStart: [{ hooks: [sessionStartHook] }],
      SessionEnd: [{ hooks: [sessionEndHook] }]
    }
  }
})) {
  // Process
}
```

### Subagent Tracking Hooks Example
```typescript
// Source: Official SDK hooks documentation
const subagentStartHook: HookCallback = async (input, toolUseID, { signal }) => {
  const agentInput = input as SubagentStartHookInput;

  console.log(`Subagent spawned: ${agentInput.agent_id}`);
  console.log(`Type: ${agentInput.agent_type}`);

  return {
    hookSpecificOutput: {
      hookEventName: 'SubagentStart',
      additionalContext: `Subagent ${agentInput.agent_type} started`
    }
  };
};

const subagentStopHook: HookCallback = async (input, toolUseID, { signal }) => {
  const agentInput = input as SubagentStopHookInput;

  console.log(`Subagent completed: ${agentInput.agent_id}`);
  console.log(`Transcript: ${agentInput.agent_transcript_path}`);

  return {};
};

// Use in query
for await (const message of query({
  prompt: "Complex task requiring delegation",
  options: {
    hooks: {
      SubagentStart: [{ hooks: [subagentStartHook] }],
      SubagentStop: [{ hooks: [subagentStopHook] }]
    }
  }
})) {
  // Process
}
```

### UserPromptSubmit Validation Hook Example
```typescript
// Source: Official SDK hooks documentation
const validatePrompt: HookCallback = async (input, toolUseID, { signal }) => {
  if (input.hook_event_name !== 'UserPromptSubmit') return {};

  const promptInput = input as UserPromptSubmitHookInput;

  // Check for sensitive data
  if (/password|secret|api.?key/i.test(promptInput.prompt)) {
    return {
      continue: false,
      stopReason: 'Prompt may contain sensitive data. Please rephrase.'
    };
  }

  return {};
};
```

### System Message Injection Example
```typescript
// Source: Official SDK hooks documentation
const injectSecurityReminder: HookCallback = async (input, toolUseID, { signal }) => {
  return {
    systemMessage: 'Remember to follow security best practices when executing commands.'
  };
};

// Use on all file modification tools
for await (const message of query({
  prompt: "Update configuration",
  options: {
    hooks: {
      PreToolUse: [
        { matcher: 'Write|Edit|Bash', hooks: [injectSecurityReminder] }
      ]
    }
  }
})) {
  // Process
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| canUseTool callback only | Full hooks system with 11 event types | SDK 0.2.x | Much more granular control |
| Bash script hooks (CLI) | TypeScript callbacks (SDK) | SDK design | Cleaner integration for apps |
| Manual session tracking | SessionStart/SessionEnd hooks | SDK TS-only | Automatic lifecycle events |
| No input modification | updatedInput in PreToolUse | SDK 0.2.x | Can sanitize/redirect before execution |

**Deprecated/outdated:**
- `decision: 'approve'` / `decision: 'block'` - Use `permissionDecision: 'allow'` / `permissionDecision: 'deny'` instead

## Open Questions

Things that couldn't be fully resolved:

1. **Settings-based Hook Configuration Format**
   - What we know: CLI uses JSON in settings.json with command/type fields
   - What's unclear: Best format for web app where hooks are TypeScript callbacks
   - Recommendation: Define hook "actions" in settings.json (log, block-pattern, notify), map to built-in callbacks

2. **Hook Activity UI Representation**
   - What we know: Hooks fire server-side, client needs visibility
   - What's unclear: How to display hook activity in chat UI (inline? panel? log?)
   - Recommendation: Send SSE events for significant hook activity, display as subtle indicators

3. **PreCompact Hook Utility**
   - What we know: Fires before context compaction
   - What's unclear: What useful actions can a web app take here
   - Recommendation: Implement for completeness, use for logging/notification initially

## Sources

### Primary (HIGH confidence)
- [Agent SDK Hooks Guide](https://platform.claude.com/docs/en/agent-sdk/hooks) - Complete TypeScript SDK hooks API
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) - CLI hooks configuration and all event types
- [Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) - Type definitions

### Secondary (MEDIUM confidence)
- Existing AGENT_SDK.md research - Hooks section overview
- Existing agentService.ts - canUseTool pattern for permission handling

### Tertiary (LOW confidence)
- None - all hook information from official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - SDK provides everything needed
- Architecture: HIGH - Pattern follows existing canUseTool approach
- Pitfalls: HIGH - Official documentation covers common issues
- Hook events: HIGH - Complete list from official docs

**Research date:** 2026-01-24
**Valid until:** 2026-02-24 (30 days - SDK hooks API stable)
