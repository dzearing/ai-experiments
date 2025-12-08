# Chat Summary Card Component Plan

## Overview
Compact, informative card component for displaying chat summaries in lists, grids, and dashboards.

## Component Details

### Name
`ChatSummaryCard`

### Purpose
Provide at-a-glance chat information with key metrics, status, and quick actions.

### Props Interface
```typescript
interface ChatSummaryCardProps {
  chat: ChatSummary
  variant?: 'compact' | 'standard' | 'detailed' | 'minimal'
  onClick?: () => void
  onAction?: (action: string, chatId: string) => void
  selected?: boolean
  showPreview?: boolean
  showActions?: boolean
  showMetrics?: boolean
  layout?: 'horizontal' | 'vertical'
}

interface ChatSummary {
  id: string
  title: string
  summary: string
  status: ChatStatus
  priority?: Priority
  lastMessage?: {
    text: string
    sender: string
    timestamp: Date
  }
  metrics?: {
    messages: number
    participants: number
    duration?: number
    tokens?: number
    cost?: number
  }
  tags?: Tag[]
  progress?: number
  thumbnail?: string
  related?: string[]
}

interface ChatStatus {
  type: 'active' | 'waiting' | 'completed' | 'archived' | 'error'
  message?: string
  since?: Date
}
```

## Design Tokens Usage

### Colors
- Card bg: `--color-panel-background`
- Hover bg: `--color-hover-background`
- Selected bg: `--color-selection-background`
- Status colors:
  - Active: `--color-success-text`
  - Waiting: `--color-warning-text`
  - Error: `--color-danger-text`
- Priority indicators:
  - High: `--color-danger-background`
  - Medium: `--color-warning-background`
  - Low: `--color-info-background`

### Spacing
- Card padding: `--spacing-card`
- Content gap: `--spacing-small10`
- Action buttons: `--spacing-small20`

### Typography
- Title: `--font-weight-medium`, `--font-size`
- Summary: `--font-size-small10`, `--color-body-textSoft10`
- Metrics: `--font-family-mono`, `--font-size-small20`

## Card Variants

### Minimal
- Title only
- Status indicator
- Single line
- Ultra-compact

### Compact
- Title and status
- Message count
- Last activity
- Small footprint

### Standard
- Title, summary preview
- Key metrics
- Status and priority
- Tags

### Detailed
- Full preview
- All metrics
- Actions toolbar
- Thumbnail/graph

## Visual Elements

### Status Indicators
- Colored dot/badge
- Icon representation
- Progress bar
- Activity sparkline

### Priority Badge
- Color-coded flag
- Position indicator
- Urgency level
- Due date

### Metrics Display
- Message count
- Response time
- Token usage
- Cost estimate

### Interactive Elements
- Hover actions
- Quick reply
- Archive button
- More menu

## Behaviors

### Hover State
- Subtle elevation
- Show actions
- Expand preview
- Highlight border

### Selection
- Checkbox appear
- Background change
- Border highlight
- Multi-select support

### Actions
- Pin/unpin
- Archive
- Delete
- Share
- Continue chat

### Preview
- Truncated summary
- Expand on hover
- Message preview
- Participant avatars

## Responsive Design

### Desktop
- Full card with all elements
- Hover interactions
- Side actions
- Rich previews

### Tablet
- Adaptive layout
- Touch-friendly actions
- Swipe gestures
- Responsive grid

### Mobile
- Stacked layout
- Essential info only
- Swipe actions
- Full-width cards

## Accessibility

### Keyboard Navigation
- Tab to card
- Enter to select
- Space for actions
- Arrow keys in grid

### Screen Reader Support
- Status announcements
- Metric descriptions
- Action labels
- Summary content

## Performance Considerations

### Optimization Strategies
- Lazy load previews
- Virtualize in lists
- Debounced hover
- Memoized rendering

### Bundle Size
- Minimal dependencies
- Tree-shakeable variants
- CSS-only animations

## Integration Examples

### Basic Usage
```jsx
<ChatSummaryCard
  chat={{
    id: '1',
    title: 'Project Planning',
    summary: 'Discussing Q4 roadmap...',
    status: { type: 'active' },
    metrics: { messages: 42 }
  }}
  onClick={() => openChat('1')}
/>
```

### Detailed Card
```jsx
<ChatSummaryCard
  chat={chatData}
  variant="detailed"
  showPreview={true}
  showActions={true}
  showMetrics={true}
  layout="horizontal"
  onAction={(action, id) => handleAction(action, id)}
/>
```

## Visual Examples

### Minimal Card
```
● Project Planning (42)
```

### Compact Card
```
┌─────────────────────────┐
│ ● Project Planning      │
│   42 messages • 2h ago  │
└─────────────────────────┘
```

### Standard Card
```
┌─────────────────────────────┐
│ ● Project Planning      ⚑⋮ │
│                             │
│ Discussing Q4 roadmap and   │
│ resource allocation...      │
│                             │
│ 42 msgs • 3 people • 2h    │
│ [Feature] [Planning]        │
└─────────────────────────────┘
```

### Detailed Card
```
┌───────────────────────────────────┐
│ ● Project Planning           ⚑📌⋮│
│ ▓▓▓▓▓▓▓▓░░ 80% complete         │
│                                   │
│ Summary: Discussing Q4 roadmap,  │
│ resource allocation, and key     │
│ deliverables for the upcoming... │
│                                   │
│ Last: "Let's prioritize the API" │
│ - John, 2 hours ago              │
│                                   │
│ 📊 42 msgs • 👥 3 • ⏱ 2.5h      │
│ 🪙 1.2k tokens • 💰 $0.03       │
│                                   │
│ [Continue] [Archive] [Share]     │
└───────────────────────────────────┘
```

### Horizontal Layout
```
┌──────────────────────────────────────────────┐
│ [■] ● Project Planning                       │
│     Discussing Q4 roadmap and resource...    │
│     42 msgs • 3 people • 2h ago     [⋮]     │
└──────────────────────────────────────────────┘
```

## Implementation Priority
**High** - Core component for chat management interfaces

## Dependencies
- Status indicators
- Tag component
- Progress bar
- Action menu

## Open Questions
1. Should cards auto-refresh metrics?
2. How to handle very long titles?
3. Should we show typing indicators?
4. Maximum preview length?