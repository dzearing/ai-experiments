# ToggleButton

## Component Name and Description
ToggleButton is an input primitive that provides a pressable button that maintains a pressed/unpressed state, useful for binary choices and toolbar controls.

## Use Cases
- Toolbar and editor controls
- Binary settings toggles
- Filter activation buttons
- Feature enable/disable controls
- Multi-select button groups
- Formatting controls

## API/Props Interface

```typescript
interface ToggleButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Whether the button is pressed/active */
  pressed?: boolean;
  
  /** Default pressed state */
  defaultPressed?: boolean;
  
  /** Button variant */
  variant?: 'default' | 'outlined' | 'ghost' | 'solid';
  
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Button color scheme */
  colorScheme?: 'default' | 'primary' | 'secondary' | 'accent' | 'neutral';
  
  /** Icon for the button */
  icon?: React.ReactNode;
  
  /** Icon position when both icon and children are present */
  iconPosition?: 'start' | 'end';
  
  /** Loading state */
  loading?: boolean;
  
  /** Loading spinner */
  loadingText?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Event handlers */
  onPressedChange?: (pressed: boolean) => void;
  
  /** ARIA attributes */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  
  /** Group context */
  group?: {
    exclusive?: boolean;
    value?: string;
    name?: string;
  };
}

interface ToggleButtonGroupProps {
  /** Group type */
  type?: 'single' | 'multiple';
  
  /** Selected value(s) */
  value?: string | string[];
  
  /** Default selected value(s) */
  defaultValue?: string | string[];
  
  /** Group orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Whether selection is required */
  required?: boolean;
  
  /** Disabled state for entire group */
  disabled?: boolean;
  
  /** Event handlers */
  onValueChange?: (value: string | string[]) => void;
  
  /** ARIA attributes */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}
```

## Sub-components

### ToggleButton.Group
A container for managing multiple toggle buttons with single or multiple selection.

### ToggleButton.Icon
Icon component optimized for toggle buttons.

## Usage Examples

### Basic Toggle Button
```html
<button class="toggle-button" 
        data-variant="outlined" 
        data-size="md"
        aria-pressed="false"
        type="button">
  <span class="toggle-icon">🔗</span>
  <span class="toggle-text">Link</span>
</button>

<button class="toggle-button" 
        data-variant="outlined" 
        data-size="md"
        data-pressed="true"
        aria-pressed="true"
        type="button">
  <span class="toggle-icon">B</span>
  <span class="toggle-text">Bold</span>
</button>
```

### Text Formatting Toolbar
```html
<div class="toggle-button-group" 
     data-type="multiple" 
     data-orientation="horizontal"
     role="toolbar"
     aria-label="Text formatting">
  
  <button class="toggle-button" 
          data-variant="ghost"
          aria-pressed="false"
          type="button">
    <span class="toggle-icon">B</span>
    <span class="sr-only">Bold</span>
  </button>
  
  <button class="toggle-button" 
          data-variant="ghost"
          data-pressed="true"
          aria-pressed="true"
          type="button">
    <span class="toggle-icon">I</span>
    <span class="sr-only">Italic</span>
  </button>
  
  <button class="toggle-button" 
          data-variant="ghost"
          aria-pressed="false"
          type="button">
    <span class="toggle-icon">U</span>
    <span class="sr-only">Underline</span>
  </button>
  
  <div class="toolbar-separator"></div>
  
  <button class="toggle-button" 
          data-variant="ghost"
          aria-pressed="false"
          type="button">
    <span class="toggle-icon">⬅️</span>
    <span class="sr-only">Align left</span>
  </button>
  
  <button class="toggle-button" 
          data-variant="ghost"
          aria-pressed="true"
          type="button">
    <span class="toggle-icon">⬌</span>
    <span class="sr-only">Align center</span>
  </button>
  
  <button class="toggle-button" 
          data-variant="ghost"
          aria-pressed="false"
          type="button">
    <span class="toggle-icon">➡️</span>
    <span class="sr-only">Align right</span>
  </button>
</div>
```

### Single Selection Group
```html
<div class="toggle-button-group" 
     data-type="single" 
     data-orientation="horizontal"
     role="radiogroup"
     aria-label="View mode">
  
  <button class="toggle-button" 
          data-variant="outlined"
          data-pressed="true"
          role="radio"
          aria-checked="true"
          type="button">
    <span class="toggle-icon">📋</span>
    <span class="toggle-text">List</span>
  </button>
  
  <button class="toggle-button" 
          data-variant="outlined"
          role="radio"
          aria-checked="false"
          type="button">
    <span class="toggle-icon">🔲</span>
    <span class="toggle-text">Grid</span>
  </button>
  
  <button class="toggle-button" 
          data-variant="outlined"
          role="radio"
          aria-checked="false"
          type="button">
    <span class="toggle-icon">📊</span>
    <span class="toggle-text">Chart</span>
  </button>
</div>
```

### Filter Toggle Buttons
```html
<div class="filter-controls">
  <h3>Filter by Status</h3>
  <div class="toggle-button-group" 
       data-type="multiple" 
       data-orientation="horizontal">
    
    <button class="toggle-button" 
            data-variant="outlined"
            data-color-scheme="neutral"
            aria-pressed="true"
            type="button">
      <span class="status-indicator active"></span>
      <span class="toggle-text">Active</span>
      <span class="toggle-count">12</span>
    </button>
    
    <button class="toggle-button" 
            data-variant="outlined"
            data-color-scheme="neutral"
            aria-pressed="false"
            type="button">
      <span class="status-indicator pending"></span>
      <span class="toggle-text">Pending</span>
      <span class="toggle-count">5</span>
    </button>
    
    <button class="toggle-button" 
            data-variant="outlined"
            data-color-scheme="neutral"
            aria-pressed="true"
            type="button">
      <span class="status-indicator completed"></span>
      <span class="toggle-text">Completed</span>
      <span class="toggle-count">8</span>
    </button>
  </div>
</div>
```

### Loading and Disabled States
```html
<div class="toggle-button-examples">
  <!-- Loading state -->
  <button class="toggle-button" 
          data-variant="solid"
          data-loading="true"
          disabled
          type="button">
    <span class="loading-spinner"></span>
    <span class="toggle-text">Saving...</span>
  </button>
  
  <!-- Disabled state -->
  <button class="toggle-button" 
          data-variant="outlined"
          disabled
          type="button">
    <span class="toggle-icon">🔒</span>
    <span class="toggle-text">Locked</span>
  </button>
  
  <!-- Pressed and disabled -->
  <button class="toggle-button" 
          data-variant="outlined"
          data-pressed="true"
          disabled
          aria-pressed="true"
          type="button">
    <span class="toggle-icon">✓</span>
    <span class="toggle-text">Selected</span>
  </button>
</div>
```

### Icon-Only Toggle Buttons
```html
<div class="icon-toggle-group">
  <button class="toggle-button icon-only" 
          data-variant="ghost"
          data-size="sm"
          aria-label="Favorite"
          aria-pressed="false"
          type="button">
    <span class="toggle-icon">♡</span>
  </button>
  
  <button class="toggle-button icon-only" 
          data-variant="ghost"
          data-size="sm"
          data-pressed="true"
          aria-label="Bookmarked"
          aria-pressed="true"
          type="button">
    <span class="toggle-icon">🔖</span>
  </button>
  
  <button class="toggle-button icon-only" 
          data-variant="ghost"
          data-size="sm"
          aria-label="Share"
          aria-pressed="false"
          type="button">
    <span class="toggle-icon">📤</span>
  </button>
</div>
```

## Accessibility Notes
- Use `aria-pressed` to indicate the current pressed state
- For single-selection groups, use `role="radiogroup"` and `role="radio"`
- For multi-selection groups, use `role="toolbar"` or individual button roles
- Provide clear labels using `aria-label` or `aria-labelledby`
- Support keyboard navigation with Tab and arrow keys
- Use Space or Enter to toggle button state
- Ensure sufficient color contrast for all states
- Provide visual focus indicators
- Test with screen readers to verify state announcements

## Performance Considerations
- Use CSS-only styling for visual state changes when possible
- Implement proper event delegation for button groups
- Cache button state to avoid unnecessary re-renders
- Use stable references for event handlers
- Consider virtualization for very large button groups
- Minimize DOM updates by batching state changes
- Use CSS containment for complex button layouts

## Related Components
- **Button**: For non-toggle button actions
- **Switch**: For binary on/off controls
- **Checkbox**: For multi-selection in forms
- **RadioGroup**: For single selection in forms
- **SegmentedControl**: For tab-like selection
- **Toolbar**: For grouping action buttons