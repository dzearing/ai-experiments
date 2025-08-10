# FormError Component

## Overview
A component for displaying form validation errors with proper accessibility and visual prominence.

## Component Specification

### Props
```typescript
interface FormErrorProps extends HTMLAttributes<HTMLDivElement> {
  // Content
  children?: ReactNode;
  error?: string | string[]; // Error message(s)
  
  // Visual variants
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inline' | 'toast';
  
  // Icon display
  showIcon?: boolean;
  icon?: ReactNode;
  
  // Behavior
  visible?: boolean; // Control visibility
  autoHide?: boolean; // Auto-hide after timeout
  autoHideDelay?: number; // Delay in milliseconds
  
  // Field association
  fieldId?: string; // Associates with form field for accessibility
  
  // Styling
  className?: string;
}
```

### Usage Examples
```tsx
// Basic error message
<FormError error="Email is required" />

// Multiple errors
<FormError 
  error={[
    "Password must be at least 8 characters",
    "Password must contain at least one number"
  ]} 
/>

// Associated with form field
<div>
  <Input 
    id="email"
    aria-describedby="email-error"
    aria-invalid={hasError}
  />
  <FormError 
    id="email-error"
    fieldId="email"
    error={emailError}
  />
</div>

// Custom icon
<FormError 
  error="Network connection failed"
  icon={<AlertTriangle />}
/>

// Inline variant
<FormError 
  variant="inline"
  error="Username already exists"
  size="sm"
/>

// With visibility control
<FormError 
  error="Form submission failed"
  visible={showError}
  autoHide
  autoHideDelay={5000}
/>

// Custom content
<FormError>
  <span>Custom error with </span>
  <Link href="/help">help link</Link>
</FormError>
```

## Visual Design

### Variants
- **default**: Standard error styling with icon and spacing
- **inline**: Compact styling for inline validation
- **toast**: Prominent styling for global errors

### Size Options
- **sm**: 12px font, compact spacing
- **md**: 14px font, standard spacing (default)
- **lg**: 16px font, generous spacing

### Visual Elements
- Error icon (warning/alert triangle)
- Red/error color scheme
- Appropriate spacing and typography
- Animation for show/hide transitions

## Technical Implementation

### Core Structure
```typescript
const FormError = forwardRef<HTMLDivElement, FormErrorProps>(
  ({ 
    children,
    error,
    size = 'md',
    variant = 'default',
    showIcon = true,
    icon,
    visible = true,
    autoHide = false,
    autoHideDelay = 5000,
    fieldId,
    className,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = useState(visible);
    
    useEffect(() => {
      setIsVisible(visible);
    }, [visible]);
    
    useEffect(() => {
      if (autoHide && isVisible && (error || children)) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    }, [autoHide, isVisible, error, children, autoHideDelay]);
    
    const errorMessages = Array.isArray(error) ? error : error ? [error] : [];
    const hasContent = children || errorMessages.length > 0;
    
    if (!hasContent || !isVisible) {
      return null;
    }
    
    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          formErrorStyles.base,
          formErrorStyles.variant[variant],
          formErrorStyles.size[size],
          className
        )}
        {...props}
      >
        {showIcon && (
          <span className={formErrorStyles.icon}>
            {icon || <AlertTriangle />}
          </span>
        )}
        
        <div className={formErrorStyles.content}>
          {children ? (
            children
          ) : errorMessages.length === 1 ? (
            <span>{errorMessages[0]}</span>
          ) : (
            <ul className={formErrorStyles.list}>
              {errorMessages.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
);
```

### Auto-hide Hook
```typescript
// Optional: Separate hook for auto-hide behavior
const useAutoHide = (
  visible: boolean,
  autoHide: boolean,
  delay: number,
  onHide?: () => void
) => {
  const [isVisible, setIsVisible] = useState(visible);
  
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);
  
  useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onHide?.();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, isVisible, delay, onHide]);
  
  return isVisible;
};
```

### CSS Module Structure
```css
.base {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  color: var(--color-error);
  animation: fadeIn 0.2s ease-in;
}

.variant {
  &.default {
    margin-top: var(--spacing-xs);
    padding: var(--spacing-xs);
  }
  
  &.inline {
    margin-top: var(--spacing-xxs);
    padding: 0;
  }
  
  &.toast {
    background: var(--color-error-surface);
    border: 1px solid var(--color-error-border);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-sm);
    margin-top: var(--spacing-sm);
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
  color: var(--color-error);
  flex-shrink: 0;
  margin-top: 2px; /* Align with text baseline */
}

.content {
  flex: 1;
  line-height: 1.4;
}

.list {
  margin: 0;
  padding-left: var(--spacing-md);
  list-style-type: disc;
}

.list li {
  margin-bottom: var(--spacing-xxs);
}

.list li:last-child {
  margin-bottom: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Accessibility Features
- `role="alert"` for immediate announcements
- `aria-live="polite"` for non-intrusive updates
- Proper association with form fields via `aria-describedby`
- Screen reader friendly error lists
- Color contrast compliance

### Form Field Association
```tsx
// Proper accessibility setup
const fieldId = "email-input";
const errorId = "email-error";

<Input 
  id={fieldId}
  aria-describedby={hasError ? errorId : undefined}
  aria-invalid={hasError}
/>
<FormError 
  id={errorId}
  fieldId={fieldId}
  error={error}
/>
```

## Dependencies
- React (forwardRef, useState, useEffect)
- CSS modules
- Utility functions (cn)
- Icon component (AlertTriangle)

## Design Tokens Used
- **Colors**: error colors, background, borders
- **Typography**: font sizes, line heights
- **Spacing**: margins, padding, gaps
- **Border Radius**: rounded corners for toast variant
- **Animations**: fade in/out transitions

## Testing Considerations
- Screen reader announcements
- Multiple error handling
- Auto-hide functionality
- Form field association
- Various variant behaviors
- Animation and timing
- Error list formatting

## Related Components
- FormLabel (field labeling)
- FormHelperText (additional guidance)
- Input (form control integration)
- Alert (similar error patterns)

## Common Use Cases
- Form validation feedback
- Field-specific errors
- Multi-error display
- Real-time validation
- Server-side validation errors
- Network error messages
- Authentication errors