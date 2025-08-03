# FormLabel Component

## Overview
A label component for form fields that provides proper accessibility relationships and visual styling.

## Component Specification

### Props
```typescript
interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  // Content
  children: ReactNode;
  
  // Visual variants
  size?: 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold';
  
  // State indicators
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  
  // Visual styling
  requiredIndicator?: ReactNode; // Custom required indicator
  optionalText?: string; // Custom optional text (default: "(optional)")
  
  // Layout
  htmlFor?: string; // Associates with form control
  
  // Styling
  className?: string;
}
```

### Usage Examples
```tsx
// Basic form label
<FormLabel htmlFor="email">
  Email Address
</FormLabel>

// Required field
<FormLabel htmlFor="password" required>
  Password
</FormLabel>

// Optional field
<FormLabel htmlFor="nickname" optional>
  Display Name
</FormLabel>

// Custom styling
<FormLabel 
  htmlFor="title"
  size="lg"
  weight="semibold"
>
  Document Title
</FormLabel>

// Custom required indicator
<FormLabel 
  htmlFor="phone"
  required
  requiredIndicator={<span className="text-red-500">*</span>}
>
  Phone Number
</FormLabel>

// Disabled state
<FormLabel htmlFor="readonly" disabled>
  Read-only Field
</FormLabel>
```

## Visual Design

### Size Variants
- **sm**: 14px font size, compact spacing
- **md**: 16px font size, standard spacing (default)
- **lg**: 18px font size, generous spacing

### Weight Options
- **normal**: Regular font weight (400)
- **medium**: Medium font weight (500)
- **semibold**: Semi-bold font weight (600)

### State Indicators
- **Required**: Red asterisk (*) or custom indicator
- **Optional**: Gray "(optional)" text or custom text
- **Disabled**: Reduced opacity, muted colors

## Technical Implementation

### Core Structure
```typescript
const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ 
    children,
    size = 'md',
    weight = 'medium',
    required,
    optional,
    disabled,
    requiredIndicator,
    optionalText = '(optional)',
    className,
    ...props 
  }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          formLabelStyles.base,
          formLabelStyles.size[size],
          formLabelStyles.weight[weight],
          disabled && formLabelStyles.disabled,
          className
        )}
        {...props}
      >
        <span className={formLabelStyles.text}>
          {children}
        </span>
        
        {required && (
          <span 
            className={formLabelStyles.required}
            aria-label="required"
          >
            {requiredIndicator || '*'}
          </span>
        )}
        
        {optional && !required && (
          <span className={formLabelStyles.optional}>
            {optionalText}
          </span>
        )}
      </label>
    );
  }
);
```

### CSS Module Structure
```css
.base {
  display: inline-flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  color: var(--color-text-primary);
  cursor: pointer;
  line-height: 1.5;
}

.text {
  /* Main label text */
}

.size {
  &.sm {
    font-size: var(--font-size-sm);
  }
  
  &.md {
    font-size: var(--font-size-md);
  }
  
  &.lg {
    font-size: var(--font-size-lg);
  }
}

.weight {
  &.normal {
    font-weight: var(--font-weight-normal);
  }
  
  &.medium {
    font-weight: var(--font-weight-medium);
  }
  
  &.semibold {
    font-weight: var(--font-weight-semibold);
  }
}

.required {
  color: var(--color-error);
  font-weight: var(--font-weight-bold);
  margin-left: 2px;
}

.optional {
  color: var(--color-text-secondary);
  font-size: 0.875em;
  font-weight: var(--font-weight-normal);
  margin-left: var(--spacing-xs);
}

.disabled {
  opacity: 0.6;
  cursor: default;
  color: var(--color-text-disabled);
}
```

## Accessibility Features
- Proper `htmlFor` association with form controls
- Screen reader announcements for required/optional states
- Maintains semantic label relationship
- Keyboard navigation support
- Proper color contrast for indicators

### ARIA Considerations
```typescript
// Required indicator with proper labeling
{required && (
  <span 
    className={formLabelStyles.required}
    aria-label="required field"
    role="img"
  >
    {requiredIndicator || '*'}
  </span>
)}
```

## Dependencies
- React (forwardRef, LabelHTMLAttributes)
- CSS modules
- Utility functions (cn)

## Design Tokens Used
- **Typography**: font sizes, weights, line heights
- **Colors**: text colors, required/optional indicators
- **Spacing**: gaps between elements

## Testing Considerations
- Form association verification
- Screen reader announcements
- Visual indicator display
- Required/optional logic
- Disabled state behavior
- Various size combinations

## Related Components
- FormError (error messaging)
- FormHelperText (additional context)
- Input (form control association)
- Checkbox/Radio (alternative label patterns)

## Common Use Cases
- Text input labels
- Textarea labels
- Select dropdown labels
- Checkbox group labels
- Radio button group labels
- File upload labels
- Form section headers