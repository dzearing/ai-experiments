# Chat Split/Fork Component Plan

## Overview
Component for splitting a single chat into multiple branches or forking conversations at decision points.

## Component Details

### Name
`ChatSplitFork`

### Purpose
Enable users to branch conversations, explore alternate paths, and manage parallel chat threads.

### Props Interface
```typescript
interface ChatSplitForkProps {
  chat: ChatData
  splitPoint?: number
  mode?: 'split' | 'fork' | 'branch'
  onSplit?: (branches: ChatBranch[]) => void
  onCancel?: () => void
  showPreview?: boolean
  allowCustomNames?: boolean
  maxBranches?: number
}

interface ChatData {
  id: string
  messages: ChatMessage[]
  metadata: {
    title: string
    created: Date
    participants: string[]
  }
}

interface ChatBranch {
  id: string
  name: string
  description?: string
  messages: ChatMessage[]
  splitFromMessageId: string
  splitReason?: string
  tags?: string[]
}

interface SplitOptions {
  type: 'topic' | 'time' | 'manual' | 'ai-suggested'
  strategy: 'copy-context' | 'move-messages' | 'reference-only'
  preserveHistory: boolean
}
```

## Design Tokens Usage

### Colors
- Split line: `--color-border`
- Branch colors: 
  - Primary: `--color-primary-background`
  - Secondary: `--color-info-background`
  - Tertiary: `--color-success-background`
- Preview bg: `--color-panel-backgroundSoft10`
- Selection: `--color-selection-background`

### Spacing
- Modal padding: `--spacing-large10`
- Branch gap: `--spacing`
- Preview padding: `--spacing-card`

### Typography
- Headers: `--font-weight-semibold`
- Branch names: `--font-size`
- Descriptions: `--font-size-small10`

## Split Modes

### Topic Split
- AI analyzes conversation topics
- Automatic grouping suggestions
- Topic summaries
- Smart message allocation

### Time-Based Split
- Split at time boundaries
- Session-based splitting
- Chronological breaks
- Activity gaps

### Manual Split
- User selects split point
- Drag to adjust boundary
- Custom branch naming
- Message cherry-picking

### Fork Mode
- Create parallel branches
- Explore alternatives
- A/B conversation testing
- Decision tree exploration

## Features

### Visual Timeline
- Message timeline view
- Draggable split markers
- Branch preview
- Color-coded sections

### AI Assistance
- Topic detection
- Split suggestions
- Branch naming
- Context preservation

### Branch Management
- Name and describe branches
- Set branch goals
- Tag for organization
- Priority assignment

### Preview System
- Live branch preview
- Message distribution view
- Context verification
- Undo/redo support

## Behaviors

### Split Creation
- Click to place split point
- Drag to adjust position
- Multi-split support
- Keyboard shortcuts

### Message Allocation
- Automatic distribution
- Manual override
- Shared context option
- Reference linking

### Validation
- Minimum message count
- Context completeness check
- Dependency validation
- Warning for breaks

### Confirmation
- Preview before commit
- Modification options
- Cancel with recovery
- Save as draft

## Responsive Design

### Desktop
- Side-by-side preview
- Drag interactions
- Hover tooltips
- Keyboard shortcuts

### Tablet
- Stacked preview
- Touch gestures
- Simplified controls
- Full-screen mode

### Mobile
- Step-by-step wizard
- Swipe navigation
- Compact preview
- Bottom sheet UI

## Accessibility

### Keyboard Navigation
- Tab through controls
- Arrow keys for timeline
- Enter to confirm
- Escape to cancel

### Screen Reader Support
- Split point announcements
- Branch descriptions
- Message count info
- Action confirmations

## Performance Considerations

### Optimization Strategies
- Virtualized message list
- Lazy load previews
- Debounced updates
- Efficient diffing

### Bundle Size
- Code-split AI features
- Minimal core UI
- Progressive enhancement

## Integration Examples

### Basic Split
```jsx
<ChatSplitFork
  chat={currentChat}
  mode="split"
  onSplit={(branches) => {
    branches.forEach(branch => createNewChat(branch))
  }}
/>
```

### Advanced Fork
```jsx
<ChatSplitFork
  chat={conversation}
  mode="fork"
  splitPoint={messageIndex}
  showPreview={true}
  allowCustomNames={true}
  maxBranches={4}
  onSplit={(branches) => handleFork(branches)}
/>
```

## Visual Examples

### Timeline Split View
```
Messages Timeline
─────●─────●─────●─────┃─────●─────●─────
     1     2     3     ┃     4     5
                       ┃
                  [Split Here]
                       ┃
              Branch A ┃ Branch B
              ─────────┃─────────
              Context  ┃ Context
              Msgs 1-3 ┃ Msgs 1-3
              + New    ┃ + New
```

### Fork Visualization
```
Original Chat
     │
     ├─● Message 1
     ├─● Message 2
     ├─● Message 3 ← Fork Point
     │
     ├─── Branch A: "Technical approach"
     │    ├─● Message 4a
     │    └─● Message 5a
     │
     └─── Branch B: "Business approach"
          ├─● Message 4b
          └─● Message 5b
```

### Split Preview
```
┌─────────────────────────────────┐
│ Split Conversation              │
├─────────────────────────────────┤
│ ┌──────────┐    ┌──────────┐   │
│ │Branch 1  │    │Branch 2  │   │
│ │"Feature  │    │"Bug fixes"│   │
│ │planning" │    │          │   │
│ │          │    │          │   │
│ │5 messages│    │3 messages│   │
│ └──────────┘    └──────────┘   │
│                                 │
│ [Cancel]         [Create Splits]│
└─────────────────────────────────┘
```

## Implementation Priority
**Medium** - Advanced feature for power users

## Dependencies
- Timeline visualization
- Drag and drop
- AI topic detection (optional)
- State management

## Open Questions
1. Should we support merging branches back?
2. How to handle file/code context in splits?
3. Should we track branch relationships?
4. Maximum split complexity?