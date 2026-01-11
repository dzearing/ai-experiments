# Plan 04: Chat Virtualization & Performance Optimization

## Problem Statement

The chat windows become laggy when large amounts of content flow in. Two primary issues:

1. **Scroll performance**: All messages render regardless of visibility, causing DOM bloat and layout thrashing
2. **Input lag**: Typing in ChatInput triggers re-renders of the entire chat panel, causing noticeable keystroke delay when chat history is long

Additionally, scroll gets locked to the bottom, even if the user scrolls up, making it impossible to scroll back to see what happened while things progress in execution.

## Current Architecture Issues

### No Virtualization

`ChatPanel.tsx` renders all messages via simple array mapping:

```typescript
// Current implementation - renders ALL messages
{messages.map((message, index) => (
  <ChatMessage key={message.id} {...message} />
))}
```

With 100+ messages containing markdown, code blocks, and tool calls, this creates:
- Thousands of DOM nodes
- Expensive layout calculations on every update
- Memory pressure from retained React elements

### Scroll Behavior

Current auto-scroll implementation (ChatPanel.tsx lines 103-109):

```typescript
useEffect(() => {
  if (autoScroll && messagesContainerRef.current) {
    const container = messagesContainerRef.current;
    container.scrollTop = container.scrollHeight;
  }
}, [messages, autoScroll]);
```

Issues:
- No detection of user scrolling up to read history
- Forces scroll to bottom on every message update
- `autoScroll` is a prop, not dynamic state based on scroll position

### Input-to-Panel Coupling

When user types in `ChatInput`:
1. `onChange` callback fires on every keystroke
2. Parent component state updates (e.g., draft message)
3. Parent re-renders both `ChatInput` AND `ChatPanel`
4. `ChatPanel` re-renders all `ChatMessage` children
5. Each `ChatMessage` re-renders (no `React.memo`)

This cascading re-render happens **per keystroke**.

### Missing Memoization

Neither `ChatPanel` nor `ChatMessage` use `React.memo`. Parent re-renders force full subtree re-renders even when message data hasn't changed.

---

## Proposed Solution

### Phase 1: Component Memoization (Quick Win)

**Goal**: Prevent unnecessary re-renders of unchanged messages.

#### 1.1 Memoize ChatMessage

```typescript
// ChatMessage.tsx
export const ChatMessage = React.memo(function ChatMessage({
  id,
  parts,
  timestamp,
  senderName,
  // ... other props
}: ChatMessageProps) {
  // ... existing implementation
});
```

Add custom comparison if needed for complex props:

```typescript
export const ChatMessage = React.memo(
  function ChatMessage(props: ChatMessageProps) { /* ... */ },
  (prevProps, nextProps) => {
    // Only re-render if message content actually changed
    return (
      prevProps.id === nextProps.id &&
      prevProps.content === nextProps.content &&
      prevProps.parts === nextProps.parts &&
      prevProps.isStreaming === nextProps.isStreaming &&
      prevProps.isConsecutive === nextProps.isConsecutive
    );
  }
);
```

#### 1.2 Memoize ChatPanel

```typescript
// ChatPanel.tsx
export const ChatPanel = React.memo(function ChatPanel({
  messages,
  autoScroll,
  // ... other props
}: ChatPanelProps) {
  // ... existing implementation
});
```

#### 1.3 Isolate ChatInput State

Ensure `ChatInput` manages its own draft state internally rather than lifting every keystroke to parent:

```typescript
// Parent component
const [submittedMessages, setSubmittedMessages] = useState<Message[]>([]);

// Only update parent on submit, not on every keystroke
<ChatInput
  onSubmit={(content) => {
    // This is the only time parent state changes
    handleSendMessage(content);
  }}
/>
```

**Files to modify**:
- `packages/ui-kit/react-chat/src/components/ChatMessage/ChatMessage.tsx`
- `packages/ui-kit/react-chat/src/components/ChatPanel/ChatPanel.tsx`
- Consuming components that lift ChatInput state unnecessarily

---

### Phase 2: Smart Scroll Locking

**Goal**: Auto-scroll by default, but unlock when user scrolls up to read history.

#### 2.1 Scroll Lock State Machine

```typescript
type ScrollLockState = 'locked' | 'unlocked';

function useScrollLock(containerRef: RefObject<HTMLElement>) {
  const [lockState, setLockState] = useState<ScrollLockState>('locked');
  const userScrolledRef = useRef(false);

  // Detect user scroll vs programmatic scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const threshold = 50; // pixels from bottom to consider "at bottom"

        if (distanceFromBottom <= threshold) {
          // User scrolled back to bottom - re-lock
          setLockState('locked');
        } else if (userScrolledRef.current) {
          // User scrolled away from bottom - unlock
          setLockState('unlocked');
        }

        ticking = false;
      });
    };

    // Detect user-initiated scroll (wheel, touch, keyboard)
    const handleUserScroll = () => {
      userScrolledRef.current = true;
      // Reset after scroll event settles
      setTimeout(() => { userScrolledRef.current = false; }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleUserScroll, { passive: true });
    container.addEventListener('touchmove', handleUserScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleUserScroll);
      container.removeEventListener('touchmove', handleUserScroll);
    };
  }, [containerRef]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container && lockState === 'locked') {
      container.scrollTop = container.scrollHeight;
    }
  }, [containerRef, lockState]);

  return { lockState, scrollToBottom, setLockState };
}
```

#### 2.2 Visual Indicator for Unlocked State

When unlocked with new messages below viewport, show a "jump to bottom" button:

```typescript
{lockState === 'unlocked' && hasNewMessages && (
  <button
    className={styles.jumpToBottom}
    onClick={() => {
      setLockState('locked');
      scrollToBottom();
    }}
  >
    ↓ New messages
  </button>
)}
```

#### 2.3 Integration with ChatPanel

```typescript
// ChatPanel.tsx
export function ChatPanel({ messages, /* ... */ }: ChatPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { lockState, scrollToBottom } = useScrollLock(containerRef);
  const [lastSeenCount, setLastSeenCount] = useState(messages.length);

  // Track new messages while unlocked
  const hasNewMessages = lockState === 'unlocked' && messages.length > lastSeenCount;

  // Auto-scroll only when locked
  useEffect(() => {
    if (lockState === 'locked') {
      scrollToBottom();
      setLastSeenCount(messages.length);
    }
  }, [messages, lockState, scrollToBottom]);

  // ...
}
```

**Files to modify**:
- `packages/ui-kit/react-chat/src/components/ChatPanel/ChatPanel.tsx`
- `packages/ui-kit/react-chat/src/components/ChatPanel/ChatPanel.module.css`
- New hook: `packages/ui-kit/react-chat/src/hooks/useScrollLock.ts`

---

### Phase 3: Virtualized Message List

**Goal**: Render only visible messages plus buffer, enabling smooth scroll through thousands of messages.

#### 3.1 Library Selection

Recommended: **@tanstack/react-virtual** (formerly react-virtual)
- Lightweight (~3KB gzipped)
- Excellent TypeScript support
- Handles variable-height items well
- Active maintenance

Alternative: **react-window** with **react-virtualized-auto-sizer**
- More established but larger bundle
- Better for fixed-height items

#### 3.2 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│ ChatPanel                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ Scroll Container (overflow-y: auto)         │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ Virtual List                            │ │ │
│ │ │                                         │ │ │
│ │ │ [Spacer: items 0-47 height]            │ │ │
│ │ │                                         │ │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ │
│ │ │ │ Message 48 (rendered)               │ │ │ │
│ │ │ └─────────────────────────────────────┘ │ │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ │
│ │ │ │ Message 49 (rendered)               │ │ │ │
│ │ │ └─────────────────────────────────────┘ │ │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ │
│ │ │ │ Message 50 (rendered) ← viewport    │ │ │ │
│ │ │ └─────────────────────────────────────┘ │ │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ │
│ │ │ │ Message 51 (rendered)               │ │ │ │
│ │ │ └─────────────────────────────────────┘ │ │ │
│ │ │ ┌─────────────────────────────────────┐ │ │ │
│ │ │ │ Message 52 (rendered)               │ │ │ │
│ │ │ └─────────────────────────────────────┘ │ │ │
│ │ │                                         │ │ │
│ │ │ [Spacer: items 53-99 height]           │ │ │
│ │ │                                         │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

#### 3.3 Variable Height Handling

Chat messages have variable heights due to:
- Different content lengths
- Code blocks with varying line counts
- Tool call expansions
- Image attachments

Strategy: **Dynamic measurement with caching**

```typescript
function useVirtualizedMessages(messages: ChatPanelMessage[]) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Height cache persists across renders
  const measurementCache = useRef(new Map<string, number>());

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const message = messages[index];
      // Return cached height or estimate
      return measurementCache.current.get(message.id) ?? estimateMessageHeight(message);
    },
    overscan: 5, // Render 5 items above and below viewport
    measureElement: (element) => {
      // Measure actual rendered height
      const height = element.getBoundingClientRect().height;
      const id = element.getAttribute('data-message-id');
      if (id) {
        measurementCache.current.set(id, height);
      }
      return height;
    },
  });

  return { parentRef, virtualizer };
}

function estimateMessageHeight(message: ChatPanelMessage): number {
  // Rough estimation based on content
  const baseHeight = 60; // Avatar, name, timestamp
  const contentLength = message.content?.length ?? 0;
  const estimatedLines = Math.ceil(contentLength / 80);
  const lineHeight = 24;
  const toolCallHeight = (message.toolCalls?.length ?? 0) * 48;

  return baseHeight + (estimatedLines * lineHeight) + toolCallHeight;
}
```

#### 3.4 Virtualized ChatPanel Implementation

```typescript
// VirtualizedChatPanel.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedChatPanel({
  messages,
  renderMarkdown = true,
  // ... other props
}: ChatPanelProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { lockState, scrollToBottom } = useScrollLock(parentRef);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Will be refined by measurement
    overscan: 10, // Render 10 extra items each direction for smooth scroll
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  // Auto-scroll when locked
  useEffect(() => {
    if (lockState === 'locked' && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length, lockState, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className={styles.messages}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const message = messages[virtualItem.index];
          const prevMessage = messages[virtualItem.index - 1];
          const isConsecutive = prevMessage?.senderName === message.senderName;

          return (
            <div
              key={message.id}
              data-message-id={message.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ChatMessage
                {...message}
                isConsecutive={isConsecutive}
                renderMarkdown={renderMarkdown}
              />
            </div>
          );
        })}
      </div>

      {lockState === 'unlocked' && (
        <JumpToBottomButton onClick={() => scrollToBottom()} />
      )}
    </div>
  );
}
```

#### 3.5 Overscan Configuration

To prevent visual pop-in during fast scrolling:

```typescript
const virtualizer = useVirtualizer({
  // ...
  overscan: 10, // Number of items to render outside visible area
  // This means: 10 above viewport + visible items + 10 below viewport
});
```

For very fast scrolling (e.g., scrollbar dragging), consider:
- Higher overscan (15-20 items)
- Placeholder skeleton while measuring
- Debounced measurement for streamed content

#### 3.6 Handling Streaming Messages

Streaming messages change height as content flows in. Strategy:

```typescript
// Re-measure when streaming message updates
useEffect(() => {
  const streamingMessage = messages.find(m => m.isStreaming);
  if (streamingMessage) {
    // Force re-measure of streaming message
    const index = messages.findIndex(m => m.id === streamingMessage.id);
    virtualizer.resizeItem(index);
  }
}, [messages, virtualizer]);
```

**Files to modify/create**:
- `packages/ui-kit/react-chat/src/components/ChatPanel/VirtualizedChatPanel.tsx` (new)
- `packages/ui-kit/react-chat/src/hooks/useVirtualizedMessages.ts` (new)
- Update `packages/ui-kit/react-chat/src/index.ts` exports
- Add `@tanstack/react-virtual` to `packages/ui-kit/react-chat/package.json`

---

### Phase 4: Input Isolation

**Goal**: Ensure ChatInput keystrokes never trigger ChatPanel re-renders.

#### 4.1 State Boundary

Create clear component boundaries where state changes don't propagate:

```
┌──────────────────────────────────────────┐
│ ChatContainer                            │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ChatPanel (memoized)                 │ │
│ │ - Only re-renders when messages      │ │
│ │   array reference changes            │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ChatInput (isolated state)           │ │
│ │ - Internal draft state               │ │
│ │ - Only calls onSubmit on send        │ │
│ └──────────────────────────────────────┘ │
│                                          │
└──────────────────────────────────────────┘
```

#### 4.2 Controlled vs Uncontrolled ChatInput

Current: Semi-controlled (onChange fires on every keystroke)

Proposed: Uncontrolled with submit callback

```typescript
// ChatInput manages its own state
export function ChatInput({
  onSubmit,        // Called only on send
  onCommand,       // Called on slash command execution
  placeholder,
  // NO onChange prop - internal state only
}: ChatInputProps) {
  // All draft state is internal
  const [editor] = useChatEditor({ /* ... */ });

  const handleSubmit = useCallback(() => {
    const content = editor.getText();
    if (content.trim()) {
      onSubmit(content);
      editor.commands.clearContent();
    }
  }, [editor, onSubmit]);

  // Parent never knows about keystrokes
}
```

#### 4.3 Expose Imperative API for Special Cases

If parent needs to read/set content (e.g., draft persistence):

```typescript
export interface ChatInputRef {
  focus: () => void;
  clear: () => void;
  getContent: () => string;
  setContent: (content: string) => void;
}

// Usage
const inputRef = useRef<ChatInputRef>(null);

// Read content only when needed (not on every keystroke)
const handleSaveDraft = () => {
  const draft = inputRef.current?.getContent();
  saveDraft(draft);
};
```

**Files to modify**:
- `packages/ui-kit/react-chat/src/components/ChatInput/ChatInput.tsx`
- Consuming components that pass `onChange`

---

## Implementation Order

### Batch 1: Quick Wins (Low Risk)
1. Add `React.memo` to `ChatMessage`
2. Add `React.memo` to `ChatPanel`
3. Verify ChatInput doesn't lift state unnecessarily

**Expected impact**: 50-70% reduction in re-renders during typing

### Batch 2: Scroll Behavior
1. Create `useScrollLock` hook
2. Integrate with `ChatPanel`
3. Add "jump to bottom" button
4. Test with various scroll scenarios

**Expected impact**: Much better UX when reading history while messages stream in

### Batch 3: Virtualization
1. Add `@tanstack/react-virtual` dependency
2. Create `VirtualizedChatPanel` component
3. Implement height estimation and caching
4. Handle streaming message re-measurement
5. Integrate scroll lock with virtualizer
6. Update consuming components to use new component

**Expected impact**: Smooth performance with 1000+ messages

### Batch 4: Input Isolation
1. Refactor ChatInput to uncontrolled mode
2. Update imperative ref API
3. Update all consuming components
4. Verify no regression in features

**Expected impact**: Zero ChatPanel re-renders while typing

---

## Storybook Stories

Comprehensive stories have been added to `packages/ui-kit/react-chat/src/components/ChatPanel/ChatPanel.stories.tsx` for testing and validation:

### Static Stories
- **Default**: Basic conversation with 3 messages
- **EmptyState**: No messages with placeholder
- **Loading**: Shows thinking indicator
- **TypingIndicator**: Single user typing
- **MultipleTyping**: Multiple users typing

### Stress Test Stories
- **StressTest50Messages**: 50 messages with variable heights
- **StressTest200Messages**: 200 messages - scroll lag visible
- **StressTest500Messages**: 500 messages - significant lag without virtualization
- **ToolCallsStressTest**: 50 messages with multiple tool calls each
- **MixedContentStressTest**: 100 messages mixing text, markdown, code, and tools
- **LongMessagesTest**: Messages with very long content and large code blocks

### Dynamic Stories
- **StreamingMessage**: Simulates AI response streaming (content grows over time)
- **DynamicMessages**: Add messages manually or auto-add 2/sec
- **ScrollBehaviorTest**: Continuous message additions to test scroll lock behavior
- **PerformanceProfile**: Adjustable message count with render time measurement

### Usage

```bash
# Run Storybook to test
cd packages/ui-kit/react-chat
pnpm storybook

# Navigate to "React Chat / ChatPanel" in the sidebar
```

These stories serve as:
1. **Baseline measurement** - Document current performance before optimization
2. **Regression testing** - Ensure virtualization doesn't break existing behavior
3. **Visual validation** - Verify scroll behavior, streaming, and tool calls work correctly

---

## Testing Plan

### Unit Tests
- `useScrollLock` hook behavior
- Height estimation function
- Memoization comparison functions

### Integration Tests
- Scroll lock/unlock transitions
- Virtualization with variable heights
- Streaming message handling
- Jump to bottom functionality

### Performance Tests
- Measure render count during typing (before/after)
- Measure scroll FPS with 500+ messages
- Profile memory usage with large histories
- Test on lower-powered devices

### Manual Testing Scenarios
1. Type rapidly in input with 200+ messages - should not lag
2. Scroll up while messages stream in - should stay in place
3. Click "jump to bottom" - should scroll and re-lock
4. Scroll to middle, wait, scroll to bottom - should re-lock
5. Fast scrollbar drag through 500 messages - should remain smooth
6. Expand/collapse tool calls - should not break virtualization

---

## Rollout Strategy

1. **Feature flag**: Introduce behind flag to enable gradual rollout
2. **A/B testing**: Compare performance metrics between old and new
3. **Gradual migration**: Replace ChatPanel usages one by one
4. **Monitoring**: Track scroll performance, re-render counts, user complaints

---

## Dependencies

### New Packages
- `@tanstack/react-virtual` - Virtualization library

### Peer Dependencies (already present)
- `react` >= 18
- `react-dom` >= 18

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Variable height measurement inaccurate | Use actual measurement after render, cache results |
| Scroll position jumps during measurement | Debounce measurements, smooth scrolling |
| Consecutive message detection breaks with gaps | Track sender across virtual items, not just adjacent rendered items |
| Tool call expansion breaks layout | Re-measure on expand/collapse, use CSS transitions |
| Streaming content causes constant re-measurement | Throttle measurement updates, batch height changes |
| Jump to bottom button annoying | Add small delay before showing, allow dismissal |

---

## Success Metrics

1. **Typing latency**: < 16ms per keystroke (60fps) regardless of message count
2. **Scroll FPS**: Maintain 60fps with 1000+ messages
3. **Memory usage**: Linear growth with message count, not exponential
4. **Time to interactive**: < 100ms to start typing after opening chat
5. **User satisfaction**: Reduction in "laggy chat" feedback

---

## Future Considerations

- **Message grouping by date**: Virtual items could be date headers + message groups
- **Search and highlight**: Jump to search results in virtualized list
- **Infinite scroll up**: Load older messages on scroll to top
- **Message editing**: Handle height changes when editing inline
- **Reactions/threads**: Additional UI that affects message height
