# SmartPromptInput Component Plan

## Overview

### Description
A sophisticated multi-line text input component designed for AI chat interfaces, featuring auto-resize, mentions, file attachments, prompt history, and keyboard shortcuts. It provides a rich editing experience optimized for conversational AI interactions.

### Visual Design Mockups
- [Default State](./mockups/smart-prompt-input-default.html)
- [Active with Suggestions](./mockups/smart-prompt-input-active.html)
- [With Attachments](./mockups/smart-prompt-input-attachments.html)
- [Mobile Responsive](./mockups/smart-prompt-input-mobile.html)

### Key Features
- Auto-expanding textarea with max height constraints
- @mention support with autocomplete
- File attachment handling with preview
- Prompt history navigation (up/down arrows)
- Character/token counter
- Submit on Enter (Shift+Enter for newline)
- Voice input support
- Paste handling for images and rich text
- Persistent draft saving

### Use Cases
- Primary message input for AI chat interfaces
- Command palette with slash commands
- Multi-modal input supporting text, files, and images
- Code snippet input with syntax awareness
- Long-form prompt composition

## API Design

### Props Interface

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **Required Props** |
| onSubmit | `(value: string, attachments?: File[]) => void` | ✓ | - | Handler called when submitting the prompt |
| **Optional Props** |
| value | `string` | - | `''` | Controlled value of the input |
| onChange | `(value: string) => void` | - | - | Handler for value changes |
| placeholder | `string` | - | `'Type a message...'` | Placeholder text |
| disabled | `boolean` | - | `false` | Whether the input is disabled |
| maxLength | `number` | - | `10000` | Maximum character length |
| minRows | `number` | - | `1` | Minimum number of visible rows |
| maxRows | `number` | - | `10` | Maximum number of visible rows before scrolling |
| autoFocus | `boolean` | - | `false` | Auto-focus on mount |
| submitOnEnter | `boolean` | - | `true` | Submit on Enter key (Shift+Enter for newline) |
| **History & Suggestions** |
| enableHistory | `boolean` | - | `true` | Enable prompt history navigation |
| historyItems | `string[]` | - | `[]` | History of previous prompts |
| enableMentions | `boolean` | - | `false` | Enable @mention autocomplete |
| mentionSuggestions | `MentionSuggestion[]` | - | `[]` | Available mention suggestions |
| enableCommands | `boolean` | - | `false` | Enable slash commands |
| commands | `Command[]` | - | `[]` | Available slash commands |
| **Attachments** |
| enableAttachments | `boolean` | - | `true` | Allow file attachments |
| acceptedFileTypes | `string[]` | - | `['image/*', 'text/*', '.pdf']` | Accepted MIME types |
| maxFileSize | `number` | - | `10485760` | Max file size in bytes (10MB) |
| maxFiles | `number` | - | `10` | Maximum number of attachments |
| attachments | `File[]` | - | `[]` | Current attachments (controlled) |
| onAttachmentsChange | `(files: File[]) => void` | - | - | Handler for attachment changes |
| **Voice Input** |
| enableVoiceInput | `boolean` | - | `false` | Show voice input button |
| onVoiceInput | `() => void` | - | - | Handler for voice input activation |
| isRecording | `boolean` | - | `false` | Voice recording state |
| **UI Customization** |
| showCharacterCount | `boolean` | - | `true` | Show character/token counter |
| showToolbar | `boolean` | - | `true` | Show toolbar with actions |
| toolbarPosition | `'top' \| 'bottom'` | - | `'bottom'` | Toolbar position |
| variant | `'default' \| 'compact' \| 'minimal'` | - | `'default'` | Visual variant |
| **Event Handlers** |
| onFocus | `(event: FocusEvent) => void` | - | - | Focus event handler |
| onBlur | `(event: FocusEvent) => void` | - | - | Blur event handler |
| onKeyDown | `(event: KeyboardEvent) => void` | - | - | Keydown event handler |
| onPaste | `(event: ClipboardEvent) => void` | - | - | Paste event handler |
| **Render Props** |
| renderToolbarActions | `() => ReactNode` | - | - | Custom toolbar actions |
| renderAttachment | `(file: File, index: number) => ReactNode` | - | - | Custom attachment renderer |

### CSS Classes & Theming

Component-specific classes needed:
- Variants: `.default`, `.compact`, `.minimal`
- States: `.focused`, `.disabled`, `.hasAttachments`, `.expanded`
- Elements: `.textarea`, `.toolbar`, `.attachments`, `.counter`, `.suggestions`

Special styling considerations:
- Smooth height transitions during auto-resize
- Dropdown positioning for suggestions
- Mobile-responsive toolbar layout
- Focus ring management across sub-elements

## Dependencies

### External Dependencies
- [ ] None required (pure React implementation)

### Internal Dependencies
- [x] Design tokens from `@claude-flow/ui-kit`
- [x] Components: `IconButton`, `Dropdown`, `Badge`, `Tooltip`
- [x] Hooks: `useKeyboardShortcuts`, `useAutosize`, `useClickOutside`
- [x] Utilities: `clsx`, `debounce`, `formatFileSize`

## Dependent Components

### Direct Dependents
- `ChatInterface` - Main chat UI using this as primary input
- `CommandPalette` - Extended version for command execution
- `FeedbackDialog` - Uses for feedback message input

### Indirect Dependents
- `ConversationView` - Contains the chat interface
- `WorkspaceChat` - Workspace-level chat implementation

## Internal Architecture

### Sub-components
- `TextArea` - Core textarea with auto-resize logic
- `Toolbar` - Action buttons and controls
- `AttachmentList` - File attachment preview and management
- `SuggestionDropdown` - Mention/command suggestions
- `CharacterCounter` - Character/token count display

### Hooks
- `useAutosize` - Manages textarea auto-resize behavior
- `usePromptHistory` - Handles history navigation
- `useMentions` - Manages mention detection and suggestions
- `useAttachments` - File attachment state and validation
- `useDraftPersistence` - Auto-saves draft to localStorage

### Utilities
- `parsePromptForMentions` - Extracts @mentions from text
- `parsePromptForCommands` - Extracts slash commands
- `validateFile` - Validates file size and type
- `formatCharacterCount` - Formats count display

## Performance Considerations

### Rendering Strategy
- [x] Frequent re-renders expected (on every keystroke)
- [x] Animation/transition heavy (auto-resize, suggestions)
- [x] Async data loading (file uploads, suggestions)

### Optimization Approaches
- **Memoization**: 
  - [x] Expensive calculations with `useMemo` (mention parsing)
  - [x] Event handlers with `useCallback`
  - [x] Suggestion filtering debounced

- **Lazy Loading**:
  - [x] Voice input module lazy loaded
  - [x] File upload utilities loaded on demand

- **Initial Render**:
  - Textarea renders immediately
  - Toolbar lazy renders on first interaction
  - Suggestions load async as needed

### Bundle Size Impact
- Core: ~15KB
- With voice: +10KB (lazy)
- With file handling: +8KB

## Accessibility

### ARIA Requirements
- [x] Role: `textbox` with `aria-multiline="true"`
- [x] `aria-label` for textarea
- [x] `aria-describedby` for character count
- [x] `aria-expanded` for suggestion dropdown
- [x] Live region for submission status

### Keyboard Navigation
- Enter: Submit (configurable)
- Shift+Enter: New line
- Up/Down: Navigate history or suggestions
- Tab: Accept suggestion
- Escape: Close suggestions
- Cmd/Ctrl+Enter: Force submit

### Screen Reader Support
- Announce character limit warnings
- Announce file attachment status
- Read suggestion count when opened
- Announce successful submission

## Testing Strategy

### Unit Tests
- [x] Auto-resize behavior with various content
- [x] History navigation cycles correctly
- [x] Mention detection and parsing
- [x] File validation and size limits
- [x] Keyboard shortcut handling
- [x] Character counting accuracy

### Integration Tests
- [x] With parent form submission
- [x] Suggestion dropdown interaction
- [x] File drag-and-drop
- [x] Paste handling (text, images)

### Visual Regression Tests
- [x] All variants and sizes
- [x] With/without attachments
- [x] Expanded vs collapsed states
- [x] Mobile responsive behavior

## Storybook Stories

### Essential Stories
- [x] **Default** - Basic prompt input
- [x] **Playground** - All features enabled
- [x] **WithHistory** - History navigation demo
- [x] **WithMentions** - Mention autocomplete

### Interaction Stories
- [x] **FileUpload** - Attachment handling
- [x] **VoiceInput** - Voice recording flow
- [x] **CommandPalette** - Slash commands

### Edge Case Stories
- [x] **CharacterLimit** - Near/at limit behavior
- [x] **LongText** - Max rows and scrolling
- [x] **ManyAttachments** - Multiple files

## Similar Components in Open Source

### Prior Art Research
- **Slack Input** - Multi-line with mentions, good mobile UX
- **Discord Input** - Excellent file handling and markdown preview
- **ChatGPT Input** - Clean auto-resize, good keyboard shortcuts
- **Linear Command** - Great command palette integration

### API Comparison
| Library | Prop Name | Our Equivalent | Notes |
|---------|-----------|----------------|-------|
| Slack   | `onSubmit` | `onSubmit` | Similar signature |
| Discord | `allowUploads` | `enableAttachments` | We're more granular |
| MUI | `multiline` | (always true) | We're specialized |

## Implementation Checklist

### Phase 1: Foundation
- [ ] Basic textarea with auto-resize
- [ ] Submit handling
- [ ] Character counter
- [ ] Basic styling with tokens

### Phase 2: Features
- [ ] History navigation
- [ ] Mention detection
- [ ] File attachments
- [ ] Keyboard shortcuts

### Phase 3: Polish
- [ ] Suggestion dropdowns
- [ ] Voice input
- [ ] Draft persistence
- [ ] Mobile optimization

### Phase 4: Integration
- [ ] Use in ChatInterface
- [ ] Performance profiling
- [ ] Accessibility audit
- [ ] User testing

## Open Questions

### Design Decisions
- [ ] Should history be persisted across sessions?
- [ ] How to handle very large file attachments?
- [ ] Should we support markdown preview?

### Technical Considerations
- [ ] Use native File API or abstract it?
- [ ] How to handle concurrent file uploads?
- [ ] WebWorker for large text processing?

### Future Enhancements
- [ ] Rich text editing mode
- [ ] Inline code syntax highlighting
- [ ] Drawing/sketch input
- [ ] Template/snippet support