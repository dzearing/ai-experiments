# ChatMessageGroup Plan

## Overview

### Description
ChatMessageGroup is a container component that groups consecutive messages from the same sender to create a more visually cohesive chat experience. It manages the shared avatar, sender name, timestamp, and provides consistent spacing between grouped messages.

### Visual Design Mockups
- [Default State](./mockups/chat-message-group-default.html)

### Key Features
- Groups consecutive messages from the same sender
- Shows avatar and sender name only once for the group
- Handles spacing between individual messages within the group
- Supports timestamps on the first or last message
- Manages hover states and actions at the group level
- Provides accessible structure for screen readers

### Use Cases
- Displaying multiple messages from the same user sent in quick succession
- Reducing visual clutter in active conversations
- Creating readable conversation threads
- Managing shared metadata like sender info and timestamps

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| messages | `ChatMessage[]` | ✓ | - | Array of messages from the same sender |
| sender | `ChatSender` | ✓ | - | Information about the message sender |
| **Optional Props** |
| showAvatar | `boolean` | - | `true` | Whether to display the sender's avatar |
| showSenderName | `boolean` | - | `true` | Whether to display the sender's name |
| showTimestamp | `'first' \| 'last' \| 'none'` | - | `'last'` | When to show timestamp in the group |
| maxGroupSize | `number` | - | `10` | Maximum number of messages to group together |
| timeGapThreshold | `number` | - | `300000` | Max time gap in ms to consider messages consecutive |
| className | `string` | - | - | Additional CSS classes |
| **Event Handlers** |
| onMessageAction | `(messageId: string, action: string) => void` | - | - | Handler for message-level actions |
| onGroupAction | `(groupId: string, action: string) => void` | - | - | Handler for group-level actions |
| **Render Props / Slots** |
| renderMessage | `(message: ChatMessage, index: number) => ReactNode` | - | - | Custom message renderer |
| renderAvatar | `(sender: ChatSender) => ReactNode` | - | - | Custom avatar renderer |

### CSS Classes & Theming
*Implementation will follow guidelines in [component-implementation-guide.md](./component-implementation-guide.md)*

- Component-specific classes needed:
  - Variants: `.chat-message-group--user`, `.chat-message-group--assistant`, `.chat-message-group--system`
  - States: `.chat-message-group--hovered`, `.chat-message-group--selected`
  - Elements: `.chat-message-group__header`, `.chat-message-group__avatar`, `.chat-message-group__messages`
- Special styling considerations:
  - Smooth transitions when messages are added/removed from group
  - Proper spacing between grouped messages vs separate groups
  - Responsive avatar sizing and positioning

## Dependencies

### External Dependencies
- [ ] None

### Internal Dependencies
- [ ] Design tokens from `@claude-flow/ui-kit`
- [ ] Components: ChatBubble, Avatar (if not using custom renderer)
- [ ] Hooks: useGroupedMessages (custom hook for message grouping logic)
- [ ] Utilities: formatTimestamp, generateGroupId

## Dependent Components

### Direct Dependents
Components that will directly import and use this component:
- ChatContainer - Main chat display component
- ConversationThread - Thread-specific message display
- ChatHistory - Historical conversation display

### Indirect Dependents
Components that may benefit from patterns established here:
- NotificationGroup - Could use similar grouping patterns
- ActivityFeed - Timeline-style message grouping

## Internal Architecture

### Sub-components
Internal components that won't be exported but help organize the implementation:
- `MessageGroupHeader` - Handles avatar, name, and timestamp display
- `MessageGroupBody` - Container for the grouped messages
- `GroupActions` - Shared actions that apply to the entire group

### Hooks
Custom hooks this component needs:
- `useGroupedMessages` - Manages message grouping logic and consecutive detection
- `useGroupActions` - Handles group-level action states and behaviors

### Utilities
Helper functions or utilities:
- `shouldGroupMessages` - Determines if messages should be grouped together
- `calculateGroupSpacing` - Computes spacing between groups vs within groups

## Performance Considerations

### Rendering Strategy
- [x] Frequent re-renders expected
- [ ] Large lists or data sets
- [ ] Animation/transition heavy
- [ ] Async data loading

### Optimization Approaches
- **Memoization**: 
  - [x] Component memoization with `React.memo`
  - [x] Expensive calculations with `useMemo`
  - [x] Event handlers with `useCallback`
  - Message grouping calculations and group metadata

- **Initial Render**:
  - [x] What renders immediately - Group header and first message
  - [x] What can be deferred - Subsequent messages can be progressively rendered
  - [x] Loading states approach - Show group structure immediately
  - [x] How to minimize layout shift - Reserve space for known message count

### Bundle Size Impact
- Minimal size contribution (~3-5KB)
- Good tree shaking opportunities with conditional rendering
- Message grouping logic could be lazy loaded for complex scenarios

## Accessibility

### ARIA Requirements
- [x] Role attributes needed - `group` for the message group, `list` for messages
- [x] ARIA labels and descriptions - `aria-label` describing message group
- [x] Live regions for dynamic content - Announce new messages added to group
- [x] Focus management requirements - Focus should move logically through messages

### Keyboard Navigation
- [x] Tab order considerations - Should tab through individual messages, not group
- [ ] Custom keyboard shortcuts - None required
- [ ] Focus trap requirements - Not applicable
- [x] Escape key handling - Should bubble up to parent chat container

### Screen Reader Support
- [x] Announcement strategies - Announce sender once, then message content
- [x] Hidden text for context - "Message from [sender] at [time]" for first message
- [x] State change notifications - Announce when messages are added to group

## Testing Strategy

### Unit Tests
- [x] **Props validation** - Ensure message grouping works with various props
- [x] **State management** - Test message addition/removal from groups
- [x] **Event handling** - Verify group and message-level events work correctly
- [x] **Edge cases** - Empty messages, single message, mixed senders
- [x] **Accessibility** - ARIA attributes, keyboard navigation

### Integration Tests
- [x] **With parent components** - ChatContainer integration
- [x] **With child components** - ChatBubble composition
- [x] **Theme integration** - Correct token usage
- [x] **Responsive behavior** - Group layout at different screen sizes

### Visual Regression Tests
- [x] **All variants** - User, assistant, system message groups
- [x] **States** - Hover, selection, loading states
- [x] **Themes** - Light/dark mode variations
- [x] **Breakpoints** - Mobile, tablet, desktop layouts

## Storybook Stories

### Essential Stories
- [x] **Default** - Basic message group with multiple messages
- [x] **Playground** - All props available for experimentation
- [x] **User Messages** - Group of user messages
- [x] **Assistant Messages** - Group of AI responses

### Interaction Stories
- [x] **Interactive** - Hover states, message actions
- [x] **Dynamic** - Adding/removing messages from group
- [x] **Time-based** - Messages with different time gaps

### Edge Case Stories
- [x] **Single Message** - Group with only one message
- [x] **Large Group** - Maximum group size reached
- [x] **Mixed Content** - Messages with text, code, attachments
- [x] **Custom Renderers** - Using custom message and avatar renderers

### Composition Stories
- [x] **With ChatContainer** - Full chat context
- [x] **In ConversationThread** - Thread-specific usage

## Similar Components in Open Source

### Prior Art Research
- **Discord MessageGroup** - https://discord.com
  - What works well: Clean visual grouping, hover states, timestamp management
  - What to avoid: Overly complex nested structure
  - Patterns to adopt: Progressive disclosure of metadata
- **Slack MessageGroup** - https://slack.com
  - What works well: Consistent spacing, thread indicators
  - What to avoid: Too much metadata shown by default
  - Patterns to adopt: Smart timestamp showing based on time gaps
- **WhatsApp MessageBubbleGroup** - https://web.whatsapp.com
  - What works well: Minimal visual noise, clear sender indication
  - What to avoid: Limited accessibility features
  - Patterns to adopt: Tail indicators on first/last messages

### API Comparison
| Library | Prop Name | Our Equivalent | Notes |
|---------|-----------|----------------|-------|
| Ant Design | messages | messages | Direct equivalent |
| Chakra UI | showAvatar | showAvatar | Same naming |
| MUI | groupBy | timeGapThreshold | Different approach - we use time-based |

## Relationship to Other Components

### Potential Overlaps
- **ChatBubble** - Individual message display - complementary, not overlapping
- **ConversationThread** - Thread container - uses MessageGroup internally

### Composition Opportunities
- Can be composed with ChatBubble to create complete message displays
- Often used alongside TypingIndicator for active conversations
- Works with ConversationList for navigation between message groups

### Shared Patterns
- Shares avatar rendering patterns with UserProfile, ContactCard
- Could benefit from extracting timestamp formatting utilities
- Message action patterns shared with NotificationGroup

## Implementation Checklist

### Phase 1: Foundation
- [ ] Component structure and basic props
- [ ] CSS modules setup with design tokens
- [ ] Basic unit tests
- [ ] Default Storybook story

### Phase 2: Features
- [ ] Message grouping logic implementation
- [ ] Event handlers and action management
- [ ] Accessibility features
- [ ] Complete test coverage

### Phase 3: Polish
- [ ] Performance optimizations (memoization)
- [ ] All Storybook stories
- [ ] Animation and transition polish
- [ ] Visual regression tests

### Phase 4: Integration
- [ ] Use in ChatContainer and dependent components
- [ ] Real-world testing with various message patterns
- [ ] Performance profiling with large message groups
- [ ] Bundle size optimization

## Open Questions

### Design Decisions
- [ ] Should we limit the maximum number of messages that can be grouped?
- [ ] How should we handle mixed message types (text + attachments) in a group?
- [ ] Should group actions (like "delete all") be supported?

### Technical Considerations
- [ ] Should we use virtualization for very large message groups?
- [ ] How do we handle real-time message updates within groups?
- [ ] Should we preload avatar images for better performance?

### Future Enhancements
- [ ] Support for message threading within groups
- [ ] Integration with message search and highlighting
- [ ] Support for message reactions at the group level

## Notes

### Implementation Notes
The component should be designed to work seamlessly with real-time message updates. When new messages arrive, they should smoothly integrate into existing groups or create new groups based on the grouping criteria.

### Migration Notes
If replacing an existing message display system, ensure that the new grouped approach maintains the same accessibility standards and doesn't break existing keyboard navigation patterns.

### Security Considerations
When rendering user-generated message content, ensure proper sanitization to prevent XSS attacks. Avatar images should be properly validated and potentially served through a CDN or image proxy.