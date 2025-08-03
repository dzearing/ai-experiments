# SegmentedControl

## Component Name and Description
SegmentedControl is an input primitive that provides a set of mutually exclusive options presented as connected segments, similar to radio buttons but with a tab-like appearance.

## Use Cases
- View mode selection (list/grid/chart)
- Filter categories
- Settings with limited options
- Navigation between related views
- Time period selection
- Sort order controls

## API/Props Interface

```typescript
interface SegmentedControlProps {
  /** Currently selected value */
  value?: string;
  
  /** Default selected value */
  defaultValue?: string;
  
  /** Available segments */
  segments: SegmentOption[];
  
  /** Control name for form submission */
  name?: string;
  
  /** Control size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Visual variant */
  variant?: 'default' | 'filled' | 'outlined';
  
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Full width segments */
  fullWidth?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Required selection */
  required?: boolean;
  
  /** Event handlers */
  onChange?: (value: string) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  
  /** ARIA attributes */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

interface SegmentOption {
  /** Segment value */
  value: string;
  
  /** Segment label */
  label: string;
  
  /** Optional icon */
  icon?: React.ReactNode;
  
  /** Optional description */
  description?: string;
  
  /** Disabled state for individual segment */
  disabled?: boolean;
  
  /** Badge or count */
  badge?: string | number;
  
  /** Custom content */
  content?: React.ReactNode;
}
```

## Sub-components

### SegmentedControl.Segment
Individual segment component with label, icon, and badge support.

### SegmentedControl.Indicator
Visual indicator that slides between selected segments.

## Usage Examples

### Basic Segmented Control
```html
<div class="segmented-control" 
     data-variant="default" 
     data-size="md"
     role="radiogroup"
     aria-label="View mode">
  
  <input type="radio" 
         id="view-list" 
         name="view-mode" 
         value="list"
         class="segment-input sr-only"
         checked>
  <label for="view-list" class="segment-label">
    <span class="segment-icon">📋</span>
    <span class="segment-text">List</span>
  </label>
  
  <input type="radio" 
         id="view-grid" 
         name="view-mode" 
         value="grid"
         class="segment-input sr-only">
  <label for="view-grid" class="segment-label">
    <span class="segment-icon">🔲</span>
    <span class="segment-text">Grid</span>
  </label>
  
  <input type="radio" 
         id="view-chart" 
         name="view-mode" 
         value="chart"
         class="segment-input sr-only">
  <label for="view-chart" class="segment-label">
    <span class="segment-icon">📊</span>
    <span class="segment-text">Chart</span>
  </label>
  
  <div class="segment-indicator" aria-hidden="true"></div>
</div>
```

### Time Period Selector
```html
<div class="segmented-control" 
     data-variant="filled" 
     data-size="sm"
     role="radiogroup"
     aria-label="Time period">
  
  <input type="radio" 
         id="period-day" 
         name="time-period" 
         value="day"
         class="segment-input sr-only">
  <label for="period-day" class="segment-label">
    <span class="segment-text">Day</span>
  </label>
  
  <input type="radio" 
         id="period-week" 
         name="time-period" 
         value="week"
         class="segment-input sr-only"
         checked>
  <label for="period-week" class="segment-label">
    <span class="segment-text">Week</span>
  </label>
  
  <input type="radio" 
         id="period-month" 
         name="time-period" 
         value="month"
         class="segment-input sr-only">
  <label for="period-month" class="segment-label">
    <span class="segment-text">Month</span>
  </label>
  
  <input type="radio" 
         id="period-year" 
         name="time-period" 
         value="year"
         class="segment-input sr-only">
  <label for="period-year" class="segment-label">
    <span class="segment-text">Year</span>
  </label>
  
  <div class="segment-indicator" aria-hidden="true"></div>
</div>
```

### Filter Control with Badges
```html
<div class="segmented-control" 
     data-variant="outlined" 
     data-size="md"
     role="radiogroup"
     aria-label="Filter tasks">
  
  <input type="radio" 
         id="filter-all" 
         name="task-filter" 
         value="all"
         class="segment-input sr-only"
         checked>
  <label for="filter-all" class="segment-label">
    <span class="segment-text">All</span>
    <span class="segment-badge">24</span>
  </label>
  
  <input type="radio" 
         id="filter-active" 
         name="task-filter" 
         value="active"
         class="segment-input sr-only">
  <label for="filter-active" class="segment-label">
    <span class="segment-text">Active</span>
    <span class="segment-badge">12</span>
  </label>
  
  <input type="radio" 
         id="filter-completed" 
         name="task-filter" 
         value="completed"
         class="segment-input sr-only">
  <label for="filter-completed" class="segment-label">
    <span class="segment-text">Completed</span>
    <span class="segment-badge">8</span>
  </label>
  
  <input type="radio" 
         id="filter-archived" 
         name="task-filter" 
         value="archived"
         class="segment-input sr-only">
  <label for="filter-archived" class="segment-label">
    <span class="segment-text">Archived</span>
    <span class="segment-badge">4</span>
  </label>
  
  <div class="segment-indicator" aria-hidden="true"></div>
</div>
```

### Vertical Segmented Control
```html
<div class="segmented-control" 
     data-variant="default" 
     data-orientation="vertical"
     data-size="md"
     role="radiogroup"
     aria-label="Navigation">
  
  <input type="radio" 
         id="nav-dashboard" 
         name="navigation" 
         value="dashboard"
         class="segment-input sr-only"
         checked>
  <label for="nav-dashboard" class="segment-label">
    <span class="segment-icon">🏠</span>
    <span class="segment-text">Dashboard</span>
  </label>
  
  <input type="radio" 
         id="nav-projects" 
         name="navigation" 
         value="projects"
         class="segment-input sr-only">
  <label for="nav-projects" class="segment-label">
    <span class="segment-icon">📂</span>
    <span class="segment-text">Projects</span>
  </label>
  
  <input type="radio" 
         id="nav-team" 
         name="navigation" 
         value="team"
         class="segment-input sr-only">
  <label for="nav-team" class="segment-label">
    <span class="segment-icon">👥</span>
    <span class="segment-text">Team</span>
  </label>
  
  <input type="radio" 
         id="nav-settings" 
         name="navigation" 
         value="settings"
         class="segment-input sr-only">
  <label for="nav-settings" class="segment-label">
    <span class="segment-icon">⚙️</span>
    <span class="segment-text">Settings</span>
  </label>
  
  <div class="segment-indicator" aria-hidden="true"></div>
</div>
```

### Full Width Control
```html
<div class="segmented-control" 
     data-variant="filled" 
     data-size="lg"
     data-full-width="true"
     role="radiogroup"
     aria-label="Account type">
  
  <input type="radio" 
         id="account-personal" 
         name="account-type" 
         value="personal"
         class="segment-input sr-only"
         checked>
  <label for="account-personal" class="segment-label">
    <span class="segment-text">Personal</span>
    <span class="segment-description">For individual use</span>
  </label>
  
  <input type="radio" 
         id="account-team" 
         name="account-type" 
         value="team"
         class="segment-input sr-only">
  <label for="account-team" class="segment-label">
    <span class="segment-text">Team</span>
    <span class="segment-description">For small teams</span>
  </label>
  
  <input type="radio" 
         id="account-enterprise" 
         name="account-type" 
         value="enterprise"
         class="segment-input sr-only">
  <label for="account-enterprise" class="segment-label">
    <span class="segment-text">Enterprise</span>
    <span class="segment-description">For large organizations</span>
  </label>
  
  <div class="segment-indicator" aria-hidden="true"></div>
</div>
```

### Disabled States
```html
<div class="segmented-control" 
     data-variant="outlined"
     role="radiogroup"
     aria-label="Sort order">
  
  <input type="radio" 
         id="sort-asc" 
         name="sort-order" 
         value="asc"
         class="segment-input sr-only"
         checked>
  <label for="sort-asc" class="segment-label">
    <span class="segment-text">Ascending</span>
  </label>
  
  <input type="radio" 
         id="sort-desc" 
         name="sort-order" 
         value="desc"
         class="segment-input sr-only">
  <label for="sort-desc" class="segment-label">
    <span class="segment-text">Descending</span>
  </label>
  
  <input type="radio" 
         id="sort-custom" 
         name="sort-order" 
         value="custom"
         class="segment-input sr-only"
         disabled>
  <label for="sort-custom" class="segment-label disabled">
    <span class="segment-text">Custom</span>
    <span class="segment-description">Coming soon</span>
  </label>
  
  <div class="segment-indicator" aria-hidden="true"></div>
</div>
```

## Accessibility Notes
- Use `role="radiogroup"` for the container and radio inputs for segments
- Provide clear group labels using `aria-label` or `aria-labelledby`
- Support keyboard navigation with arrow keys between segments
- Use Space or Enter to select a segment
- Ensure sufficient color contrast for all states including selected and focus
- Provide visual focus indicators for keyboard users
- Test with screen readers to verify proper state announcements
- Use semantic HTML with hidden radio inputs for form submission

## Performance Considerations
- Use CSS transforms for smooth indicator animations
- Implement proper event delegation for segment selection
- Cache segment configurations to avoid unnecessary re-renders
- Use CSS containment for complex segmented control layouts
- Minimize DOM updates by using CSS-only state changes
- Consider using intersection observer for visibility optimizations
- Use stable references for event handlers to prevent re-renders

## Related Components
- **RadioGroup**: For form-based radio selection
- **ToggleButton**: For multi-selection toggle buttons
- **Tabs**: For content panel navigation
- **ButtonGroup**: For action button grouping
- **Select**: For dropdown selection
- **Switch**: For binary on/off controls