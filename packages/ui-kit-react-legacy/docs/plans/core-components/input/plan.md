# Input Component

## Overview
A styled text input component with comprehensive features including validation states, icons, and accessibility support.

## Component Specification

### Props
```typescript
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  // Visual variants
  variant?: 'default' | 'filled' | 'underlined' | 'borderless';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  // State styling
  error?: boolean;
  success?: boolean;
  loading?: boolean;
  
  // Icons and addons
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftAddon?: ReactNode; // Text or component before input
  rightAddon?: ReactNode; // Text or component after input
  
  // Input behavior
  clearable?: boolean; // Show clear button when has value
  onClear?: () => void;
  
  // Loading state
  loadingPosition?: 'left' | 'right';
  
  // Styling
  fullWidth?: boolean;
  rounded?: boolean;
  className?: string;
  
  // Container props
  containerClassName?: string;
  containerProps?: HTMLAttributes<HTMLDivElement>;
}
```

### Usage Examples
```tsx
// Basic input
<Input 
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// With icons
<Input 
  leftIcon={<Search />}
  placeholder="Search..."
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>

// Error state
<Input 
  error
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  aria-describedby="email-error"
/>

// Success state
<Input 
  success
  leftIcon={<Check />}
  value={validatedField}
  readOnly
/>

// With addons
<Input 
  leftAddon="$"
  rightAddon=".00"
  placeholder="0"
  type="number"
/>

// Clearable input
<Input 
  clearable
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onClear={() => setSearchTerm('')}
  placeholder="Type to search..."
/>

// Loading state
<Input 
  loading
  loadingPosition="right"
  placeholder="Checking availability..."
/>

// Full width
<Input 
  fullWidth
  size="lg"
  placeholder="Large full-width input"
/>

// Different variants
<Input variant="filled" placeholder="Filled input" />
<Input variant="underlined" placeholder="Underlined input" />
<Input variant="borderless" placeholder="Borderless input" />
```

## Visual Design

### Variants
- **default**: Standard border input
- **filled**: Background filled with subtle color
- **underlined**: Bottom border only
- **borderless**: No visible borders

### Size Options
- **sm**: 32px height, compact padding
- **md**: 40px height, standard padding (default)
- **lg**: 48px height, generous padding
- **xl**: 56px height, extra padding

### State Indicators
- **Error**: Red border/background tint
- **Success**: Green border/background tint
- **Loading**: Spinner in specified position
- **Focus**: Enhanced border/shadow
- **Disabled**: Reduced opacity, no interaction

## Technical Implementation

### Core Structure
```typescript
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    variant = 'default',
    size = 'md',
    error,
    success,
    loading,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    clearable,
    onClear,
    loadingPosition = 'right',
    fullWidth,
    rounded,
    className,
    containerClassName,
    containerProps,
    value,
    ...props 
  }, ref) => {
    const hasClearButton = clearable && value && !props.disabled && !props.readOnly;
    const showLeftSpinner = loading && loadingPosition === 'left';
    const showRightSpinner = loading && loadingPosition === 'right';
    
    return (
      <div
        className={cn(
          inputStyles.container,
          inputStyles.variant[variant],
          inputStyles.size[size],
          error && inputStyles.error,
          success && inputStyles.success,
          loading && inputStyles.loading,
          fullWidth && inputStyles.fullWidth,
          rounded && inputStyles.rounded,
          props.disabled && inputStyles.disabled,
          containerClassName
        )}
        {...containerProps}
      >
        {/* Left addon */}
        {leftAddon && (
          <span className={inputStyles.leftAddon}>
            {leftAddon}
          </span>
        )}
        
        {/* Left icon/spinner */}
        {(leftIcon || showLeftSpinner) && (
          <span className={inputStyles.leftIcon}>
            {showLeftSpinner ? <Spinner size="sm" /> : leftIcon}
          </span>
        )}
        
        {/* Input element */}
        <input
          ref={ref}
          className={cn(
            inputStyles.input,
            className
          )}
          value={value}
          {...props}
        />
        
        {/* Clear button */}
        {hasClearButton && (
          <button
            type="button"
            className={inputStyles.clearButton}
            onClick={onClear}
            aria-label="Clear input"
          >
            <X size={16} />
          </button>
        )}
        
        {/* Right icon/spinner */}
        {(rightIcon || showRightSpinner) && (
          <span className={inputStyles.rightIcon}>
            {showRightSpinner ? <Spinner size="sm" /> : rightIcon}
          </span>
        )}
        
        {/* Right addon */}
        {rightAddon && (
          <span className={inputStyles.rightAddon}>
            {rightAddon}
          </span>
        )}
      </div>
    );
  }
);
```

### CSS Module Structure
```css
.container {
  display: inline-flex;
  align-items: center;
  position: relative;
  border-radius: var(--border-radius-md);
  transition: all 150ms ease;
}

.variant {
  &.default {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
  }
  
  &.filled {
    border: 1px solid transparent;
    background: var(--color-surface-secondary);
  }
  
  &.underlined {
    border: none;
    border-bottom: 2px solid var(--color-border);
    border-radius: 0;
    background: transparent;
  }
  
  &.borderless {
    border: none;
    background: transparent;
  }
}

.size {
  &.sm {
    height: 32px;
    font-size: var(--font-size-sm);
  }
  
  &.md {
    height: 40px;
    font-size: var(--font-size-md);
  }
  
  &.lg {
    height: 48px;
    font-size: var(--font-size-lg);
  }
  
  &.xl {
    height: 56px;
    font-size: var(--font-size-xl);
  }
}

.input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 var(--spacing-sm);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: inherit;
}

.input::placeholder {
  color: var(--color-text-placeholder);
}

.leftAddon,
.rightAddon {
  padding: 0 var(--spacing-sm);
  color: var(--color-text-secondary);
  background: var(--color-surface-tertiary);
  border-right: 1px solid var(--color-border);
  white-space: nowrap;
}

.rightAddon {
  border-right: none;
  border-left: 1px solid var(--color-border);
}

.leftIcon,
.rightIcon {
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-sm);
  color: var(--color-text-secondary);
}

.clearButton {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xs);
  margin-right: var(--spacing-xs);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 150ms ease;
}

.clearButton:hover {
  background: var(--color-surface-secondary);
  color: var(--color-text-primary);
}

.error {
  border-color: var(--color-error);
  background: var(--color-error-surface);
}

.success {
  border-color: var(--color-success);
  background: var(--color-success-surface);
}

.loading {
  pointer-events: none;
}

.fullWidth {
  width: 100%;
}

.rounded {
  border-radius: var(--border-radius-full);
}

.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* Focus states */
.container:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}

.error:focus-within {
  border-color: var(--color-error);
  box-shadow: 0 0 0 2px var(--color-error-alpha-20);
}
```

## Accessibility Features
- Proper label association
- Error state announcements
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA attributes

### ARIA Implementation
```typescript
const ariaProps = {
  'aria-invalid': error,
  'aria-describedby': props['aria-describedby'],
  ...props
};
```

## Dependencies
- React (forwardRef, InputHTMLAttributes)
- Internal Spinner component
- Icon components (X for clear button)
- CSS modules
- Utility functions (cn)

## Design Tokens Used
- **Colors**: borders, backgrounds, text, states
- **Spacing**: padding, margins, gaps
- **Border Radius**: input rounding
- **Typography**: font sizes, weights
- **Shadows**: focus states

## Testing Considerations
- Keyboard navigation
- Screen reader compatibility
- State transitions
- Icon and addon positioning
- Clear button functionality
- Loading state behavior
- Various size and variant combinations
- Error and success states

## Related Components
- FormLabel (field labeling)
- FormError (error messaging)
- FormHelperText (additional context)
- Textarea (multi-line input)
- Select (dropdown input)

## Common Use Cases
- Text input fields
- Search boxes
- Email/password fields
- Numeric inputs
- URL inputs
- Phone number inputs
- Address fields
- Form validation
- Real-time search
- User authentication