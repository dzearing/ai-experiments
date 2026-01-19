# Phase 2: Core Streaming - Research

**Researched:** 2026-01-19
**Domain:** Agent SDK streaming, React chat UI, real-time markdown rendering
**Confidence:** HIGH

## Summary

Phase 2 implements the core streaming conversation functionality where users send messages and see Claude's responses appear token by token. This builds on Phase 1's established SSE infrastructure (server on port 3002, client with useAgentStream hook) and integrates the Agent SDK's `query()` function with existing UI-kit components.

The primary technical challenges are:
1. **Agent SDK Integration** - Replacing the Phase 1 test endpoint with real `query()` calls using `includePartialMessages: true` for token streaming
2. **Message Type Mapping** - Converting SDK message types (SDKAssistantMessage, SDKPartialAssistantMessage, SDKResultMessage) to the UI-kit's ChatMessage format
3. **Thinking Block Display** - Rendering `ThinkingBlock` content during extended reasoning using ThinkingIndicator
4. **Streaming Markdown** - Using MarkdownRenderer's streaming mode for token-by-token text reveal

**Primary recommendation:** Implement a message transformer layer that converts SDK messages to ChatPanelMessage format, using the existing ChatPanel component (not VirtualizedChatPanel for Phase 2 simplicity).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/claude-agent-sdk` | 0.2.12+ | Agent query API | Official SDK for Claude agentic capabilities |
| `@ui-kit/react-chat` | local | Chat UI components | Project's existing chat component library |
| `@ui-kit/react-markdown` | local | Markdown rendering | Project's existing markdown renderer with streaming |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `uuid` | existing | Generate message IDs | Already in server dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ChatPanel | VirtualizedChatPanel | Virtualized is better for 1000+ messages, adds complexity; start with ChatPanel |
| SSE | WebSocket | WebSocket is bidirectional but SSE simpler for server->client streaming |

**Installation:**
```bash
# Agent SDK (if not already installed)
pnpm add @anthropic-ai/claude-agent-sdk

# Already available in monorepo:
# - @ui-kit/react-chat
# - @ui-kit/react-markdown
```

## Architecture Patterns

### Recommended Project Structure
```
apps/claude-code-web/
├── server/src/
│   ├── routes/
│   │   └── agent.ts              # SSE endpoint with real SDK calls
│   ├── services/
│   │   └── agentService.ts       # SDK query wrapper
│   └── types/
│       └── index.ts              # Extended message types
└── client/src/
    ├── components/
    │   ├── ChatView.tsx          # Main chat view (refactored)
    │   ├── MessageList.tsx       # Uses ChatPanel
    │   └── ThinkingBlock.tsx     # Extended thinking display
    ├── hooks/
    │   ├── useAgentStream.ts     # Existing, enhanced
    │   └── useConversation.ts    # NEW: Multi-turn state management
    ├── types/
    │   └── agent.ts              # SDK message type mappings
    └── utils/
        └── messageTransformer.ts # SDK -> ChatPanelMessage
```

### Pattern 1: Message Transformation Layer
**What:** Convert SDK messages to UI component props
**When to use:** Always, for all SDK message types
**Example:**
```typescript
// Source: AGENT_SDK.md research + ChatMessage interface
import type { ChatPanelMessage, ChatMessagePart } from '@ui-kit/react-chat';

interface SDKAssistantMessage {
  type: 'assistant';
  uuid: string;
  session_id: string;
  message: {
    content: Array<
      | { type: 'text'; text: string }
      | { type: 'tool_use'; id: string; name: string; input: object }
      | { type: 'thinking'; thinking: string }
    >;
  };
}

function transformAssistantMessage(sdkMsg: SDKAssistantMessage): ChatPanelMessage {
  const parts: ChatMessagePart[] = [];

  for (const block of sdkMsg.message.content) {
    if (block.type === 'text') {
      parts.push({ type: 'text', text: block.text });
    } else if (block.type === 'tool_use') {
      // Accumulate tool calls into tool_calls part
      const lastPart = parts[parts.length - 1];
      if (lastPart?.type === 'tool_calls') {
        lastPart.calls.push({
          name: block.name,
          input: block.input as Record<string, unknown>,
          completed: false, // Will be updated when result comes
          startTime: Date.now(),
        });
      } else {
        parts.push({
          type: 'tool_calls',
          calls: [{
            name: block.name,
            input: block.input as Record<string, unknown>,
            completed: false,
            startTime: Date.now(),
          }]
        });
      }
    }
    // Note: thinking blocks handled separately via ThinkingIndicator
  }

  return {
    id: sdkMsg.uuid,
    content: '', // Deprecated, use parts
    parts,
    timestamp: new Date(),
    senderName: 'Claude',
    isOwn: false,
    isStreaming: true, // Will be set to false when complete
    renderMarkdown: true,
  };
}
```

### Pattern 2: Streaming Token Accumulation
**What:** Accumulate partial messages into complete text
**When to use:** When `includePartialMessages: true` enabled
**Example:**
```typescript
// Source: AGENT_SDK.md - SDKPartialAssistantMessage
interface StreamingState {
  currentText: string;
  currentMessageId: string | null;
}

function handlePartialMessage(
  state: StreamingState,
  partial: SDKPartialAssistantMessage
): StreamingState {
  // RawMessageStreamEvent has delta property for text updates
  const event = partial.event;

  if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
    return {
      ...state,
      currentText: state.currentText + event.delta.text,
    };
  }

  if (event.type === 'message_start') {
    return {
      currentText: '',
      currentMessageId: partial.uuid,
    };
  }

  return state;
}
```

### Pattern 3: Session-Based Multi-Turn
**What:** Maintain conversation context across messages
**When to use:** All conversations after first message
**Example:**
```typescript
// Source: AGENT_SDK.md Section 3
interface ConversationState {
  sessionId: string | null;
  messages: ChatPanelMessage[];
  isStreaming: boolean;
}

// First message - no session
const firstQuery = query({ prompt: userMessage, options: {} });

// On system init message, capture session
for await (const msg of firstQuery) {
  if (msg.type === 'system' && msg.subtype === 'init') {
    state.sessionId = msg.session_id;
  }
}

// Subsequent messages - resume session
const followupQuery = query({
  prompt: nextUserMessage,
  options: { resume: state.sessionId }
});
```

### Anti-Patterns to Avoid
- **Don't buffer all tokens before render:** Stream text as it arrives; MarkdownRenderer handles incomplete markdown
- **Don't ignore thinking blocks:** Users expect to see Claude is "thinking deeply" during extended reasoning
- **Don't create new sessions each turn:** Resume existing session for context continuity
- **Don't mix legacy `content` prop with `parts`:** Use `parts` exclusively for new messages

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom parser | MarkdownRenderer | Has syntax highlighting, streaming, deep links |
| Streaming text effect | Character reveal loop | useStreamingMarkdown hook | Handles cursor, completion callbacks |
| Chat message layout | Custom divs | ChatMessage component | Has avatar, tool calls, consecutive grouping |
| Scroll management | Manual scrollTo | ChatPanel/useScrollLock | Has smart lock/unlock on user scroll |
| Code syntax highlighting | Prism direct use | CodeBlock via MarkdownRenderer | Integrated, themed, with line numbers |
| Tool call display | Custom status UI | ChatMessageToolCall interface | Has timer, completion states, expand/collapse |
| Thinking indicator | Spinner + text | ThinkingIndicator | Has cycling verbs, elapsed timer, escape hint |

**Key insight:** The ui-kit packages already solve the UI challenges. Phase 2 focus should be on SDK integration and message transformation, not UI building.

## Common Pitfalls

### Pitfall 1: Missing includePartialMessages Option
**What goes wrong:** Response appears all at once instead of streaming token by token
**Why it happens:** Agent SDK default doesn't emit partial messages
**How to avoid:** Always pass `includePartialMessages: true` in query options
**Warning signs:** Messages appear instantly, no typing animation

### Pitfall 2: Incorrect Content Block Handling
**What goes wrong:** Text and tool calls don't interleave properly
**Why it happens:** Treating all content as single text block
**How to avoid:** Use the `parts` array format from ChatMessage, iterate content blocks
**Warning signs:** Tools appear at end instead of inline with explanation

### Pitfall 3: Session Not Resuming
**What goes wrong:** Each message starts fresh context, Claude "forgets" conversation
**Why it happens:** Not capturing/passing session_id from init message
**How to avoid:** Store session_id on system init, pass in `resume` option
**Warning signs:** Claude asks questions already answered, repeats itself

### Pitfall 4: EventSource Reconnect Loop
**What goes wrong:** Client rapidly reconnects on error, server overwhelmed
**Why it happens:** EventSource auto-reconnects on error
**How to avoid:** Close EventSource on result message, implement backoff
**Warning signs:** Multiple connections in server logs, "connection" messages repeating

### Pitfall 5: Thinking Block Not Displayed
**What goes wrong:** Extended thinking happens but user sees nothing
**Why it happens:** ThinkingBlock content not extracted from SDK messages
**How to avoid:** Check for `type: 'thinking'` in content blocks, show ThinkingIndicator
**Warning signs:** Long pause with no UI feedback during complex questions

### Pitfall 6: Context Usage Not Tracked
**What goes wrong:** User can't see how much context is consumed
**Why it happens:** Not extracting usage from SDKResultMessage
**How to avoid:** Parse `result.usage` and `result.modelUsage` for token counts
**Warning signs:** No token counter in UI

## Code Examples

Verified patterns from SDK research and existing components:

### Server: Real SDK Streaming Endpoint
```typescript
// Source: AGENT_SDK.md Section 9
import { query } from '@anthropic-ai/claude-agent-sdk';
import { Router, type Request, type Response } from 'express';

router.get('/stream', async (req: Request, res: Response) => {
  const { prompt, sessionId } = req.query as { prompt: string; sessionId?: string };

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const queryIterator = query({
      prompt,
      options: {
        resume: sessionId || undefined,
        includePartialMessages: true,
        permissionMode: 'bypassPermissions', // For web demo; adjust for production
      }
    });

    for await (const message of queryIterator) {
      res.write(`data: ${JSON.stringify(message)}\n\n`);

      // End stream on result
      if (message.type === 'result') {
        res.end();
        return;
      }
    }
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`);
    res.end();
  }
});
```

### Client: Enhanced useAgentStream Hook
```typescript
// Source: Existing hook + SDK message types
import { useState, useCallback, useRef } from 'react';
import type { ChatPanelMessage } from '@ui-kit/react-chat';

interface UseAgentStreamReturn {
  messages: ChatPanelMessage[];
  isStreaming: boolean;
  isThinking: boolean;
  thinkingContent: string;
  sessionId: string | null;
  contextUsage: { input: number; output: number } | null;
  error: string | null;
  sendMessage: (prompt: string) => void;
  interrupt: () => void;
  clearMessages: () => void;
}

export function useAgentStream(): UseAgentStreamReturn {
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingContent, setThinkingContent] = useState('');
  // ... rest of implementation
}
```

### Client: Using ChatPanel with Streaming
```typescript
// Source: ChatPanel component API
import { ChatPanel, ChatInput, ThinkingIndicator } from '@ui-kit/react-chat';
import { useAgentStream } from '../hooks/useAgentStream';

export function ConversationView() {
  const {
    messages,
    isStreaming,
    isThinking,
    thinkingContent,
    sendMessage,
    interrupt,
  } = useAgentStream();

  return (
    <div className={styles.conversation}>
      <ChatPanel
        messages={messages}
        isLoading={isStreaming && !isThinking}
        loadingText="Claude is responding..."
        autoScroll={true}
        emptyState={<WelcomeMessage />}
      />

      {isThinking && (
        <ThinkingIndicator
          isActive={true}
          statusText={thinkingContent ? 'Deep thinking...' : undefined}
        />
      )}

      <ChatInput
        onSubmit={(data) => sendMessage(data.content)}
        disabled={isStreaming}
        placeholder="Message Claude..."
      />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CLI SDK (claude-code) | Agent SDK (claude-agent-sdk) | 2025 | Direct API instead of CLI wrapper |
| Content as string | Content as parts array | ui-kit update | Better interleaving of text/tools |
| Polling for responses | SSE streaming | N/A | Real-time token display |
| Simple text render | MarkdownRenderer | N/A | Syntax highlighting, streaming cursor |

**Deprecated/outdated:**
- ChatMessage `content` prop: Use `parts` array instead for proper interleaving
- ChatMessage `toolCalls` prop: Include in `parts` as `tool_calls` type

## Open Questions

Things that couldn't be fully resolved:

1. **Tool Permission UI**
   - What we know: SDK has `canUseTool` callback for permission prompts
   - What's unclear: Phase 2 scope says "read-only tools only" - do we need permission UI?
   - Recommendation: Use `bypassPermissions` for Phase 2, defer permission UI to later phase

2. **Interrupt Mechanism**
   - What we know: Query object has `interrupt()` method
   - What's unclear: How to wire Cmd+C in browser to interrupt
   - Recommendation: Add abort button, call `interrupt()` on click

3. **Context Window Display**
   - What we know: SDKResultMessage has `usage` with token counts
   - What's unclear: Exact UI for displaying context consumption
   - Recommendation: Simple "X / 200k tokens" progress bar in header

## Sources

### Primary (HIGH confidence)
- `.planning/research/AGENT_SDK.md` - Comprehensive SDK documentation
- `packages/ui-kit/react-chat/` - ChatPanel, ChatMessage, ChatInput, ThinkingIndicator source
- `packages/ui-kit/react-markdown/` - MarkdownRenderer, useStreamingMarkdown source

### Secondary (MEDIUM confidence)
- Existing Phase 1 code in `apps/claude-code-web/` - Working SSE infrastructure

### Tertiary (LOW confidence)
- None - all findings verified against source code and official SDK docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing packages, SDK documented
- Architecture: HIGH - Patterns derived from SDK docs and existing components
- Pitfalls: HIGH - Based on SDK documentation and common streaming issues

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - SDK is stable)

---

## Implementation Checklist Summary

For the planner, key implementation areas:

1. **Server**
   - [ ] Install Agent SDK if needed
   - [ ] Replace test endpoint with real `query()` calls
   - [ ] Add session management (store/retrieve session IDs)
   - [ ] Enable `includePartialMessages: true`

2. **Client**
   - [ ] Create message transformer utility (SDK -> ChatPanelMessage)
   - [ ] Enhance useAgentStream for partial message handling
   - [ ] Add useConversation hook for multi-turn state
   - [ ] Refactor ChatView to use ChatPanel
   - [ ] Add ThinkingIndicator for extended reasoning
   - [ ] Add context usage display

3. **Types**
   - [ ] Define SDK message interfaces (server types)
   - [ ] Define transformed message types (client types)
   - [ ] Define conversation state interface

4. **Testing**
   - [ ] Verify streaming works token by token
   - [ ] Verify thinking blocks display
   - [ ] Verify multi-turn maintains context
   - [ ] Verify markdown renders during streaming
