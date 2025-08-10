# ChatBubble Component Plan

## Overview

### Description
A versatile message bubble component for displaying chat messages with support for different senders (user, AI, system), rich content types (text, code, images), timestamps, and interaction states. Forms the core visual element of chat interfaces.

### Visual Design Mockups
- [Default State](./mockups/chat-bubble-default.html)
- [Interactive States](./mockups/chat-bubble-interactive.html)
- [Content Types](./mockups/chat-bubble-content-types.html)
- [Dark Mode](./mockups/chat-bubble-dark.html)

### Key Features
- Multiple sender types with distinct visual styles
- Rich content rendering (markdown, code blocks, images)
- Timestamp and metadata display
- Copy/edit/delete actions
- Loading and error states
- Reactions and feedback
- Thread indicators
- Read receipts

### Use Cases
- User messages in chat interfaces
- AI responses with formatted content
- System notifications and alerts
- Error messages with retry options
- Code snippets with syntax highlighting

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| message | `Message` | ✓ | - | Message object containing content and metadata |
| sender | `'user' \| 'assistant' \| 'system'` | ✓ | - | Type of message sender |
| **Optional Props** |
| variant | `'default' \| 'compact' \| 'minimal'` | - | `'default'` | Visual variant |
| align | `'left' \| 'right' \| 'center'` | - | Based on sender | Message alignment |
| showAvatar | `boolean` | - | `true` | Show sender avatar |
| avatarUrl | `string` | - | - | Custom avatar image URL |
| avatarAlt | `string` | - | - | Avatar alt text |
| timestamp | `Date \| string` | - | - | Message timestamp |
| showTimestamp | `boolean` | - | `true` | Display timestamp |
| status | `'sending' \| 'sent' \| 'delivered' \| 'read' \| 'error'` | - | `'sent'` | Message status |
| isEditing | `boolean` | - | `false` | Edit mode state |
| isSelected | `boolean` | - | `false` | Selection state |
| **Content Options** |
| contentType | `'text' \| 'markdown' \| 'code' \| 'image' \| 'file'` | - | `'text'` | Content rendering type |
| codeLanguage | `string` | - | - | Language for syntax highlighting |
| enableMarkdown | `boolean` | - | `true` | Parse markdown in text |
| truncate | `boolean` | - | `false` | Truncate long messages |
| maxLines | `number` | - | - | Maximum lines before truncation |
| **Interactions** |
| enableCopy | `boolean` | - | `true` | Show copy button |
| enableEdit | `boolean` | - | `false` | Allow editing |
| enableDelete | `boolean` | - | `false` | Allow deletion |
| enableReactions | `boolean` | - | `false` | Enable reactions |
| reactions | `Reaction[]` | - | `[]` | Current reactions |
| **Metadata** |
| threadCount | `number` | - | - | Number of thread replies |
| isThreadStart | `boolean` | - | `false` | Marks thread beginning |
| metadata | `Record<string, any>` | - | - | Additional metadata |
| **Event Handlers** |
| onClick | `(message: Message) => void` | - | - | Click handler |
| onCopy | `(content: string) => void` | - | - | Copy action handler |
| onEdit | `(message: Message) => void` | - | - | Edit action handler |
| onDelete | `(message: Message) => void` | - | - | Delete action handler |
| onReaction | `(reaction: string) => void` | - | - | Reaction handler |
| onRetry | `() => void` | - | - | Retry handler for errors |
| **Render Props** |
| renderActions | `() => ReactNode` | - | - | Custom action buttons |
| renderAvatar | `() => ReactNode` | - | - | Custom avatar component |
| renderContent | `(content: string) => ReactNode` | - | - | Custom content renderer |

### CSS Classes & Theming

Component-specific classes needed:
- Variants: `.default`, `.compact`, `.minimal`
- Senders: `.user`, `.assistant`, `.system`
- States: `.sending`, `.error`, `.editing`, `.selected`
- Elements: `.bubble`, `.avatar`, `.content`, `.timestamp`, `.actions`

Special styling considerations:
- Tail/pointer for speech bubble effect
- Smooth animations for appearing messages
- Hover effects for interactive elements
- Responsive width constraints

## Dependencies

### External Dependencies
- [ ] Markdown parser (optional, can use built-in)
- [ ] Syntax highlighter for code blocks

### Internal Dependencies
- [x] Design tokens from `@claude-flow/ui-kit`
- [x] Components: `Avatar`, `IconButton`, `Tooltip`, `Menu`
- [x] Hooks: `useClipboard`, `useLongPress`
- [x] Utilities: `formatTimestamp`, `truncateText`

## Dependent Components

### Direct Dependents
- `ChatMessageGroup` - Groups multiple bubbles from same sender
- `ChatInterface` - Main chat container using bubbles
- `ThreadView` - Displays threaded conversations

### Indirect Dependents
- `ConversationView` - Contains chat interface
- `NotificationPanel` - Uses for system messages

## Internal Architecture

### Sub-components
- `BubbleContainer` - Main wrapper with styling
- `MessageContent` - Content renderer with markdown/code support
- `MessageActions` - Action buttons overlay
- `MessageStatus` - Status indicators
- `ReactionBar` - Reaction emoji selector

### Hooks
- `useMessageFormatting` - Handles content parsing and formatting
- `useMessageActions` - Manages action state and handlers
- `useReactions` - Reaction management

### Utilities
- `parseMarkdown` - Markdown to React elements
- `highlightCode` - Syntax highlighting
- `formatMessageTime` - Time formatting
- `getAvatarFallback` - Generate avatar initials

## Performance Considerations

### Rendering Strategy
- [x] Frequent re-renders expected (streaming text)
- [x] Large lists (in chat history)
- [ ] Animation heavy (minimal animations)

### Optimization Approaches
- **Memoization**: 
  - [x] Component memoization with `React.memo`
  - [x] Expensive calculations with `useMemo` (markdown parsing)
  - [x] Event handlers with `useCallback`

- **Lazy Loading**:
  - [x] Code syntax highlighter lazy loaded
  - [x] Image content lazy loaded
  - [x] Heavy markdown renderer on demand

- **Initial Render**:
  - Bubble shell renders immediately
  - Content processes async if needed
  - Actions appear on hover only

### Bundle Size Impact
- Core: ~10KB
- With markdown: +15KB (lazy)
- With syntax highlighting: +25KB (lazy)

## Accessibility

### ARIA Requirements
- [x] Role: `article` for message container
- [x] `aria-label` with sender and time
- [x] `aria-describedby` for status
- [x] Live region for new messages

### Keyboard Navigation
- Tab: Navigate through actions
- Enter: Trigger primary action
- Space: Toggle selection
- Escape: Cancel editing

### Screen Reader Support
- Announce sender changes
- Read full timestamp on focus
- Announce status changes
- Describe reactions count

## Testing Strategy

### Unit Tests
- [x] Different sender type rendering
- [x] Content type parsing
- [x] Action button visibility logic
- [x] Timestamp formatting
- [x] Status indicator states

### Integration Tests
- [x] Copy to clipboard functionality
- [x] Edit mode toggling
- [x] Reaction adding/removing
- [x] Thread indicator clicks

### Visual Regression Tests
- [x] All sender types
- [x] All content types
- [x] All status states
- [x] Light/dark themes

## Storybook Stories

### Essential Stories
- [x] **Default** - Basic text message
- [x] **Playground** - All props interactive
- [x] **UserMessage** - User-sent message
- [x] **AssistantMessage** - AI response
- [x] **SystemMessage** - System notification

### Interaction Stories
- [x] **WithActions** - Copy/edit/delete
- [x] **WithReactions** - Reaction bar
- [x] **ErrorState** - With retry option
- [x] **StreamingMessage** - Incoming text

### Edge Case Stories
- [x] **LongMessage** - Truncation behavior
- [x] **CodeBlock** - Syntax highlighting
- [x] **RichContent** - Mixed markdown
- [x] **Thread** - With thread indicator

## Similar Components in Open Source

### Prior Art Research
- **Slack Message** - Excellent action UX, good threading
- **Discord Message** - Great reaction system, compact mode
- **WhatsApp Bubble** - Clean design, good status indicators
- **ChatGPT Message** - Good code handling, copy functionality

### API Comparison
| Library | Prop Name | Our Equivalent | Notes |
|---------|-----------|----------------|-------|
| Stream Chat | `message` | `message` | Similar structure |
| Sendbird | `isByMe` | `sender === 'user'` | We use sender type |
| ChatUI | `position` | `align` | Similar concept |

## Implementation Checklist

### Phase 1: Foundation
- [ ] Basic bubble structure
- [ ] Sender type styling
- [ ] Text content rendering
- [ ] Timestamp display

### Phase 2: Features
- [ ] Markdown support
- [ ] Code highlighting
- [ ] Action buttons
- [ ] Status indicators

### Phase 3: Polish
- [ ] Reactions system
- [ ] Thread indicators
- [ ] Animations
- [ ] Mobile optimization

### Phase 4: Integration
- [ ] Use in ChatInterface
- [ ] Performance testing
- [ ] Accessibility audit
- [ ] Documentation

## Open Questions

### Design Decisions
- [ ] Should reactions be inline or in a popover?
- [ ] How to handle very long code blocks?
- [ ] Should we support message editing history?

### Technical Considerations
- [ ] Use virtual scrolling for long chat histories?
- [ ] How to handle message deduplication?
- [ ] Should we cache parsed markdown?

### Future Enhancements
- [ ] Voice message support
- [ ] Video/GIF embedding
- [ ] Message translation
- [ ] Collaborative editing