# Sub-Agent Task: Form & Input Controls Specialist

## Objective
Design comprehensive form components with built-in validation, accessibility, and consistent interaction patterns. Focus on creating a unified form system that handles complex validation scenarios and provides excellent user experience.

## Assigned Components (High Priority: 9, Medium Priority: 11)

### High Priority Components
1. FormField (wrapper component)
2. TextArea
3. DatePicker
4. FileInput
5. PasswordInput
6. SearchInput
7. AutocompleteInput
8. TagInput
9. ValidationMessage

### Medium Priority Components
1. MarkdownEditor
2. CodeEditor
3. DateRangePicker
4. TimePicker
5. DateTimePicker
6. NumberInput
7. SliderInput
8. ImageUpload
9. SearchableSelect
10. MultiSelect
11. ColorPicker

## Core Form System Architecture

### 1. FormField Wrapper Pattern
```typescript
interface FormFieldProps {
  // Field identification
  name: string;
  label: string;
  id?: string;
  
  // Validation
  required?: boolean;
  validate?: ValidatorFunction | ValidatorFunction[];
  validateOn?: 'change' | 'blur' | 'submit';
  
  // Display
  description?: string;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  
  // Layout
  layout?: 'vertical' | 'horizontal' | 'floating';
  labelWidth?: string;
  
  // Children (the actual input)
  children: React.ReactElement;
}
```

### 2. Validation System
```typescript
interface ValidationRule {
  validate: (value: any) => boolean | Promise<boolean>;
  message: string | ((value: any) => string);
}

interface ValidationState {
  isValid: boolean;
  error: string | null;
  isValidating: boolean;
}

// Built-in validators
const validators = {
  required: (message?: string) => ({
    validate: (value: any) => !!value,
    message: message || 'This field is required'
  }),
  
  minLength: (length: number, message?: string) => ({
    validate: (value: string) => value.length >= length,
    message: message || `Must be at least ${length} characters`
  }),
  
  email: (message?: string) => ({
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: message || 'Please enter a valid email'
  }),
  
  // ... more validators
};
```

## Component Specifications

### 1. FormField HTML Mockup
```html
<!-- FormField - Vertical Layout with Validation -->
<div class="form-field form-field--error" data-field="email">
  <label class="form-field__label" for="email-input">
    Email Address
    <span class="form-field__required" aria-label="required">*</span>
  </label>
  
  <div class="form-field__description">
    We'll use this for account notifications
  </div>
  
  <div class="form-field__input-wrapper">
    <input 
      id="email-input"
      type="email"
      class="input input--error"
      aria-invalid="true"
      aria-describedby="email-error email-description"
      value="invalid.email"
    />
  </div>
  
  <div class="form-field__error" id="email-error" role="alert">
    <svg class="icon icon--error"><!-- error icon --></svg>
    Please enter a valid email address
  </div>
</div>

<style>
.form-field {
  --field-spacing: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.form-field__label {
  display: block;
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.form-field__required {
  color: var(--color-danger);
  margin-left: var(--spacing-2xs);
}

.form-field--error .form-field__input-wrapper {
  --input-border-color: var(--color-danger);
}

.form-field__error {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
  animation: slideDown 0.2s ease-out;
}
</style>
```

### 2. DatePicker Mockup
```html
<!-- DatePicker - Calendar Popup State -->
<div class="date-picker">
  <div class="date-picker__input-wrapper">
    <input 
      type="text"
      class="input"
      value="March 15, 2024"
      aria-label="Date"
      aria-expanded="true"
      aria-controls="calendar-popup"
    />
    <button class="date-picker__trigger" aria-label="Open calendar">
      <svg><!-- calendar icon --></svg>
    </button>
  </div>
  
  <div 
    id="calendar-popup"
    class="date-picker__popup"
    role="dialog"
    aria-label="Choose date"
  >
    <div class="calendar">
      <div class="calendar__header">
        <button aria-label="Previous month">‹</button>
        <div class="calendar__month-year">March 2024</div>
        <button aria-label="Next month">›</button>
      </div>
      
      <div class="calendar__weekdays" role="row">
        <div role="columnheader" aria-label="Sunday">S</div>
        <div role="columnheader" aria-label="Monday">M</div>
        <!-- ... other days ... -->
      </div>
      
      <div class="calendar__days" role="grid">
        <button class="calendar__day" role="gridcell" aria-label="March 1, 2024">1</button>
        <!-- ... other days ... -->
        <button class="calendar__day calendar__day--selected" role="gridcell" aria-selected="true">15</button>
        <!-- ... -->
      </div>
    </div>
  </div>
</div>
```

### 3. AutocompleteInput Specification
```typescript
interface AutocompleteInputProps extends Omit<InputProps, 'onChange'> {
  // Data
  options: AutocompleteOption[] | (() => Promise<AutocompleteOption[]>);
  value: string | AutocompleteOption;
  onChange: (value: string | AutocompleteOption) => void;
  
  // Behavior
  filterOptions?: (options: AutocompleteOption[], query: string) => AutocompleteOption[];
  minQueryLength?: number;
  debounceMs?: number;
  
  // Display
  renderOption?: (option: AutocompleteOption) => React.ReactNode;
  noOptionsMessage?: string;
  loadingMessage?: string;
  
  // Features
  multiple?: boolean;
  createOption?: (query: string) => AutocompleteOption;
  groupBy?: (option: AutocompleteOption) => string;
  
  // Interaction
  openOnFocus?: boolean;
  clearable?: boolean;
  closeOnSelect?: boolean;
}
```

### 4. TagInput Mockup
```html
<!-- TagInput - Multiple Tags Selected -->
<div class="tag-input" role="combobox" aria-expanded="false">
  <div class="tag-input__tags">
    <div class="tag" role="option" aria-selected="true">
      <span>React</span>
      <button class="tag__remove" aria-label="Remove React">×</button>
    </div>
    <div class="tag" role="option" aria-selected="true">
      <span>TypeScript</span>
      <button class="tag__remove" aria-label="Remove TypeScript">×</button>
    </div>
    
    <input 
      type="text"
      class="tag-input__input"
      placeholder="Add tags..."
      aria-label="Tag input"
      aria-autocomplete="list"
    />
  </div>
  
  <!-- Suggestions dropdown -->
  <div class="tag-input__suggestions" role="listbox" hidden>
    <div class="suggestion" role="option">JavaScript</div>
    <div class="suggestion" role="option">CSS</div>
  </div>
</div>
```

### 5. Complex Form Integration Example
```html
<!-- Complete Form Example -->
<form class="form" novalidate>
  <div class="form-field">
    <label for="title">Project Title *</label>
    <input id="title" type="text" class="input" required />
  </div>
  
  <div class="form-field">
    <label for="description">Description</label>
    <textarea id="description" class="textarea" rows="4"></textarea>
  </div>
  
  <div class="form-field">
    <label for="tags">Tags</label>
    <div class="tag-input" id="tags">
      <!-- TagInput component -->
    </div>
  </div>
  
  <div class="form-row">
    <div class="form-field">
      <label for="start-date">Start Date</label>
      <div class="date-picker">
        <!-- DatePicker component -->
      </div>
    </div>
    
    <div class="form-field">
      <label for="priority">Priority</label>
      <select id="priority" class="select">
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
      </select>
    </div>
  </div>
  
  <div class="form-actions">
    <button type="button" class="button button--secondary">Cancel</button>
    <button type="submit" class="button button--primary">Create Project</button>
  </div>
</form>
```

## Accessibility Requirements

### Keyboard Navigation
- Tab through fields
- Arrow keys in dropdowns/calendars
- Enter to select
- Escape to close popups
- Space to toggle checkboxes

### ARIA Requirements
- Proper labels and descriptions
- Live regions for validation messages
- Combobox pattern for autocomplete
- Grid pattern for calendars
- Announce state changes

### Focus Management
- Trap focus in popups
- Return focus on close
- Visual focus indicators
- Skip links for long forms

## Validation Patterns

### Real-time Validation
```typescript
const useFieldValidation = (value: any, rules: ValidationRule[]) => {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  useEffect(() => {
    const validate = async () => {
      setIsValidating(true);
      
      for (const rule of rules) {
        const result = await rule.validate(value);
        if (!result) {
          setError(rule.message);
          setIsValidating(false);
          return;
        }
      }
      
      setError(null);
      setIsValidating(false);
    };
    
    validate();
  }, [value, rules]);
  
  return { error, isValidating };
};
```

## Success Criteria
1. All form components use consistent validation patterns
2. Full keyboard navigation support
3. ARIA compliance for all components
4. Touch-friendly on mobile devices
5. Proper error handling and recovery
6. Loading states for async operations
7. Support for both controlled and uncontrolled modes