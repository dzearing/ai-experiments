# FormHelperText Component

## Overview
A component for displaying helpful information, instructions, or context for form fields.

## Component Specification

### Props
```typescript
interface FormHelperTextProps extends HTMLAttributes<HTMLDivElement> {
  // Content
  children: ReactNode;
  
  // Visual variants
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'prominent';
  
  // State-based styling
  disabled?: boolean;
  error?: boolean; // Style as error context
  
  // Icon support
  icon?: ReactNode;
  showIcon?: boolean;
  
  // Field association
  fieldId?: string; // Associates with form field for accessibility
  
  // Styling
  className?: string;
}
```

### Usage Examples
```tsx
// Basic helper text
<FormHelperText>
  Enter your email address to receive notifications
</FormHelperText>

// Associated with form field
<div>
  <Input 
    id="password"
    type="password"
    aria-describedby="password-help"
  />
  <FormHelperText id="password-help">
    Password must be at least 8 characters long
  </FormHelperText>
</div>

// With icon
<FormHelperText 
  icon={<InfoIcon />}
  showIcon
>
  This information is used to personalize your experience
</FormHelperText>

// Subtle variant
<FormHelperText variant="subtle">
  Optional: This field can be left blank
</FormHelperText>

// Error context
<FormHelperText error>
  Please check your input and try again
</FormHelperText>

// Disabled state
<FormHelperText disabled>
  This field is read-only
</FormHelperText>

// Prominent help
<FormHelperText variant="prominent">
  Important: Changes cannot be undone
</FormHelperText>
```

## Visual Design

### Variants
- **default**: Standard helper text styling
- **subtle**: Lower contrast, less prominent
- **prominent**: Higher contrast, more noticeable

### Size Options
- **sm**: 12px font, compact spacing
- **md**: 14px font, standard spacing (default)
- **lg**: 16px font, generous spacing

### State Styling
- **Normal**: Secondary text color
- **Error**: Error color scheme
- **Disabled**: Reduced opacity and muted colors

## Technical Implementation

### Core Structure
```typescript
const FormHelperText = forwardRef<HTMLDivElement, FormHelperTextProps>(
  ({ 
    children,
    size = 'md',
    variant = 'default',
    disabled = false,
    error = false,
    icon,
    showIcon = false,
    fieldId,
    className,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          formHelperTextStyles.base,
          formHelperTextStyles.variant[variant],
          formHelperTextStyles.size[size],
          disabled && formHelperTextStyles.disabled,
          error && formHelperTextStyles.error,
          className
        )}
        {...props}
      >
        {showIcon && icon && (
          <span className={formHelperTextStyles.icon}>
            {icon}
          </span>
        )}
        
        <span className={formHelperTextStyles.text}>
          {children}
        </span>
      </div>
    );
  }
);
```

### CSS Module Structure
```css
.base {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  line-height: 1.4;
}

.variant {
  &.default {
    color: var(--color-text-secondary);
  }
  
  &.subtle {
    color: var(--color-text-tertiary);
    opacity: 0.8;
  }
  
  &.prominent {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
  }
}

.size {
  &.sm {
    font-size: var(--font-size-xs);
  }
  
  &.md {
    font-size: var(--font-size-sm);
  }
  
  &.lg {
    font-size: var(--font-size-md);
  }
}

.icon {
  color: inherit;
  flex-shrink: 0;
  margin-top: 1px; /* Align with text */
}

.text {
  flex: 1;
}

.disabled {
  opacity: 0.6;
  color: var(--color-text-disabled);
}

.error {
  color: var(--color-error-secondary);
}
```

## Accessibility Features
- Proper association with form fields via `aria-describedby`
- Non-intrusive informational content
- Screen reader friendly
- Maintains semantic hierarchy

### Form Field Association
```tsx
// Proper accessibility setup
const fieldId = "username";
const helpId = "username-help";

<Input 
  id={fieldId}
  aria-describedby={helpId}
/>
<FormHelperText id={helpId}>
  Username must be 3-20 characters long
</FormHelperText>
```

### Multiple Associations
```tsx
// Multiple descriptive elements
const fieldId = "email";
const helpId = "email-help";
const errorId = "email-error";

<Input 
  id={fieldId}
  aria-describedby={`${helpId} ${hasError ? errorId : ''}`}
  aria-invalid={hasError}
/>
<FormHelperText id={helpId}>
  We'll never share your email address
</FormHelperText>
{hasError && (
  <FormError id={errorId} error={errorMessage} />
)}
```

## Dependencies
- React (forwardRef, HTMLAttributes)
- CSS modules
- Utility functions (cn)

## Design Tokens Used
- **Typography**: font sizes, line heights, weights
- **Colors**: text colors for variants and states
- **Spacing**: margins and gaps

## Testing Considerations
- Form field association verification
- Screen reader announcements
- Various size and variant combinations
- State-based styling (error, disabled)
- Icon alignment and display
- Content overflow handling

## Related Components
- FormLabel (field labeling)
- FormError (error messaging)
- Input (form control integration)
- Tooltip (alternative help patterns)

## Common Use Cases
- Input format guidance
- Field validation rules
- Usage instructions
- Privacy notices
- Character limits
- Feature explanations
- Contextual help
- Best practices
- Examples or placeholders