# TextField

## Component Name and Description
TextField is an input primitive that provides a comprehensive text input component with built-in validation, accessibility, and design system integration.

## Use Cases
- Single-line text input
- Form data collection
- Search inputs
- User credentials input
- Data entry fields
- Filter and query inputs

## API/Props Interface

```typescript
interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input variant */
  variant?: 'default' | 'filled' | 'outlined' | 'minimal';
  
  /** Input size */
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
  
  /** Icon before input */
  startIcon?: React.ReactNode;
  
  /** Icon after input */
  endIcon?: React.ReactNode;
  
  /** Prefix text */
  prefix?: string;
  
  /** Suffix text */
  suffix?: string;
  
  /** Clear button */
  clearable?: boolean;
  
  /** Auto-complete suggestions */
  autoComplete?: string;
  
  /** Input type */
  type?: 
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'url'
    | 'search'
    | 'number';
  
  /** Input mode for mobile keyboards */
  inputMode?: 
    | 'text'
    | 'numeric'
    | 'decimal'
    | 'tel'
    | 'email'
    | 'url'
    | 'search';
  
  /** Pattern for validation */
  pattern?: string;
  
  /** Minimum length */
  minLength?: number;
  
  /** Maximum length */
  maxLength?: number;
  
  /** Show character count */
  showCharacterCount?: boolean;
  
  /** Custom validation function */
  validate?: (value: string) => string | null;
  
  /** Debounce validation */
  validateDebounce?: number;
  
  /** Event handlers */
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  onValidation?: (isValid: boolean, message?: string) => void;
}
```

## Sub-components

### TextField.Label
The label component with required/optional indicators.

### TextField.Input
The actual input element.

### TextField.Message
Help text, error messages, or other feedback.

### TextField.Counter
Character count display.

## Usage Examples

### Basic Text Field
```html
<div class="text-field" data-variant="outlined" data-size="md">
  <label class="text-field-label" for="name">
    Full Name
    <span class="required-indicator">*</span>
  </label>
  <input class="text-field-input" 
         type="text" 
         id="name" 
         name="name"
         placeholder="Enter your full name"
         required>
</div>
```

### Text Field with Icons and Description
```html
<div class="text-field" data-variant="outlined" data-size="md">
  <label class="text-field-label" for="email">
    Email Address
  </label>
  <div class="text-field-input-wrapper">
    <span class="text-field-start-icon">📧</span>
    <input class="text-field-input" 
           type="email" 
           id="email" 
           name="email"
           placeholder="you@example.com"
           autocomplete="email">
  </div>
  <div class="text-field-message" data-type="description">
    We'll use this to send you important updates
  </div>
</div>
```

### Error State with Validation
```html
<div class="text-field" data-variant="outlined" data-state="error">
  <label class="text-field-label" for="username">
    Username
    <span class="required-indicator">*</span>
  </label>
  <input class="text-field-input" 
         type="text" 
         id="username" 
         name="username"
         aria-invalid="true"
         aria-describedby="username-error">
  <div class="text-field-message" 
       data-type="error" 
       id="username-error">
    Username must be at least 3 characters long
  </div>
</div>
```

### Search Field with Clear Button
```html
<div class="text-field" data-variant="filled" data-size="lg">
  <label class="text-field-label sr-only" for="search">
    Search
  </label>
  <div class="text-field-input-wrapper">
    <span class="text-field-start-icon">🔍</span>
    <input class="text-field-input" 
           type="search" 
           id="search" 
           name="search"
           placeholder="Search products..."
           autocomplete="off">
    <button class="text-field-clear-button" 
            type="button"
            aria-label="Clear search">
      ✕
    </button>
  </div>
</div>
```

### Text Field with Character Count
```html
<div class="text-field" data-variant="outlined">
  <label class="text-field-label" for="bio">
    Bio
    <span class="optional-indicator">(optional)</span>
  </label>
  <input class="text-field-input" 
         type="text" 
         id="bio" 
         name="bio"
         maxlength="150"
         placeholder="Tell us about yourself...">
  <div class="text-field-footer">
    <div class="text-field-message">
      A brief description for your profile
    </div>
    <div class="text-field-counter">
      <span class="current-count">0</span>/<span class="max-count">150</span>
    </div>
  </div>
</div>
```

### Disabled and Read-Only States
```html
<div class="form-fields">
  <!-- Disabled state -->
  <div class="text-field" data-variant="outlined" data-state="disabled">
    <label class="text-field-label" for="disabled-field">
      Disabled Field
    </label>
    <input class="text-field-input" 
           type="text" 
           id="disabled-field" 
           name="disabled-field"
           value="Cannot be edited"
           disabled>
  </div>
  
  <!-- Read-only state -->
  <div class="text-field" data-variant="outlined" data-state="readonly">
    <label class="text-field-label" for="readonly-field">
      Read-Only Field
    </label>
    <input class="text-field-input" 
           type="text" 
           id="readonly-field" 
           name="readonly-field"
           value="Can be focused but not edited"
           readonly>
  </div>
</div>
```

## Accessibility Notes
- Always associate labels with inputs using `for` attribute
- Use `aria-describedby` to link help text and error messages
- Provide clear, descriptive labels that explain the field purpose
- Use appropriate `type` and `inputmode` attributes for mobile keyboards
- Ensure error states are announced to screen readers with `aria-invalid`
- Provide clear error messages that explain how to fix the issue
- Use `autocomplete` attributes to help users and password managers
- Test with keyboard navigation and screen readers
- Maintain sufficient color contrast for all states

## Performance Considerations
- Debounce validation to avoid excessive API calls
- Use controlled components judiciously to avoid re-render issues
- Implement proper event handling to prevent memory leaks
- Cache validation results when appropriate
- Use CSS transitions for smooth state changes
- Consider virtual scrolling for large lists of text fields
- Optimize icon rendering with sprite sheets or icon fonts

## Related Components
- **Label**: For field labeling
- **FormField**: Complete form field wrapper
- **TextAreaField**: For multi-line text input
- **SearchInput**: Specialized search input
- **PasswordInput**: For password entry
- **NumberInput**: For numeric input