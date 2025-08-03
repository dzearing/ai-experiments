# Tab Component

## Overview
Individual tab component that works within a TabList to provide tabbed navigation interface.

## Component Specification

### Props
```typescript
interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Content
  children: ReactNode;
  
  // Identification
  value: string; // Unique identifier for this tab
  
  // State
  selected?: boolean; // Controlled by TabList
  disabled?: boolean;
  
  // Visual styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'pills' | 'underline' | 'segment';
  
  // Icon support
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  
  // Badge/notification
  badge?: ReactNode;
  badgeCount?: number;
  
  // Behavior
  closable?: boolean; // Show close button
  onClose?: (value: string) => void;
  
  // Styling
  className?: string;
}
```

### Usage Examples
```tsx
// Basic tab (used within TabList)
<Tab value="overview">
  Overview
</Tab>

// With icon
<Tab value="settings" leftIcon={<Settings />}>
  Settings
</Tab>

// With badge
<Tab value="notifications" badge={<Badge>3</Badge>}>
  Notifications
</Tab>

// With badge count
<Tab value="messages" badgeCount={12}>
  Messages
</Tab>

// Closable tab
<Tab 
  value="document-1"
  closable
  onClose={(value) => closeTab(value)}
>
  Document 1
</Tab>

// Disabled tab
<Tab value="premium" disabled>
  Premium Features
</Tab>

// Different variants
<Tab variant="pills" value="home">Home</Tab>
<Tab variant="underline" value="about">About</Tab>
<Tab variant="segment" value="contact">Contact</Tab>
```

## Visual Design

### Variants
- **default**: Standard tab with background changes
- **pills**: Pill-shaped tabs with rounded corners
- **underline**: Tabs with bottom border indicator
- **segment**: Segmented control style

### Size Options
- **sm**: 28px height, compact padding
- **md**: 36px height, standard padding (default)
- **lg**: 44px height, generous padding

### Interactive States
- **Default**: Base tab appearance
- **Hover**: Subtle background change
- **Selected**: Active/selected state styling
- **Focus**: Clear focus ring for keyboard navigation
- **Disabled**: Reduced opacity, no interaction

## Technical Implementation

### Core Structure
```typescript
const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ 
    children,
    value,
    selected = false,
    disabled = false,
    size = 'md',
    variant = 'default',
    leftIcon,
    rightIcon,
    badge,
    badgeCount,
    closable = false,
    onClose,
    className,
    onClick,
    ...props 
  }, ref) => {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        onClick?.(e);
      }
    };
    
    const handleClose = (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClose?.(value);
    };
    
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={selected}
        aria-disabled={disabled}
        tabIndex={selected ? 0 : -1}
        className={cn(
          tabStyles.base,
          tabStyles.variant[variant],
          tabStyles.size[size],
          selected && tabStyles.selected,
          disabled && tabStyles.disabled,
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {/* Left icon */}
        {leftIcon && (
          <span className={tabStyles.leftIcon}>
            {leftIcon}
          </span>
        )}
        
        {/* Main content */}
        <span className={tabStyles.content}>
          {children}
        </span>
        
        {/* Badge */}
        {(badge || typeof badgeCount === 'number') && (
          <span className={tabStyles.badge}>
            {badge || (
              <Badge variant="secondary" size="sm">
                {badgeCount}
              </Badge>
            )}\n          </span>
        )}
        
        {/* Right icon */}
        {rightIcon && (
          <span className={tabStyles.rightIcon}>
            {rightIcon}
          </span>
        )}
        
        {/* Close button */}
        {closable && (
          <button
            className={tabStyles.closeButton}
            onClick={handleClose}
            aria-label={`Close ${children} tab`}
            tabIndex={-1}
          >
            <X size={14} />
          </button>
        )}
      </button>
    );
  }
);
```

### CSS Module Structure
```css
.base {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  transition: all 150ms ease;
  white-space: nowrap;
  position: relative;
}

.variant {
  &.default {
    border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  &.pills {
    border-radius: var(--border-radius-full);
    padding: var(--spacing-xs) var(--spacing-md);
  }
  
  &.underline {
    border-radius: 0;
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 2px solid transparent;
  }
  
  &.segment {
    border-radius: 0;
    padding: var(--spacing-xs) var(--spacing-md);
    border: 1px solid var(--color-border);
    margin-left: -1px;
  }
  
  &.segment:first-child {
    border-radius: var(--border-radius-md) 0 0 var(--border-radius-md);
    margin-left: 0;
  }
  
  &.segment:last-child {
    border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
  }
}

.size {
  &.sm {
    min-height: 28px;
    font-size: var(--font-size-sm);
  }
  
  &.md {
    min-height: 36px;
    font-size: var(--font-size-md);
  }
  
  &.lg {
    min-height: 44px;
    font-size: var(--font-size-lg);
  }
}

.content {
  flex: 1;
}

.leftIcon,
.rightIcon {
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
}

.badge {
  display: flex;
  align-items: center;
}

.closeButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  border-radius: var(--border-radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 150ms ease;
}

.closeButton:hover {
  background: var(--color-surface-secondary);
  color: var(--color-text-primary);
}

/* State styles */
.base:hover:not(.disabled):not(.selected) {
  background: var(--color-surface-secondary);
  color: var(--color-text-primary);
}

.selected {
  color: var(--color-primary);
  background: var(--color-surface);
}

.selected.variant-default {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-surface);
}

.selected.variant-pills {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}

.selected.variant-underline {
  border-bottom-color: var(--color-primary);
}

.selected.variant-segment {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border-color: var(--color-primary);
  z-index: 1;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.base:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

## Accessibility Features
- Proper ARIA roles and states
- Keyboard navigation support
- Screen reader friendly
- Focus management within tab sequence
- Proper labeling for close buttons

### ARIA Implementation
```typescript
const tabProps = {
  role: 'tab',
  'aria-selected': selected,
  'aria-disabled': disabled,
  'aria-controls': `tabpanel-${value}`,
  tabIndex: selected ? 0 : -1
};
```

## Dependencies
- React (forwardRef, ButtonHTMLAttributes)
- Internal Badge component
- Icon components (X for close button)
- CSS modules
- Utility functions (cn)

## Design Tokens Used
- **Colors**: text, background, border, primary colors
- **Spacing**: padding, gaps between elements
- **Border Radius**: tab rounding
- **Typography**: font sizes, weights
- **Transitions**: hover and state changes

## Testing Considerations
- Keyboard navigation between tabs
- Screen reader announcements
- Click and close functionality
- Badge display and counting
- Various size and variant combinations
- Disabled state behavior
- Focus management

## Related Components
- TabList (container component)
- TabPanel (content component)
- Badge (notification indicator)
- Button (similar interaction patterns)

## Common Use Cases
- Navigation between sections
- Document/file switching
- Settings categories
- Data filtering views
- Multi-step forms
- Dashboard panels
- Code editor tabs