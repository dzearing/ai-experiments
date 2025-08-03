# Chip

## Component Name and Description
Chip is a display primitive that provides compact elements for tags, filters, selections, and interactive labels with rich content support and actions.

## Use Cases
- Tags and labels with remove functionality
- Filter selections and categories
- Contact and user selections
- Attribute and property display
- Multi-select option display
- Contextual actions and choices

## API/Props Interface

```typescript
interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Chip content */
  children?: React.ReactNode;
  
  /** Chip variant */
  variant?: 
    | 'filled'
    | 'outlined'
    | 'soft'
    | 'ghost';
  
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
  
  /** Chip size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Chip shape */
  shape?: 'rounded' | 'pill' | 'square';
  
  /** Avatar or icon at start */
  avatar?: React.ReactNode;
  
  /** Icon at start */
  startIcon?: React.ReactNode;
  
  /** Icon at end */
  endIcon?: React.ReactNode;
  
  /** Removable chip with delete action */
  removable?: boolean;
  onRemove?: (event: React.MouseEvent) => void;
  
  /** Interactive/clickable chip */
  interactive?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  
  /** Selected state */
  selected?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Chip label text */
  label?: string;
  
  /** Additional description */
  description?: string;
  
  /** Badge or count */
  badge?: string | number;
  
  /** Custom remove icon */
  removeIcon?: React.ReactNode;
  
  /** Custom remove label for accessibility */
  removeLabel?: string;
  
  /** Keyboard navigation support */
  tabIndex?: number;
  
  /** ARIA attributes */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: 'button' | 'option' | 'listitem';
}
```

## Sub-components

### Chip.Avatar
Avatar component optimized for chip display.

### Chip.Icon
Icon component with proper sizing for chips.

### Chip.Badge
Badge component for counts or status within chips.

### Chip.Group
Container for managing multiple chips with selection states.

## Usage Examples

### Basic Chips
```html
<div class="chip-examples">
  <!-- Filled chips -->
  <div class="chip" 
       data-variant="filled" 
       data-color-scheme="primary" 
       data-size="md">
    <span class="chip-label">React</span>
  </div>
  
  <div class="chip" 
       data-variant="filled" 
       data-color-scheme="secondary" 
       data-size="md">
    <span class="chip-label">TypeScript</span>
  </div>
  
  <!-- Outlined chips -->
  <div class="chip" 
       data-variant="outlined" 
       data-color-scheme="neutral" 
       data-size="md">
    <span class="chip-label">JavaScript</span>
  </div>
</div>
```

### Removable Tags
```html
<div class="tag-chips">
  <div class="chip removable" 
       data-variant="soft" 
       data-color-scheme="primary">
    <span class="chip-label">Frontend</span>
    <button class="chip-remove" 
            aria-label="Remove Frontend tag"
            onclick="removeChip(this)">
      <svg class="remove-icon" data-name="x" aria-hidden="true">
        <use href="#icon-x"></use>
      </svg>
    </button>
  </div>
  
  <div class="chip removable" 
       data-variant="soft" 
       data-color-scheme="secondary">
    <span class="chip-label">Design System</span>
    <button class="chip-remove" 
            aria-label="Remove Design System tag"
            onclick="removeChip(this)">
      <svg class="remove-icon" data-name="x" aria-hidden="true">
        <use href="#icon-x"></use>
      </svg>
    </button>
  </div>
</div>
```

### Chips with Avatars and Icons
```html
<div class="contact-chips">
  <!-- User chip with avatar -->
  <div class="chip" 
       data-variant="outlined" 
       data-size="md">
    <img class="chip-avatar" 
         src="user1.jpg" 
         alt="John Doe">
    <span class="chip-label">John Doe</span>
    <button class="chip-remove" 
            aria-label="Remove John Doe"
            onclick="removeContact(this)">
      <svg class="remove-icon" data-name="x" aria-hidden="true">
        <use href="#icon-x"></use>
      </svg>
    </button>
  </div>
  
  <!-- Email chip with icon -->
  <div class="chip" 
       data-variant="soft" 
       data-color-scheme="info">
    <svg class="chip-start-icon" data-name="mail" aria-hidden="true">
      <use href="#icon-mail"></use>
    </svg>
    <span class="chip-label">john@example.com</span>
    <button class="chip-remove" 
            aria-label="Remove email"
            onclick="removeEmail(this)">
      <svg class="remove-icon" data-name="x" aria-hidden="true">
        <use href="#icon-x"></use>
      </svg>
    </button>
  </div>
</div>
```

### Filter Chips
```html
<div class="filter-chips" role="group" aria-label="Filter options">
  <button class="chip interactive selected" 
          data-variant="filled" 
          data-color-scheme="primary"
          aria-pressed="true"
          onclick="toggleFilter('all', this)">
    <span class="chip-label">All</span>
    <span class="chip-badge">24</span>
  </button>
  
  <button class="chip interactive" 
          data-variant="outlined" 
          data-color-scheme="neutral"
          aria-pressed="false"
          onclick="toggleFilter('active', this)">
    <span class="chip-label">Active</span>
    <span class="chip-badge">12</span>
  </button>
  
  <button class="chip interactive" 
          data-variant="outlined" 
          data-color-scheme="neutral"
          aria-pressed="false"
          onclick="toggleFilter('completed', this)">
    <span class="chip-label">Completed</span>
    <span class="chip-badge">8</span>
  </button>
  
  <button class="chip interactive" 
          data-variant="outlined" 
          data-color-scheme="neutral"
          aria-pressed="false"
          onclick="toggleFilter('archived', this)">
    <span class="chip-label">Archived</span>
    <span class="chip-badge">4</span>
  </button>
</div>
```

### Status and Category Chips
```html
<div class="status-chips">
  <!-- Priority chip -->
  <div class="chip" 
       data-variant="filled" 
       data-color-scheme="error" 
       data-size="sm">
    <svg class="chip-start-icon" data-name="exclamation" aria-hidden="true">
      <use href="#icon-exclamation"></use>
    </svg>
    <span class="chip-label">High Priority</span>
  </div>
  
  <!-- Status chip -->
  <div class="chip" 
       data-variant="soft" 
       data-color-scheme="success" 
       data-size="sm">
    <div class="chip-status-dot" aria-hidden="true"></div>
    <span class="chip-label">Verified</span>
  </div>
  
  <!-- Category chip -->
  <div class="chip" 
       data-variant="outlined" 
       data-color-scheme="info" 
       data-size="sm">
    <span class="chip-label">Documentation</span>
    <svg class="chip-end-icon" data-name="external-link" aria-hidden="true">
      <use href="#icon-external-link"></use>
    </svg>
  </div>
</div>
```

### Multi-Select Chips
```html
<div class="skills-selector">
  <h3>Select your skills</h3>
  <div class="chip-group multi-select" role="listbox" aria-multiselectable="true">
    <button class="chip interactive selected" 
            data-variant="filled" 
            data-color-scheme="primary"
            role="option"
            aria-selected="true"
            onclick="toggleSkill('react', this)">
      <span class="chip-label">React</span>
      <svg class="chip-end-icon" data-name="check" aria-hidden="true">
        <use href="#icon-check"></use>
      </svg>
    </button>
    
    <button class="chip interactive" 
            data-variant="outlined" 
            data-color-scheme="neutral"
            role="option"
            aria-selected="false"
            onclick="toggleSkill('vue', this)">
      <span class="chip-label">Vue.js</span>
    </button>
    
    <button class="chip interactive selected" 
            data-variant="filled" 
            data-color-scheme="primary"
            role="option"
            aria-selected="true"
            onclick="toggleSkill('typescript', this)">
      <span class="chip-label">TypeScript</span>
      <svg class="chip-end-icon" data-name="check" aria-hidden="true">
        <use href="#icon-check"></use>
      </svg>
    </button>
    
    <button class="chip interactive" 
            data-variant="outlined" 
            data-color-scheme="neutral"
            role="option"
            aria-selected="false"
            onclick="toggleSkill('node', this)">
      <span class="chip-label">Node.js</span>
    </button>
  </div>
</div>
```

### Loading and Disabled States
```html
<div class="chip-states">
  <!-- Loading chip -->
  <div class="chip loading" 
       data-variant="outlined" 
       data-disabled="true">
    <div class="chip-loading-spinner"></div>
    <span class="chip-label">Saving...</span>
  </div>
  
  <!-- Disabled chip -->
  <div class="chip" 
       data-variant="outlined" 
       data-disabled="true">
    <span class="chip-label">Unavailable</span>
  </div>
  
  <!-- Disabled removable chip -->
  <div class="chip removable" 
       data-variant="soft" 
       data-disabled="true">
    <span class="chip-label">Protected Tag</span>
    <button class="chip-remove" 
            disabled
            aria-label="Cannot remove protected tag">
      <svg class="remove-icon" data-name="lock" aria-hidden="true">
        <use href="#icon-lock"></use>
      </svg>
    </button>
  </div>
</div>
```

### Chip Sizes and Shapes
```html
<div class="chip-variations">
  <!-- Different sizes -->
  <div class="chip" data-variant="filled" data-size="sm">
    <span class="chip-label">Small</span>
  </div>
  
  <div class="chip" data-variant="filled" data-size="md">
    <span class="chip-label">Medium</span>
  </div>
  
  <div class="chip" data-variant="filled" data-size="lg">
    <span class="chip-label">Large</span>
  </div>
  
  <!-- Different shapes -->
  <div class="chip" data-variant="outlined" data-shape="square">
    <span class="chip-label">Square</span>
  </div>
  
  <div class="chip" data-variant="outlined" data-shape="rounded">
    <span class="chip-label">Rounded</span>
  </div>
  
  <div class="chip" data-variant="outlined" data-shape="pill">
    <span class="chip-label">Pill</span>
  </div>
</div>
```

## Accessibility Notes
- Use semantic roles (`button`, `option`, `listitem`) based on chip purpose
- Provide clear labels for remove actions with `aria-label`
- Support keyboard navigation with Tab and arrow keys for chip groups
- Use `aria-pressed` for toggle chips and `aria-selected` for selection chips
- Ensure sufficient color contrast for all chip variants and states
- Provide focus indicators for interactive and removable chips
- Use `aria-describedby` to link chips with additional context
- Test chip interactions with screen readers and keyboard-only users

## Performance Considerations
- Use CSS-only styling for simple chip variations
- Implement efficient chip removal with proper state management
- Cache chip configurations for repeated rendering
- Use event delegation for large chip groups
- Consider virtualization for very large chip lists
- Minimize DOM updates when adding/removing chips
- Use CSS containment for complex chip layouts
- Optimize chip icons with efficient rendering strategies

## Related Components
- **Badge**: Simpler status and count indicators
- **Tag**: Alternative styling for chip-like elements
- **Button**: For interactive chip functionality
- **Avatar**: Often used within contact chips
- **MultiSelect**: For form-based multiple selection
- **FilterBar**: For organizing filter chips