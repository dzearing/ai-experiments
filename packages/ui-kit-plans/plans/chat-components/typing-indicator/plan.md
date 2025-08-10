# TypingIndicator Plan

## Overview

### Description
TypingIndicator is a visual component that displays an animated indication when someone is typing in a chat conversation. It features customizable dot animations, timing patterns, and supports multiple typing states for different user types.

### Visual Design Mockups
- [Default State](./mockups/typing-indicator-default.html)

### Key Features
- Animated typing dots with customizable patterns
- Support for multiple typing users simultaneously
- Different visual styles for user types (user, assistant, system)
- Customizable animation timing and rhythm
- Avatar integration for multi-user contexts
- Fade in/out transitions
- Accessible announcements for screen readers

### Use Cases
- Showing when AI assistant is generating a response
- Indicating when other users are typing in group chats
- Providing visual feedback during processing states
- Creating anticipation during longer response times

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| isTyping | `boolean` | ✓ | - | Whether typing indicator should be shown |
| **Optional Props** |
| variant | `'user' \| 'assistant' \| 'system'` | - | `'assistant'` | Visual style variant |
| size | `'small' \| 'medium' \| 'large'` | - | `'medium'` | Size of the typing indicator |
| animationStyle | `'wave' \| 'pulse' \| 'bounce'` | - | `'wave'` | Animation pattern for dots |
| dotCount | `number` | - | `3` | Number of animated dots (1-5) |
| animationSpeed | `'slow' \| 'normal' \| 'fast'` | - | `'normal'` | Speed of the animation |
| showAvatar | `boolean` | - | `true` | Whether to show user avatar |
| avatarSrc | `string` | - | - | Source URL for avatar image |
| avatarText | `string` | - | - | Text content for avatar (initials) |
| label | `string` | - | - | Custom label text (e.g., "John is typing...") |
| className | `string` | - | - | Additional CSS classes |
| **Event Handlers** |
| onAnimationStart | `() => void` | - | - | Called when typing animation starts |
| onAnimationEnd | `() => void` | - | - | Called when typing animation ends |
| **Render Props / Slots** |
| renderAvatar | `() => ReactNode` | - | - | Custom avatar renderer |
| renderDots | `(dotCount: number) => ReactNode` | - | - | Custom dots renderer |

### CSS Classes & Theming
*Implementation will follow guidelines in [component-implementation-guide.md](./component-implementation-guide.md)*

- Component-specific classes needed:
  - Variants: `.typing-indicator--user`, `.typing-indicator--assistant`, `.typing-indicator--system`
  - States: `.typing-indicator--active`, `.typing-indicator--hidden`
  - Elements: `.typing-indicator__avatar`, `.typing-indicator__dots`, `.typing-indicator__label`
- Special styling considerations:
  - Smooth fade in/out transitions
  - Dot animation timing and stagger effects
  - Proper spacing and alignment with chat bubbles
  - Accessibility considerations for motion preferences

## Dependencies

### External Dependencies
- [ ] None

### Internal Dependencies
- [ ] Design tokens from `@claude-flow/ui-kit`
- [ ] Components: Avatar (if not using custom renderer)
- [ ] Hooks: useAnimation, useMediaQuery (for reduced motion)
- [ ] Utilities: classNames, debounce

## Dependent Components

### Direct Dependents
Components that will directly import and use this component:
- ChatContainer - Main chat display with typing states
- ChatMessageGroup - Grouping messages with typing indicator
- ConversationThread - Thread-specific typing indication

### Indirect Dependents
Components that may benefit from patterns established here:
- LoadingSpinner - Similar animation patterns
- ProcessingIndicator - Processing state feedback
- LiveStatusIndicator - Real-time status updates

## Internal Architecture

### Sub-components
Internal components that won't be exported but help organize the implementation:
- `TypingDots` - Manages the animated dot sequence
- `TypingAvatar` - Avatar display for typing user
- `TypingLabel` - Text label and accessibility content

### Hooks
Custom hooks this component needs:
- `useTypingAnimation` - Animation lifecycle and state management
- `useReducedMotion` - Respect user motion preferences
- `useVisibilityToggle` - Smooth show/hide transitions

### Utilities
Helper functions or utilities:
- `calculateAnimationDelay` - Stagger animation timing for multiple dots
- `getVariantStyles` - Dynamic styling based on variant
- `formatTypingLabel` - Generate accessible label text

## Performance Considerations

### Rendering Strategy
- [x] Frequent re-renders expected
- [ ] Large lists or data sets
- [x] Animation/transition heavy
- [ ] Async data loading

### Optimization Approaches
- **Memoization**: 
  - [x] Component memoization with `React.memo`
  - [x] Expensive calculations with `useMemo`
  - [x] Event handlers with `useCallback`
  - Animation state and dot rendering calculations

- **Animation Performance**:
  - [x] Use CSS animations over JavaScript
  - [x] Leverage transform and opacity for GPU acceleration
  - [x] Respect prefers-reduced-motion settings
  - [x] Minimize reflows during animation

- **Initial Render**:
  - [x] What renders immediately - Container structure
  - [x] What can be deferred - Animation starts after mount
  - [x] Loading states approach - Start hidden, fade in when active
  - [x] How to minimize layout shift - Reserve consistent space

### Bundle Size Impact
- Minimal size contribution (~1-2KB)
- Excellent tree shaking potential
- Animation logic can be conditionally loaded

## Accessibility

### ARIA Requirements
- [x] Role attributes needed - `status` for live typing updates
- [x] ARIA labels and descriptions - Clear typing state announcements
- [x] Live regions for dynamic content - Polite announcements when typing starts/stops
- [ ] Focus management requirements - Not focusable element

### Keyboard Navigation
- [ ] Tab order considerations - Not interactive, no keyboard navigation
- [ ] Custom keyboard shortcuts - None required
- [ ] Focus trap requirements - Not applicable
- [x] Escape key handling - Could hide indicator if parent handles

### Screen Reader Support
- [x] Announcement strategies - Announce when typing starts, not continuous updates
- [x] Hidden text for context - "[User] is typing a message"
- [x] State change notifications - Clear start/stop announcements
- [x] Motion considerations - Provide non-visual indication for screen readers

## Testing Strategy

### Unit Tests
- [x] **Props validation** - isTyping state, variant options, animation settings
- [x] **State management** - Show/hide transitions, animation lifecycle
- [x] **Event handling** - Animation start/end callbacks
- [x] **Edge cases** - Rapid show/hide toggles, multiple concurrent indicators
- [x] **Accessibility** - ARIA attributes, reduced motion support

### Integration Tests
- [x] **With parent components** - ChatContainer integration
- [x] **With chat flow** - Typing states in conversation
- [x] **Theme integration** - Variant styling consistency
- [x] **Animation performance** - Smooth transitions, no jank

### Visual Regression Tests
- [x] **All variants** - User, assistant, system styles
- [x] **States** - Active, hidden, transitioning
- [x] **Themes** - Light/dark mode visibility
- [x] **Animation patterns** - Wave, pulse, bounce effects

## Storybook Stories

### Essential Stories
- [x] **Default** - Basic typing indicator
- [x] **Playground** - All props available for experimentation
- [x] **Variants** - User, assistant, system styles
- [x] **Animation Styles** - Wave, pulse, bounce patterns

### Interaction Stories
- [x] **Toggle Typing** - Interactive show/hide controls
- [x] **Speed Controls** - Different animation speeds
- [x] **Multi-user** - Multiple typing indicators

### Edge Case Stories
- [x] **Rapid Toggle** - Quick show/hide scenarios
- [x] **Reduced Motion** - Accessibility preference handling
- [x] **Long Labels** - Text overflow handling
- [x] **Without Avatar** - Text-only indicator

### Composition Stories
- [x] **With ChatBubble** - Realistic chat context
- [x] **In ConversationList** - Multiple conversations

## Similar Components in Open Source

### Prior Art Research
- **Discord Typing Indicator** - https://discord.com
  - What works well: Smooth dot animations, clear visual hierarchy
  - What to avoid: Overly prominent visual weight
  - Patterns to adopt: Staggered dot timing, fade transitions
- **Slack Typing Indicator** - https://slack.com
  - What works well: Multiple user support, subtle animation
  - What to avoid: Performance issues with many indicators
  - Patterns to adopt: User avatar integration, compact design
- **WhatsApp Typing Indicator** - https://web.whatsapp.com
  - What works well: Simple and effective animation
  - What to avoid: Limited customization options
  - Patterns to adopt: Minimal resource usage, clear timing

### API Comparison
| Library | Prop Name | Our Equivalent | Notes |
|---------|-----------|----------------|-------|
| React Chat UI | isTyping | isTyping | Direct equivalent |
| Chat Elements | showTyping | isTyping | Same concept |
| Stream Chat | typing | isTyping | Consistent naming |

## Relationship to Other Components

### Potential Overlaps
- **LoadingSpinner** - Both show progress states - different contexts
- **Skeleton** - Both indicate loading - typing is more specific

### Composition Opportunities
- Can be composed with ChatBubble for typing states
- Often used alongside MessageInput for user typing
- Works with UserList to show multiple typing users

### Shared Patterns
- Shares animation timing with other feedback components
- Could benefit from extracting dot animation utilities
- Avatar patterns shared with UserProfile components

## Implementation Checklist

### Phase 1: Foundation
- [ ] Component structure and basic typing state
- [ ] CSS modules setup with design tokens
- [ ] Core animation implementation
- [ ] Basic unit tests and Storybook story

### Phase 2: Features
- [ ] Multiple animation patterns (wave, pulse, bounce)
- [ ] Avatar integration and customization
- [ ] Variant styling (user, assistant, system)
- [ ] Event handlers and lifecycle callbacks
- [ ] Complete test coverage

### Phase 3: Polish
- [ ] Performance optimizations (CSS animations)
- [ ] Accessibility enhancements (reduced motion)
- [ ] All Storybook stories and edge cases
- [ ] Visual regression tests
- [ ] Multi-user support

### Phase 4: Integration
- [ ] Use in ChatContainer and dependent components
- [ ] Real-world testing in chat scenarios
- [ ] Performance profiling with multiple indicators
- [ ] Bundle size optimization

## Open Questions

### Design Decisions
- [ ] Should we support custom dot shapes or colors?
- [ ] How many simultaneous typing indicators should we support?
- [ ] Should we provide built-in throttling for rapid state changes?

### Technical Considerations
- [ ] How do we optimize for many concurrent typing indicators?
- [ ] Should we use CSS animations or JavaScript for better control?
- [ ] How do we handle typing indicators in virtualized lists?

### Future Enhancements
- [ ] Support for custom typing patterns or rhythms
- [ ] Integration with real-time typing detection
- [ ] Support for typing progress indication (partial messages)

## Notes

### Implementation Notes
The component should be lightweight and performant, as it may be used frequently in active chat contexts. Consider using CSS animations for better performance and battery life on mobile devices.

### Migration Notes
If replacing existing typing indicators, ensure animation timing feels natural and doesn't create jarring transitions for users accustomed to the previous behavior.

### Security Considerations
When displaying user information in typing indicators, ensure proper sanitization of display names and avatar sources to prevent XSS attacks.