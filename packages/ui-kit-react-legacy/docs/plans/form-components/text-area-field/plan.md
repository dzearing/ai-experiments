# TextAreaField

## Component Name and Description
TextAreaField is an input primitive that provides a multi-line text input component with auto-resize capabilities, validation, and accessibility features.

## Use Cases
- Multi-line text input
- Comments and feedback forms
- Message composition
- Code input areas
- Long-form content entry
- Note-taking interfaces

## API/Props Interface

```typescript
interface TextAreaFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** TextArea variant */
  variant?: 'default' | 'filled' | 'outlined' | 'minimal';
  
  /** TextArea size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Input state */
  state?: 'default' | 'error' | 'success' | 'warning';
  
  /** Label text */
  label?: string;
  
  /** Hide label visually but keep for screen readers */
  hideLabel?: boolean;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Help text or description */
  description?: string;
  
  /** Error message */
  errorMessage?: string;
  
  /** Success message */
  successMessage?: string;
  
  /** Warning message */
  warningMessage?: string;
  
  /** Required field indicator */
  required?: boolean;
  
  /** Optional field indicator */
  optional?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Read-only state */
  readOnly?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Auto-resize behavior */
  autoResize?: boolean | 'vertical' | 'horizontal';
  
  /** Minimum number of rows */
  minRows?: number;
  
  /** Maximum number of rows */
  maxRows?: number;
  
  /** Fixed number of rows */
  rows?: number;
  
  /** Minimum height */
  minHeight?: string | number;
  
  /** Maximum height */
  maxHeight?: string | number;
  
  /** Character limit */
  maxLength?: number;
  
  /** Show character count */
  showCharacterCount?: boolean;
  
  /** Show line count */
  showLineCount?: boolean;
  
  /** Resize handle */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  
  /** Custom validation function */
  validate?: (value: string) => string | null;
  
  /** Debounce validation */
  validateDebounce?: number;
  
  /** Event handlers */
  onValueChange?: (value: string) => void;
  onResize?: (dimensions: { width: number; height: number }) => void;
  onValidation?: (isValid: boolean, message?: string) => void;
  
  /** Spell check */
  spellCheck?: boolean;
  
  /** Text wrapping */
  wrap?: 'soft' | 'hard' | 'off';
}
```

## Sub-components

### TextAreaField.Label
The label component with required/optional indicators.

### TextAreaField.TextArea
The actual textarea element with auto-resize capabilities.

### TextAreaField.Message
Help text, error messages, or other feedback.

### TextAreaField.Counter
Character and line count display.

## Usage Examples

### Basic TextArea Field
```html
<div class="textarea-field" data-variant="outlined" data-size="md">
  <label class="textarea-field-label" for="message">
    Message
    <span class="required-indicator">*</span>
  </label>
  <textarea class="textarea-field-input" 
            id="message" 
            name="message"
            rows="4"
            placeholder="Enter your message..."
            required></textarea>
</div>
```

### Auto-Resizing TextArea
```html
<div class="textarea-field" data-variant="outlined" data-auto-resize="true">
  <label class="textarea-field-label" for="notes">
    Notes
  </label>
  <textarea class="textarea-field-input" 
            id="notes" 
            name="notes"
            data-min-rows="3"
            data-max-rows="10"
            placeholder="Add your notes here..."
            style="resize: none;"></textarea>
  <div class="textarea-field-message">
    This field will automatically expand as you type
  </div>
</div>
```

### TextArea with Character Count
```html
<div class="textarea-field" data-variant="outlined">
  <label class="textarea-field-label" for="feedback">
    Feedback
  </label>
  <textarea class="textarea-field-input" 
            id="feedback" 
            name="feedback"
            maxlength="500"
            rows="5"
            placeholder="Share your feedback with us..."></textarea>
  <div class="textarea-field-footer">
    <div class="textarea-field-message">
      Help us improve by sharing your thoughts
    </div>
    <div class="textarea-field-counter">
      <span class="current-count">0</span>/<span class="max-count">500</span>
    </div>
  </div>
</div>
```

### Error State with Validation
```html
<div class="textarea-field" data-variant="outlined" data-state="error">
  <label class="textarea-field-label" for="description">
    Description
    <span class="required-indicator">*</span>
  </label>
  <textarea class="textarea-field-input" 
            id="description" 
            name="description"
            rows="4"
            aria-invalid="true"
            aria-describedby="description-error"></textarea>
  <div class="textarea-field-message" 
       data-type="error" 
       id="description-error">
    Description must be at least 10 characters long
  </div>
</div>
```

### Code Input TextArea
```html
<div class="textarea-field" data-variant="filled" data-size="lg">
  <label class="textarea-field-label" for="code">
    Code Snippet
    <span class="optional-indicator">(optional)</span>
  </label>
  <textarea class="textarea-field-input code-input" 
            id="code" 
            name="code"
            rows="8"
            spellcheck="false"
            autocomplete="off"
            wrap="off"
            placeholder="// Enter your code here..."
            style="font-family: 'Monaco', 'Menlo', monospace;"></textarea>
  <div class="textarea-field-footer">
    <div class="textarea-field-message">
      Paste or type your code snippet
    </div>
    <div class="textarea-field-counters">
      <span class="line-count">Lines: 1</span>
      <span class="char-count">Chars: 0</span>
    </div>
  </div>
</div>
```

### Disabled and Read-Only States
```html
<div class="form-fields">
  <!-- Disabled state -->
  <div class="textarea-field" data-variant="outlined" data-state="disabled">
    <label class="textarea-field-label" for="disabled-textarea">
      Disabled TextArea
    </label>
    <textarea class="textarea-field-input" 
              id="disabled-textarea" 
              name="disabled-textarea"
              rows="3"
              disabled>This content cannot be edited</textarea>
  </div>
  
  <!-- Read-only state -->
  <div class="textarea-field" data-variant="outlined" data-state="readonly">
    <label class="textarea-field-label" for="readonly-textarea">
      Read-Only TextArea
    </label>
    <textarea class="textarea-field-input" 
              id="readonly-textarea" 
              name="readonly-textarea"
              rows="3"
              readonly>This content can be selected but not edited</textarea>
  </div>
</div>
```

### Message Composition Interface
```html
<div class="message-composer">
  <div class="textarea-field" data-variant="minimal" data-auto-resize="true">
    <label class="textarea-field-label sr-only" for="compose">
      Compose message
    </label>
    <textarea class="textarea-field-input" 
              id="compose" 
              name="compose"
              data-min-rows="1"
              data-max-rows="8"
              placeholder="Type a message..."
              style="resize: none;"></textarea>
    <div class="textarea-field-actions">
      <button type="button" class="format-button" aria-label="Bold">B</button>
      <button type="button" class="format-button" aria-label="Italic">I</button>
      <button type="button" class="attach-button" aria-label="Attach file">📎</button>
      <button type="submit" class="send-button">Send</button>
    </div>
  </div>
</div>
```

## Accessibility Notes
- Always associate labels with textareas using `for` attribute
- Use `aria-describedby` to link help text and error messages
- Provide clear, descriptive labels that explain the field purpose
- Ensure error states are announced to screen readers with `aria-invalid`
- Use `aria-expanded` for auto-resizing textareas to indicate state changes
- Support keyboard navigation including Ctrl+A for select all
- Test with screen readers for proper announcement of content changes
- Consider `aria-live` regions for character count announcements

## Performance Considerations
- Debounce auto-resize calculations to avoid excessive DOM measurements
- Use ResizeObserver API for efficient resize detection
- Implement virtual scrolling for very large text content
- Debounce validation to avoid excessive API calls
- Use requestAnimationFrame for smooth resize animations
- Consider using Web Workers for complex text processing
- Cache calculated dimensions to avoid redundant calculations

## Related Components
- **TextField**: For single-line text input
- **CodeEditor**: For syntax-highlighted code input
- **RichTextEditor**: For formatted text editing
- **CommentBox**: For comment interfaces
- **MarkdownEditor**: For markdown text editing
- **FormField**: Complete form field wrapper