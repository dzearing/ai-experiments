# Sub-Agent Task: Chat & AI Components Specialist

## Objective
Expand and detail the specifications for Chat & AI components, creating comprehensive implementation plans with HTML mockups, full API specifications, and architectural guidance.

## Assigned Components (13 High Priority)
1. SmartPromptInput
2. ChatBubble
3. ChatMessageGroup
4. StreamingText
5. TypingIndicator
6. FileAttachment
7. ImagePasteHandler
8. TextPasteHandler
9. MentionAutocomplete
10. PromptHistory
11. ConversationList
12. ChatErrorBoundary
13. AIPersonaIndicator

## Required Deliverables for Each Component

### 1. Complete API Specification
- Full TypeScript interface with all props
- Clear prop descriptions and types
- Default values for optional props
- Event handler signatures
- Ref forwarding requirements

### 2. HTML Mockups (1-3 per component)
- Default state mockup
- Interactive/active state mockup
- Error/edge case mockup
- Include inline CSS for clarity
- Show responsive behavior

### 3. Component Architecture
- List all sub-components needed
- Define internal state management
- Specify hooks required
- Performance considerations
- Accessibility requirements

### 4. CSS Module Structure
```css
/* Example structure */
.root { }
.root--variant { }
.element { }
.element--modifier { }
```

### 5. Usage Examples
- Basic usage
- Advanced usage with all features
- Integration with other components
- Common patterns

### 6. Implementation Notes
- Browser compatibility concerns
- Performance optimization strategies
- Testing considerations
- Migration path from existing solutions

## Example Template for SmartPromptInput

```typescript
interface SmartPromptInputProps extends TextAreaProps {
  // History management
  enableHistory?: boolean;
  historyLimit?: number;
  historyStorage?: 'memory' | 'localStorage' | 'sessionStorage';
  onHistoryChange?: (history: string[]) => void;
  
  // Autocomplete features
  enableMentions?: boolean;
  enableHashtags?: boolean;
  mentionTrigger?: string; // default '@'
  hashtagTrigger?: string; // default '#'
  mentionDataSource?: MentionDataSource;
  hashtagDataSource?: HashtagDataSource;
  
  // ... complete specification
}
```

### HTML Mockup Example
```html
<!-- SmartPromptInput - Default State -->
<div class="smart-prompt-input">
  <div class="smart-prompt-input__toolbar">
    <button class="toolbar-button" aria-label="Voice input">
      <svg><!-- mic icon --></svg>
    </button>
    <button class="toolbar-button" aria-label="Attach file">
      <svg><!-- paperclip icon --></svg>
    </button>
  </div>
  
  <div class="smart-prompt-input__wrapper">
    <textarea 
      class="smart-prompt-input__textarea"
      placeholder="Type your message..."
      rows="1"
      aria-label="Message input"
      aria-describedby="char-count"
    ></textarea>
    
    <!-- Autocomplete dropdown (hidden by default) -->
    <div class="autocomplete-dropdown" role="listbox" hidden>
      <div class="autocomplete-item" role="option">
        <img src="avatar.png" alt="" class="avatar" />
        <span class="name">@john_doe</span>
        <span class="subtitle">John Doe</span>
      </div>
    </div>
  </div>
  
  <div class="smart-prompt-input__footer">
    <span id="char-count" class="char-count">0 / 4000</span>
    <button class="send-button" aria-label="Send message">
      <svg><!-- send icon --></svg>
    </button>
  </div>
</div>

<style>
.smart-prompt-input {
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  background: var(--color-surface-primary);
  transition: border-color 0.2s ease;
}

.smart-prompt-input:focus-within {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}

/* ... additional styles ... */
</style>
```

## Success Criteria
1. All 13 components have complete specifications
2. Each component has 1-3 HTML mockups showing different states
3. TypeScript interfaces are comprehensive and consistent
4. CSS module patterns are established
5. Accessibility is built-in, not added later
6. Performance considerations are documented
7. Clear dependencies and integration points defined

## Additional Considerations
- Ensure all components support both light and dark themes
- Consider mobile/touch interactions
- Define keyboard shortcuts and navigation
- Include ARIA labels and roles
- Consider internationalization needs
- Define error boundaries and fallbacks
- Specify loading and error states

## Priority Order
1. SmartPromptInput (most complex, sets patterns)
2. ChatBubble (core display component)
3. MentionAutocomplete (reusable pattern)
4. StreamingText (unique AI feature)
5. ChatMessageGroup (layout pattern)
6. Others in order of dependencies