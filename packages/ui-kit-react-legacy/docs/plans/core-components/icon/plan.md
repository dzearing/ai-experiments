# Icon

## Component Name and Description
Icon is a display primitive that provides consistent iconography with size variants, color options, and accessibility features for displaying vector icons throughout the interface.

## Use Cases
- UI navigation and actions
- Status and state indicators
- Button and input decorations
- Data visualization elements
- Content illustrations
- Interactive element affordances

## API/Props Interface

```typescript
interface IconProps extends React.SVGProps<SVGSVGElement> {
  /** Icon name or symbol */
  name?: string;
  
  /** Custom icon element */
  children?: React.ReactNode;
  
  /** Icon size variants */
  size?: ResponsiveValue<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'> | number | string;
  
  /** Icon color */
  color?: ResponsiveValue<ColorToken>;
  
  /** Icon weight/stroke width */
  weight?: 'thin' | 'light' | 'regular' | 'medium' | 'bold';
  
  /** Icon style variant */
  variant?: 'solid' | 'outlined' | 'duotone' | 'light';
  
  /** Rotation angle */
  rotate?: 0 | 90 | 180 | 270;
  
  /** Flip horizontally */
  flipX?: boolean;
  
  /** Flip vertically */
  flipY?: boolean;
  
  /** Animation type */
  animation?: 'none' | 'spin' | 'pulse' | 'bounce' | 'fade';
  
  /** Animation duration */
  animationDuration?: string;
  
  /** Decorative icon (no semantic meaning) */
  decorative?: boolean;
  
  /** Accessible label for screen readers */
  label?: string;
  
  /** Custom viewBox */
  viewBox?: string;
  
  /** Inline display */
  inline?: boolean;
  
  /** Icon source */
  src?: string;
  
  /** Icon library/family */
  library?: 'heroicons' | 'phosphor' | 'feather' | 'material' | 'custom';
}

type ColorToken = 
  | 'inherit'
  | 'current'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'muted'
  | 'subtle'
  | 'error'
  | 'warning'
  | 'success'
  | 'info';

// Predefined icon sizes
type IconSizes = {
  xs: '12px';
  sm: '16px';
  md: '20px';
  lg: '24px';
  xl: '32px';
  '2xl': '40px';
  '3xl': '48px';
};
```

## Sub-components
None - Icon is a primitive component.

## Usage Examples

### Basic Icons
```html
<div class="icon-examples">
  <!-- Named icon -->
  <svg class="icon" 
       data-name="home"
       data-size="md" 
       data-color="neutral"
       aria-hidden="true">
    <use href="#icon-home"></use>
  </svg>
  
  <!-- Icon with label -->
  <svg class="icon" 
       data-name="search"
       data-size="sm" 
       data-color="muted"
       aria-label="Search">
    <use href="#icon-search"></use>
  </svg>
  
  <!-- Custom color icon -->
  <svg class="icon" 
       data-name="star"
       data-size="lg" 
       data-color="warning"
       aria-hidden="true">
    <use href="#icon-star"></use>
  </svg>
</div>
```

### Button Icons
```html
<div class="button-icons">
  <!-- Primary action button -->
  <button class="button primary">
    <svg class="icon" 
         data-name="plus"
         data-size="sm" 
         data-color="inherit"
         aria-hidden="true">
      <use href="#icon-plus"></use>
    </svg>
    <span>Add Item</span>
  </button>
  
  <!-- Icon-only button -->
  <button class="button ghost icon-only" aria-label="Settings">
    <svg class="icon" 
         data-name="cog"
         data-size="md" 
         data-color="neutral"
         aria-hidden="true">
      <use href="#icon-cog"></use>
    </svg>
  </button>
  
  <!-- Loading button -->
  <button class="button" disabled>
    <svg class="icon" 
         data-name="loading"
         data-size="sm" 
         data-animation="spin"
         aria-hidden="true">
      <use href="#icon-loading"></use>
    </svg>
    <span>Loading...</span>
  </button>
</div>
```

### Status and State Icons
```html
<div class="status-indicators">
  <!-- Success state -->
  <div class="status-item">
    <svg class="icon" 
         data-name="check-circle"
         data-size="md" 
         data-color="success"
         aria-hidden="true">
      <use href="#icon-check-circle"></use>
    </svg>
    <span>Task completed</span>
  </div>
  
  <!-- Error state -->
  <div class="status-item">
    <svg class="icon" 
         data-name="x-circle"
         data-size="md" 
         data-color="error"
         aria-hidden="true">
      <use href="#icon-x-circle"></use>
    </svg>
    <span>Task failed</span>
  </div>
  
  <!-- Warning state -->
  <div class="status-item">
    <svg class="icon" 
         data-name="exclamation-triangle"
         data-size="md" 
         data-color="warning"
         aria-hidden="true">
      <use href="#icon-exclamation-triangle"></use>
    </svg>
    <span>Action required</span>
  </div>
  
  <!-- Info state -->
  <div class="status-item">
    <svg class="icon" 
         data-name="info-circle"
         data-size="md" 
         data-color="info"
         aria-hidden="true">
      <use href="#icon-info-circle"></use>
    </svg>
    <span>Additional information</span>
  </div>
</div>
```

### Responsive and Transformed Icons
```html
<div class="transformed-icons">
  <!-- Responsive size -->
  <svg class="icon" 
       data-name="arrow-right"
       data-size="sm"
       data-size-md="md"
       data-size-lg="lg"
       aria-hidden="true">
    <use href="#icon-arrow-right"></use>
  </svg>
  
  <!-- Rotated icon -->
  <svg class="icon" 
       data-name="arrow-up"
       data-size="md" 
       data-rotate="90"
       aria-hidden="true">
    <use href="#icon-arrow-up"></use>
  </svg>
  
  <!-- Flipped icon -->
  <svg class="icon" 
       data-name="chevron-left"
       data-size="md" 
       data-flip-x="true"
       aria-hidden="true">
    <use href="#icon-chevron-left"></use>
  </svg>
</div>
```

### Animated Icons
```html
<div class="animated-icons">
  <!-- Spinning loader -->
  <svg class="icon" 
       data-name="spinner"
       data-size="lg" 
       data-animation="spin"
       data-animation-duration="1s"
       aria-label="Loading">
    <use href="#icon-spinner"></use>
  </svg>
  
  <!-- Pulsing heart -->
  <svg class="icon" 
       data-name="heart"
       data-size="md" 
       data-color="error"
       data-animation="pulse"
       aria-hidden="true">
    <use href="#icon-heart"></use>
  </svg>
  
  <!-- Bouncing notification -->
  <svg class="icon" 
       data-name="bell"
       data-size="md" 
       data-animation="bounce"
       aria-label="New notification">
    <use href="#icon-bell"></use>
  </svg>
</div>
```

### Icon Lists and Navigation
```html
<nav class="navigation">
  <ul class="nav-list">
    <li class="nav-item">
      <a href="/dashboard" class="nav-link">
        <svg class="icon" 
             data-name="home"
             data-size="sm" 
             aria-hidden="true">
          <use href="#icon-home"></use>
        </svg>
        <span>Dashboard</span>
      </a>
    </li>
    
    <li class="nav-item">
      <a href="/projects" class="nav-link">
        <svg class="icon" 
             data-name="folder"
             data-size="sm" 
             aria-hidden="true">
          <use href="#icon-folder"></use>
        </svg>
        <span>Projects</span>
      </a>
    </li>
    
    <li class="nav-item">
      <a href="/team" class="nav-link">
        <svg class="icon" 
             data-name="users"
             data-size="sm" 
             aria-hidden="true">
          <use href="#icon-users"></use>
        </svg>
        <span>Team</span>
      </a>
    </li>
  </ul>
</nav>
```

### Custom and Inline Icons
```html
<div class="custom-icons">
  <!-- Inline icon in text -->
  <p>
    Check your 
    <svg class="icon inline" 
         data-name="mail"
         data-size="sm" 
         data-color="primary"
         aria-hidden="true">
      <use href="#icon-mail"></use>
    </svg>
    email for updates.
  </p>
  
  <!-- Custom SVG icon -->
  <svg class="icon custom" 
       data-size="lg" 
       data-color="accent"
       viewBox="0 0 24 24"
       aria-label="Custom logo">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
</div>
```

## Accessibility Notes
- Use `aria-hidden="true"` for decorative icons that don't convey meaning
- Provide `aria-label` for icons that convey important information
- Ensure sufficient color contrast for icon colors
- Use semantic icons that match their purpose (e.g., trash for delete)
- Consider providing alternative text or tooltips for complex icons
- Test icon recognition with users who have cognitive disabilities
- Use consistent iconography throughout the application
- Ensure icons are visible at high contrast and zoom levels

## Performance Considerations
- Use SVG sprite sheets for icon libraries to reduce HTTP requests
- Implement icon tree-shaking to include only used icons
- Cache icon definitions in browser storage when appropriate
- Use CSS transforms for icon animations instead of JavaScript
- Consider using icon fonts for simple monochrome icons
- Optimize SVG files by removing unnecessary attributes and paths
- Use system icons when available for better performance
- Implement lazy loading for large icon sets

## Related Components
- **Button**: Often contains icons for actions
- **Badge**: May include status icons
- **Alert**: Uses icons for different message types
- **Loading**: Animated icons for loading states
- **Avatar**: May use icon fallbacks
- **Tooltip**: Can be triggered by info icons