# Phase 9: Subagents - Research

**Researched:** 2026-01-25
**Domain:** Agent SDK Subagent System and UI Visualization
**Confidence:** HIGH

## Summary

Phase 9 implements subagent support for claude-code-web, enabling the Task tool to spawn isolated subagents that execute specialized tasks with their own context. This research covers the Claude Agent SDK's subagent system, message handling with `parent_tool_use_id`, built-in and custom agent definitions, and UI patterns for visualizing subagent activity.

The project already has:
- Agent SDK integration with `query()` function
- SSE streaming for SDK messages to the client
- SubagentStart/SubagentStop hooks defined in types
- Basic hook infrastructure via `hooksService`
- Tool result display components

**Primary recommendation:** Extend the existing message transformer to track `parent_tool_use_id`, implement SubagentStart/SubagentStop hook handlers that emit SSE events to the UI, and create a SubagentPanel component to visualize active subagents and their progress.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/claude-agent-sdk | ^0.2.12 | Agent spawning via Task tool | Official SDK, already integrated |
| React 19 | ^19.0.0 | UI components | Already in use |
| @ui-kit/react-chat | workspace | ChatPanel with message parts | Existing message rendering |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| minimatch | existing | Pattern matching for hooks | Filtering hook events by agent type |
| uuid | existing | Generate subagent tracking IDs | Client-side correlation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom subagent tracking | SDK hooks only | Hooks provide agent_id but need client-side state for UI |
| SSE for subagent events | WebSocket | SSE sufficient for unidirectional updates, already used |

## Architecture Patterns

### Recommended Project Structure
```
apps/claude-code-web/
├── server/src/
│   ├── hooks/
│   │   └── subagentHooks.ts    # Enhanced with SSE event emission
│   ├── services/
│   │   └── agentService.ts     # Forward parent_tool_use_id in messages
│   └── routes/
│       └── agent.ts            # Emit subagent lifecycle events
├── client/src/
│   ├── types/
│   │   └── agent.ts            # Add SubagentState, SubagentEvent types
│   ├── hooks/
│   │   └── useAgentStream.ts   # Track subagents, handle lifecycle events
│   ├── utils/
│   │   └── messageTransformer.ts # Preserve parent_tool_use_id
│   └── components/
│       ├── SubagentIndicator.tsx   # Inline spawn indicator
│       ├── SubagentProgress.tsx    # Progress tracking component
│       └── ChatView.tsx            # Integrate subagent display
```

### Pattern 1: Subagent Message Identification
**What:** Messages from subagents have `parent_tool_use_id` set to the Task tool_use ID that spawned them
**When to use:** Always - required for proper message attribution
**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/agent-sdk/subagents
interface SDKAssistantMessage {
  type: 'assistant';
  uuid: string;
  session_id: string;
  message: APIAssistantMessage;
  parent_tool_use_id: string | null;  // Non-null if from subagent
}

// Client-side detection
function isSubagentMessage(message: SDKMessage): boolean {
  return 'parent_tool_use_id' in message && message.parent_tool_use_id !== null;
}
```

### Pattern 2: Agent Definition Configuration
**What:** Define subagents programmatically via `options.agents`
**When to use:** Loading custom agents from configuration
**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/agent-sdk/typescript
interface AgentDefinition {
  description: string;  // When to use this agent
  prompt: string;       // Agent's system prompt
  tools?: string[];     // Allowed tools (inherits if omitted)
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
}

// Usage in query options
const options = {
  allowedTools: ['Read', 'Grep', 'Glob', 'Task'],  // Task required!
  agents: {
    'code-reviewer': {
      description: 'Expert code reviewer for security and quality',
      prompt: 'You are a security-focused code reviewer...',
      tools: ['Read', 'Grep', 'Glob'],  // No Task - subagents can't spawn subagents
      model: 'sonnet'
    }
  }
};
```

### Pattern 3: Subagent Lifecycle Events via Hooks
**What:** SubagentStart/SubagentStop hooks fire when subagents spawn/complete
**When to use:** UI progress tracking, logging, resource cleanup
**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/agent-sdk/typescript
// SubagentStartHookInput
interface SubagentStartHookInput extends BaseHookInput {
  hook_event_name: 'SubagentStart';
  agent_id: string;      // Unique subagent identifier
  agent_type: string;    // 'code-reviewer', 'general-purpose', etc.
}

// SubagentStopHookInput
interface SubagentStopHookInput extends BaseHookInput {
  hook_event_name: 'SubagentStop';
  stop_hook_active: boolean;
  agent_id: string;
  agent_transcript_path: string;  // Path to subagent's transcript
}
```

### Pattern 4: Task Tool Input/Output Schema
**What:** Task tool interface for spawning subagents
**When to use:** Understanding what data is available when Task is invoked
**Example:**
```typescript
// Source: https://platform.claude.com/docs/en/agent-sdk/typescript
interface AgentInput {
  description: string;    // Short 3-5 word task description
  prompt: string;         // Detailed prompt for the subagent
  subagent_type: string;  // Agent type to use
}

interface TaskOutput {
  result: string;         // Final result from subagent
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  total_cost_usd?: number;
  duration_ms?: number;
}
```

### Anti-Patterns to Avoid
- **Allowing Task in subagent tools:** Subagents cannot spawn their own subagents. Never include `Task` in a subagent's `tools` array.
- **Not preserving parent_tool_use_id:** All message types include this field - must be forwarded to client for proper UI attribution.
- **Blocking main thread for subagent completion:** Background agents should run without blocking the main conversation flow.
- **Long subagent prompts on Windows:** Command line length limits (8191 chars) can cause failures. Keep prompts concise.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subagent ID generation | Custom ID scheme | SDK's `agent_id` from hooks | SDK manages agent lifecycle, IDs are stable |
| Agent type resolution | Parse from prompts | `agent_type` from SubagentStart | SDK provides agent type in hook input |
| Message correlation | Message content matching | `parent_tool_use_id` field | SDK provides explicit parent reference |
| Built-in agent behavior | Replicate Explore/Plan | SDK built-ins | `general-purpose`, `Explore`, `Plan` are SDK-provided |
| Subagent transcripts | Custom transcript storage | SDK transcript files | SDK manages `agent_transcript_path` |

**Key insight:** The SDK provides all subagent lifecycle data through hooks and message fields. Client code only needs to track and display this information, not manage agent spawning or execution.

## Common Pitfalls

### Pitfall 1: Missing Task Tool in allowedTools
**What goes wrong:** Claude cannot invoke subagents even when agents are defined
**Why it happens:** Subagents are invoked via the Task tool, which must be explicitly allowed
**How to avoid:** Always include `'Task'` in `allowedTools` when defining agents
**Warning signs:** Agent definitions exist but Claude handles tasks directly instead of delegating

### Pitfall 2: Not Tracking Subagent State on Client
**What goes wrong:** UI doesn't show which messages belong to which subagent, no progress indication
**Why it happens:** `parent_tool_use_id` is ignored or not forwarded
**How to avoid:**
1. Forward `parent_tool_use_id` in all SDK messages
2. Maintain client-side Map of active subagents (keyed by tool_use_id)
3. Update UI when SubagentStart/SubagentStop events arrive
**Warning signs:** Messages appear but aren't grouped by their parent agent

### Pitfall 3: Blocking UI During Subagent Execution
**What goes wrong:** Main chat becomes unresponsive while subagent runs
**Why it happens:** Not handling AGENT-06 requirement for background execution
**How to avoid:**
1. Run subagent processing asynchronously
2. Continue rendering main chat messages
3. Show progress indicator without blocking input
**Warning signs:** User cannot interact with chat while subagent runs

### Pitfall 4: Forgetting SubagentStop Cleanup
**What goes wrong:** Active subagent indicators remain after completion, memory leaks
**Why it happens:** Only handling SubagentStart, not SubagentStop
**How to avoid:**
1. Register SubagentStop hook handler
2. Remove subagent from active tracking
3. Mark associated UI elements as complete
**Warning signs:** Spinning indicators that never stop, growing memory usage

### Pitfall 5: Windows Command Line Length
**What goes wrong:** Subagent spawning fails with cryptic errors
**Why it happens:** Windows has 8191 character command line limit, long prompts exceed this
**How to avoid:** Keep subagent prompts concise, use filesystem-based agents for complex instructions
**Warning signs:** Works on Mac/Linux but fails on Windows

## Code Examples

Verified patterns from official sources and codebase analysis:

### Detecting Task Tool Invocation
```typescript
// Source: https://platform.claude.com/docs/en/agent-sdk/subagents
// When processing assistant messages, detect subagent spawning
function detectSubagentSpawn(message: SDKAssistantMessage): TaskSpawnInfo | null {
  for (const block of message.message.content) {
    if (block.type === 'tool_use' && block.name === 'Task') {
      return {
        toolUseId: block.id,
        subagentType: (block.input as AgentInput).subagent_type,
        description: (block.input as AgentInput).description,
        prompt: (block.input as AgentInput).prompt,
      };
    }
  }
  return null;
}
```

### Subagent State Tracking Hook
```typescript
// Client-side state for tracking active subagents
interface SubagentState {
  id: string;              // agent_id from hook
  toolUseId: string;       // Task tool_use_id this belongs to
  type: string;            // agent_type
  status: 'spawning' | 'running' | 'complete' | 'error';
  startTime: number;
  messages: SDKMessage[];  // Messages with matching parent_tool_use_id
}

// In useAgentStream hook, add subagent tracking
const [activeSubagents, setActiveSubagents] = useState<Map<string, SubagentState>>(new Map());

// Handle SubagentStart event
function handleSubagentStart(event: SubagentStartEvent) {
  setActiveSubagents(prev => {
    const next = new Map(prev);
    next.set(event.agent_id, {
      id: event.agent_id,
      toolUseId: event.tool_use_id,
      type: event.agent_type,
      status: 'running',
      startTime: Date.now(),
      messages: [],
    });
    return next;
  });
}

// Handle SubagentStop event
function handleSubagentStop(event: SubagentStopEvent) {
  setActiveSubagents(prev => {
    const next = new Map(prev);
    const subagent = next.get(event.agent_id);
    if (subagent) {
      next.set(event.agent_id, { ...subagent, status: 'complete' });
    }
    return next;
  });
}
```

### Server-Side Hook Enhancement for SSE
```typescript
// Source: Existing subagentHooks.ts pattern + SSE event emission
export function createSubagentTrackerHook(
  emitSSE: (event: SubagentEvent) => void
): { start: HookCallback; stop: HookCallback } {
  return {
    start: async (input) => {
      if (input.hook_event_name !== 'SubagentStart') return {};

      const startInput = input as SubagentStartHookInput;
      emitSSE({
        type: 'subagent_start',
        agent_id: startInput.agent_id,
        agent_type: startInput.agent_type,
        session_id: startInput.session_id,
        timestamp: Date.now(),
      });

      return {};
    },
    stop: async (input) => {
      if (input.hook_event_name !== 'SubagentStop') return {};

      const stopInput = input as SubagentStopHookInput;
      emitSSE({
        type: 'subagent_stop',
        agent_id: stopInput.agent_id,
        transcript_path: stopInput.agent_transcript_path,
        timestamp: Date.now(),
      });

      return {};
    },
  };
}
```

### UI Component Pattern - SubagentIndicator
```typescript
// Source: Based on existing ThinkingIndicator and AgentProgress patterns
interface SubagentIndicatorProps {
  subagent: SubagentState;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function SubagentIndicator({ subagent, isExpanded, onToggle }: SubagentIndicatorProps) {
  const elapsedMs = Date.now() - subagent.startTime;
  const elapsedSec = Math.floor(elapsedMs / 1000);

  return (
    <div className={styles.subagentIndicator}>
      <div className={styles.header} onClick={onToggle}>
        {subagent.status === 'running' ? (
          <span className={styles.spinner} />
        ) : (
          <span className={styles.checkmark}>✓</span>
        )}
        <span className={styles.type}>{subagent.type}</span>
        <span className={styles.elapsed}>{elapsedSec}s</span>
        {onToggle && <span className={styles.chevron}>{isExpanded ? '▼' : '▶'}</span>}
      </div>

      {isExpanded && (
        <div className={styles.messages}>
          {subagent.messages.map(msg => (
            <SubagentMessage key={msg.uuid} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Loading Custom Agents from Configuration
```typescript
// Source: Based on configService pattern
interface AgentsConfig {
  agents?: Record<string, {
    description: string;
    prompt: string;
    tools?: string[];
    model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
  }>;
}

async function loadAgentsFromConfig(cwd: string): Promise<Record<string, AgentDefinition>> {
  const config = await configService.loadConfig(cwd);
  const settings = config.settings as AgentsConfig;

  if (!settings.agents) {
    return {};  // No custom agents, SDK still provides built-ins
  }

  return settings.agents;
}

// Use in query options
const customAgents = await loadAgentsFromConfig(workingDir);
const queryOptions = {
  allowedTools: ['Read', 'Grep', 'Glob', 'Task', ...],
  agents: customAgents,
  // ...other options
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| claude-code-sdk | @anthropic-ai/claude-agent-sdk | Jan 2025 | Package renamed, same functionality |
| Manual agent spawning | Task tool | SDK feature | Subagents invoked via Task, not custom code |
| Polling for completion | Hooks + SSE | SDK 0.2.x | SubagentStart/Stop hooks provide lifecycle events |

**Deprecated/outdated:**
- Manual subprocess spawning for agents: Use SDK Task tool instead
- Custom transcript management: SDK manages `agent_transcript_path`

## Built-in Agent Types

The SDK provides several built-in subagents without requiring custom definitions:

| Agent Type | Description | Tools | Use Case |
|------------|-------------|-------|----------|
| `general-purpose` | Default delegation agent | Inherits | Any task requiring isolated context |
| `Explore` | Read-only codebase exploration | Read, Grep, Glob | Searching and understanding code without changes |
| `Plan` | Planning and analysis | Read-only | Architecture planning, task breakdown |

**Note:** Built-in agents are available when `Task` is in `allowedTools`, even without defining custom agents.

## Requirements Mapping

| Requirement | Implementation Approach |
|-------------|------------------------|
| AGENT-01: Task tool spawns subagents | SDK Task tool, forward to query() with agents config |
| AGENT-02: Built-in agent types | SDK provides these, no custom code needed |
| AGENT-03: Custom agents from options.agents | Load from settings.json via configService |
| AGENT-04: parent_tool_use_id identification | Preserve field in messageTransformer, track on client |
| AGENT-05: Visual indicator/animation | SubagentIndicator component with spinner/progress |
| AGENT-06: Background agents don't block | Async processing, separate state tracking |
| AGENT-07: Progress and completion visible | SubagentStart/Stop hooks emit SSE events to UI |

## Open Questions

Things that couldn't be fully resolved:

1. **Subagent Resume Behavior**
   - What we know: Subagents can be resumed by capturing `agent_id` and passing `resume: sessionId`
   - What's unclear: Whether UI should offer resume capability or auto-discard completed subagents
   - Recommendation: Start without resume UI, add later if needed

2. **Parallelism Limits**
   - What we know: Multiple subagents can run concurrently
   - What's unclear: Whether there's a practical limit on concurrent subagents
   - Recommendation: Track active count in UI, consider soft limit of 3-5 for UX

3. **Subagent Permission Mode**
   - What we know: Subagents inherit permission mode from parent
   - What's unclear: Whether per-subagent permission mode override is useful
   - Recommendation: Use parent permission mode for now

## Sources

### Primary (HIGH confidence)
- [Subagents in the SDK](https://platform.claude.com/docs/en/agent-sdk/subagents) - Complete subagent documentation
- [TypeScript SDK Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) - AgentDefinition, message types, hooks
- `.planning/research/AGENT_SDK.md` - Prior SDK research (verified current)
- `apps/claude-code-web/server/src/hooks/subagentHooks.ts` - Existing hook structure
- `apps/claude-code-web/client/src/types/agent.ts` - Existing message types

### Secondary (MEDIUM confidence)
- `apps/ideate/client/src/components/AgentProgress/` - UI pattern for agent progress display
- `packages/ui-kit/react-chat/src/components/ThinkingIndicator/` - Animation/progress indicator pattern

### Tertiary (LOW confidence)
- Windows command line limits - documented behavior, needs validation on actual Windows environment

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing SDK, no new dependencies
- Architecture: HIGH - Extends existing patterns (hooks, SSE, message types)
- Pitfalls: HIGH - Well-documented in official SDK docs
- UI patterns: MEDIUM - Based on existing codebase patterns, may need refinement

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (SDK version stable, check for updates if beyond this date)
