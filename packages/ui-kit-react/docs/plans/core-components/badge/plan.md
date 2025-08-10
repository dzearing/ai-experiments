# Badge

## Component Name and Description
Badge is a display primitive that provides small labels for status, counts, categories, and notifications with various styles and positioning options.

## Use Cases
- Status indicators (online, offline, active)
- Notification counts and alerts
- Category and tag labels
- Version and feature flags
- Priority and importance markers
- User roles and permissions

## API/Props Interface

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge content */
  children?: React.ReactNode;
  
  /** Badge variant */
  variant?: 
    | 'solid'
    | 'outlined'
    | 'soft'
    | 'ghost'
    | 'dot';
  
  /** Color scheme */
  colorScheme?: 
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'neutral'
    | 'success'
    | 'warning'
    | 'error'
    | 'info';
  
  /** Badge size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  
  /** Badge shape */
  shape?: 'rounded' | 'pill' | 'square';
  
  /** Position when used as overlay */
  position?: 
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'inline';
  
  /** Numeric count for notification badges */
  count?: number;
  
  /** Maximum count to display before showing overflow */
  maxCount?: number;
  
  /** Show zero count */
  showZero?: boolean;
  
  /** Dot indicator without text */
  dot?: boolean;
  
  /** Pulsing animation for notifications */
  pulse?: boolean;
  
  /** Icon before or after text */
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  
  /** Removable badge with close button */
  removable?: boolean;
  onRemove?: () => void;
  
  /** Interactive badge (clickable) */
  interactive?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  
  /** Custom overflow indicator */
  overflowText?: string;
  
  /** Accessibility label */
  'aria-label'?: string;
}
```

## Sub-components

### Badge.Count
Specialized badge for displaying numeric counts.

### Badge.Dot
Simple dot indicator without text content.

### Badge.Status
Status indicator with predefined colors and states.

## Usage Examples

### Basic Badges
```html
<div class="badge-examples">
  <!-- Solid badges -->
  <span class="badge" 
        data-variant="solid" 
        data-color-scheme="primary" 
        data-size="md">
    New
  </span>
  
  <span class="badge" 
        data-variant="solid" 
        data-color-scheme="success" 
        data-size="md">
    Completed
  </span>
  
  <span class="badge" 
        data-variant="solid" 
        data-color-scheme="warning" 
        data-size="md">
    Pending
  </span>
  
  <span class="badge" 
        data-variant="solid" 
        data-color-scheme="error" 
        data-size="md">
    Failed
  </span>
</div>
```

### Badge Variants
```html
<div class="badge-variants">
  <!-- Outlined badges -->
  <span class="badge" 
        data-variant="outlined" 
        data-color-scheme="primary">
    Outlined
  </span>
  
  <!-- Soft badges -->
  <span class="badge" 
        data-variant="soft" 
        data-color-scheme="success">
    Soft
  </span>
  
  <!-- Ghost badges -->
  <span class="badge" 
        data-variant="ghost" 
        data-color-scheme="neutral">
    Ghost
  </span>
  
  <!-- Dot badges -->
  <span class="badge" 
        data-variant="dot" 
        data-color-scheme="error"
        aria-label="Active status">
  </span>
</div>
```

### Notification Badges
```html
<div class="notification-examples">
  <!-- Icon with count badge -->
  <div class="notification-icon">
    <svg class="icon" data-name="bell" aria-hidden="true">
      <use href="#icon-bell"></use>
    </svg>
    <span class="badge notification-badge" 
          data-variant="solid" 
          data-color-scheme="error"
          data-position="top-right"
          data-pulse="true">
      3
    </span>
  </div>
  
  <!-- Avatar with status dot -->
  <div class="avatar-with-status">
    <img class="avatar" src="user-avatar.jpg" alt="User name">
    <span class="badge status-dot" 
          data-variant="dot" 
          data-color-scheme="success"
          data-position="bottom-right"
          aria-label="Online">
    </span>
  </div>
  
  <!-- High count badge -->
  <div class="notification-icon">
    <svg class="icon" data-name="mail" aria-hidden="true">
      <use href="#icon-mail"></use>
    </svg>
    <span class="badge notification-badge" 
          data-variant="solid" 
          data-color-scheme="primary"
          data-position="top-right">
      99+
    </span>
  </div>
</div>
```

### Status Badges
```html
<div class="status-badges">
  <!-- User status -->
  <div class="user-item">
    <img class="user-avatar" src="user1.jpg" alt="John Doe">
    <span class="user-name">John Doe</span>
    <span class="badge" 
          data-variant="soft" 
          data-color-scheme="success" 
          data-size="sm">
      <span class="badge-icon">●</span>
      Online
    </span>
  </div>
  
  <!-- Task status -->
  <div class="task-item">
    <h4>Update documentation</h4>
    <span class="badge" 
          data-variant="outlined" 
          data-color-scheme="warning" 
          data-size="sm">
      In Progress
    </span>
  </div>
  
  <!-- Priority badge -->
  <div class="issue-item">
    <h4>Fix critical bug</h4>
    <span class="badge" 
          data-variant="solid" 
          data-color-scheme="error" 
          data-size="sm">
      High Priority
    </span>
  </div>
</div>
```

### Interactive and Removable Badges
```html
<div class="tag-list">
  <!-- Removable tags -->
  <span class="badge tag" 
        data-variant="soft" 
        data-color-scheme="neutral"
        data-removable="true">
    React
    <button class="badge-remove" 
            aria-label="Remove React tag"
            onclick="removeTag(this)">
      ×
    </button>
  </span>
  
  <span class="badge tag" 
        data-variant="soft" 
        data-color-scheme="neutral"
        data-removable="true">
    TypeScript
    <button class="badge-remove" 
            aria-label="Remove TypeScript tag"
            onclick="removeTag(this)">
      ×
    </button>
  </span>
  
  <!-- Clickable category badge -->
  <button class="badge interactive" 
          data-variant="outlined" 
          data-color-scheme="primary"
          onclick="filterByCategory('design')">
    Design
  </button>
</div>
```

### Badge Sizes and Shapes
```html
<div class="badge-sizes">
  <!-- Different sizes -->
  <span class="badge" 
        data-variant="solid" 
        data-color-scheme="primary" 
        data-size="xs">
    XS Badge
  </span>
  
  <span class="badge" 
        data-variant="solid" 
        data-color-scheme="primary" 
        data-size="sm">
    SM Badge
  </span>
  
  <span class="badge" 
        data-variant="solid" 
        data-color-scheme="primary" 
        data-size="md">
    MD Badge
  </span>
  
  <span class="badge" 
        data-variant="solid" 
        data-color-scheme="primary" 
        data-size="lg">
    LG Badge
  </span>
</div>

<div class="badge-shapes">
  <!-- Different shapes -->
  <span class="badge" 
        data-variant="solid" 
        data-shape="square">
    Square
  </span>
  
  <span class="badge" 
        data-variant="solid" 
        data-shape="rounded">
    Rounded
  </span>
  
  <span class="badge" 
        data-variant="solid" 
        data-shape="pill">
    Pill
  </span>
</div>
```

### Badge with Icons
```html
<div class="icon-badges">
  <!-- Badge with start icon -->
  <span class="badge" 
        data-variant="soft" 
        data-color-scheme="success">
    <svg class="badge-icon" data-name="check" aria-hidden="true">
      <use href="#icon-check"></use>
    </svg>
    Verified
  </span>
  
  <!-- Badge with end icon -->
  <span class="badge" 
        data-variant="outlined" 
        data-color-scheme="info">
    Beta
    <svg class="badge-icon" data-name="info" aria-hidden="true">
      <use href="#icon-info"></use>
    </svg>
  </span>
  
  <!-- Icon-only badge -->
  <span class="badge" 
        data-variant="solid" 
        data-color-scheme="warning"
        aria-label="Warning">
    <svg class="badge-icon" data-name="exclamation" aria-hidden="true">
      <use href="#icon-exclamation"></use>
    </svg>
  </span>
</div>
```

## Accessibility Notes
- Provide meaningful `aria-label` for badges without text content (like dots)
- Use semantic color meanings consistently (red for error, green for success)
- Ensure sufficient color contrast for all badge variants
- Make interactive badges keyboard accessible with proper focus indicators
- Use `role="status"` for dynamic status badges that update
- Provide alternative text for icon-only badges
- Test badge visibility with screen readers and high contrast modes
- Use appropriate ARIA attributes for notification badges

## Performance Considerations
- Use CSS-only implementations for simple badge styles
- Implement efficient badge positioning with CSS containment
- Cache badge configurations for repeated use
- Use CSS custom properties for theme-based badge colors
- Consider using CSS transforms for badge animations
- Minimize DOM nodes for simple text badges
- Use event delegation for interactive badge groups
- Optimize badge icons with sprite sheets or icon fonts

## Related Components
- **Chip**: For more complex removable tags
- **Pill**: Alternative styling for badge-like elements
- **Status**: Specialized status indicators
- **Tag**: Interactive tagging components
- **Notification**: Larger notification components
- **Avatar**: Often paired with status badges