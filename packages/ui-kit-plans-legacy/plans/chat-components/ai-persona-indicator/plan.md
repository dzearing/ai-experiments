# AIPersonaIndicator Plan

## Overview

### Description
AIPersonaIndicator is a component that displays which AI persona or assistant is currently active in the conversation. It provides visual indication of the AI's identity, capabilities, and current state through avatars, names, and status indicators.

### Visual Design Mockups
- [Default State](./mockups/mock-ai-persona-indicator.html)

### Key Features
- AI persona identification with avatar and name
- Status indicators (online, processing, idle)
- Capability badges and specializations
- Model information display
- Context window and usage indicators
- Quick persona switching capabilities
- Accessibility announcements for persona changes

### Use Cases
- Showing which AI assistant is responding in multi-AI conversations
- Indicating AI specializations and capabilities
- Displaying current AI status and availability
- Providing quick access to persona switching

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| persona | `AIPersona` | ✓ | - | AI persona information object |
| **Optional Props** |
| showStatus | `boolean` | - | `true` | Whether to show status indicator |
| showCapabilities | `boolean` | - | `true` | Whether to show capability badges |
| showModel | `boolean` | - | `false` | Whether to show model information |
| showUsage | `boolean` | - | `false` | Whether to show usage indicators |
| size | `'small' \| 'medium' \| 'large'` | - | `'medium'` | Size of the indicator |
| variant | `'minimal' \| 'detailed' \| 'compact'` | - | `'detailed'` | Display style variant |
| interactive | `boolean` | - | `false` | Whether the indicator is clickable |
| className | `string` | - | - | Additional CSS classes |
| **Event Handlers** |
| onClick | `(persona: AIPersona) => void` | - | - | Handler for persona selection |
| onCapabilityClick | `(capability: string) => void` | - | - | Handler for capability badge clicks |
| **Render Props / Slots** |
| renderAvatar | `(persona: AIPersona) => ReactNode` | - | - | Custom avatar renderer |
| renderCapabilities | `(capabilities: string[]) => ReactNode` | - | - | Custom capabilities renderer |

### CSS Classes & Theming
*Implementation will follow guidelines in [component-implementation-guide.md](./component-implementation-guide.md)*

- Component-specific classes needed:
  - Variants: `.ai-persona-indicator--minimal`, `.ai-persona-indicator--detailed`, `.ai-persona-indicator--compact`
  - States: `.ai-persona-indicator--active`, `.ai-persona-indicator--processing`, `.ai-persona-indicator--idle`
  - Elements: `.ai-persona-indicator__avatar`, `.ai-persona-indicator__info`, `.ai-persona-indicator__capabilities`
- Special styling considerations:
  - Status indicator animations
  - Capability badge styling
  - Hover and focus states for interactive mode
  - Responsive layout adjustments

## Implementation Checklist

### Phase 1: Foundation
- [ ] Component structure and basic persona display
- [ ] CSS modules setup with design tokens
- [ ] Avatar and name display
- [ ] Basic unit tests and Storybook story

### Phase 2: Features
- [ ] Status indicators and animations
- [ ] Capability badges and display
- [ ] Interactive mode and event handlers
- [ ] Model and usage information display
- [ ] Complete test coverage

### Phase 3: Polish
- [ ] Performance optimizations
- [ ] All Storybook stories and variants
- [ ] Visual regression tests
- [ ] Accessibility enhancements

### Phase 4: Integration
- [ ] Use in chat components and conversations
- [ ] Real-world testing with persona switching
- [ ] Performance profiling
- [ ] Bundle size optimization

## Notes

### Implementation Notes
The component should clearly communicate the AI's identity and current state. Consider smooth transitions when switching between personas and provide clear visual feedback for different AI capabilities.

### Security Considerations
Validate persona information to prevent display of malicious content. Ensure proper sanitization of persona names and descriptions.