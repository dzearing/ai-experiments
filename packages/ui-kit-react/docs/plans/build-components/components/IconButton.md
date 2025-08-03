# IconButton Component

## Overview
A button component that displays only an icon, with optional tooltips and accessibility features.

## Component Specification

### Props
```typescript
interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  // Icon props
  icon: ReactNode;
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Visual variants
  variant?: 'default' | 'ghost' | 'outline' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  
  // States
  loading?: boolean;
  disabled?: boolean;
  pressed?: boolean; // For toggle states
  
  // Accessibility
  'aria-label': string; // Required for icon-only buttons
  title?: string; // Tooltip text
  
  // Styling
  rounded?: boolean; // Circular button
  className?: string;
}
```

### Usage Examples
```tsx
// Basic icon button
<IconButton 
  icon={<Search />} 
  aria-label="Search"
  onClick={handleSearch}
/>

// With variant and size
<IconButton 
  icon={<Plus />} 
  variant="outline"
  size="lg"
  aria-label="Add item"
/>

// Toggle state
<IconButton 
  icon={pressed ? <HeartFilled /> : <Heart />}
  pressed={pressed}
  aria-label={pressed ? "Unlike" : "Like"}
  onClick={toggleLike}
/>

// Loading state
<IconButton 
  icon={<Save />}
  loading={isSaving}
  aria-label="Save"
  disabled={isSaving}
/>

// Circular button
<IconButton 
  icon={<User />}
  rounded
  variant="ghost"
  aria-label="User profile"
/>
```

## Visual Design

### Size Variants
- **xs**: 24px × 24px, 12px icon
- **sm**: 32px × 32px, 16px icon  
- **md**: 40px × 40px, 20px icon (default)
- **lg**: 48px × 48px, 24px icon
- **xl**: 56px × 56px, 28px icon

### Style Variants
- **default**: Filled background, high contrast
- **ghost**: Transparent background, visible on hover
- **outline**: Border with transparent background
- **subtle**: Light background, medium contrast

### Interactive States
- **Hover**: Subtle background change or elevation
- **Active**: Pressed visual feedback
- **Focus**: Clear focus ring for keyboard navigation
- **Loading**: Icon replaced with spinner
- **Disabled**: Reduced opacity, no interaction

## Technical Implementation

### Core Structure
```typescript
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    icon, 
    iconSize, 
    variant = 'default',
    size = 'md',
    color = 'neutral',
    loading,
    pressed,
    rounded,
    className,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          iconButtonStyles.base,
          iconButtonStyles.variant[variant],
          iconButtonStyles.size[size],
          iconButtonStyles.color[color],
          rounded && iconButtonStyles.rounded,
          pressed && iconButtonStyles.pressed,
          className
        )}
        aria-pressed={pressed}
        {...props}
      >
        {loading ? (
          <Spinner size={iconSize || size} />
        ) : (
          icon
        )}
      </button>
    );
  }
);
```

### Accessibility Features
- Required `aria-label` for screen readers
- Support for `aria-pressed` for toggle states
- Keyboard navigation support
- Focus management
- Proper role and state announcements

### CSS Module Structure
```css
.base {
  /* Base button styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  position: relative;
}

.variant {
  /* Variant-specific styles */
}

.size {
  /* Size-specific dimensions */
}

.color {
  /* Color theme styles */
}

.rounded {
  border-radius: 50%;
}

.pressed {
  /* Pressed/active state */
}
```

## Dependencies
- React (forwardRef, HTMLAttributes)
- Internal Spinner component
- CSS modules
- Utility functions (cn)

## Design Tokens Used
- **Spacing**: button padding, icon spacing
- **Border Radius**: rounded corners, circular buttons
- **Colors**: background, border, icon colors
- **Shadows**: elevation for certain variants
- **Transitions**: hover/focus animations

## Testing Considerations
- Keyboard navigation and focus management
- Screen reader announcements
- Toggle state behavior
- Loading state transitions
- Various size and variant combinations
- Icon rendering and accessibility

## Related Components
- Button (base button component)
- Spinner (for loading states)
- Tooltip (for additional context)

## Common Use Cases
- Toolbar actions (save, edit, delete)
- Navigation controls (back, forward, menu)
- Social actions (like, share, bookmark)
- Form controls (clear input, toggle visibility)
- Media controls (play, pause, volume)