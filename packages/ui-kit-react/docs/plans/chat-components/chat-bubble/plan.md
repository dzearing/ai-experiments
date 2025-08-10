# ChatBubble

**Priority**: High

**Description**: A versatile message bubble component that handles both user and AI messages with full markdown support, syntax highlighting, and interactive features.

**Base Component**: Card (extends all Card props)

**Component Dependencies**:
- Card (container structure with header/content/footer)
- Avatar (user/AI identification)
- MessageActions (action toolbar)
- StreamingText (typing animation)
- Button (action buttons)
- Tooltip (additional info)

**API Surface Extension**:
```typescript
interface ChatBubbleProps extends CardProps {
  // Message content
  message: string;
  isStreaming?: boolean;
  streamingSpeed?: number;
  
  // Sender information
  sender: {
    id: string;
    name: string;
    avatar?: string;
    type: 'user' | 'ai' | 'system';
  };
  
  // Timestamp
  timestamp: Date;
  showRelativeTime?: boolean;
  
  // Actions
  actions?: MessageAction[];
  showActionsOnHover?: boolean;
  
  // Reactions
  reactions?: Reaction[];
  onReaction?: (emoji: string) => void;
  
  // Threading
  threadId?: string;
  replyCount?: number;
  
  // Content rendering
  enableMarkdown?: boolean;
  enableCodeHighlighting?: boolean;
  maxHeight?: number;
  collapsible?: boolean;
}
```

**Features**:
- Full markdown rendering with custom renderers
- Syntax highlighting for code blocks
- Copy/edit/retry action buttons
- Timestamp display with relative time
- Avatar integration
- Streaming text support with cursor
- Message status indicators
- Reactions/emoji support
- Thread/reply indicators
- Collapsible long messages

**Use Cases**:
- AI chat conversations
- User messaging interfaces
- Comment systems
- Support chat displays
- Code review discussions