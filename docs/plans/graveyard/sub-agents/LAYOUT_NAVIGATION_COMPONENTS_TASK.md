# Sub-Agent Task: Layout & Navigation Specialist

## Objective
Design comprehensive layout and navigation components that provide flexible, responsive, and accessible patterns for application structure. Focus on creating a cohesive system for page layouts, navigation patterns, and modal/overlay behaviors.

## Assigned Components (High Priority: 12, Medium Priority: 8)

### High Priority Components
1. Container
2. Grid
3. Flexbox
4. Divider
5. Modal
6. Drawer
7. Popover
8. Tooltip
9. ConfirmDialog
10. Breadcrumb
11. TabNavigation
12. Stack (enhance existing)

### Medium Priority Components
1. Spacer
2. AspectRatio
3. Center
4. Sticky
5. VerticalTabs
6. StepIndicator
7. NavigationRail
8. ContextMenu

## Layout System Architecture

### 1. Container Component
```typescript
interface ContainerProps {
  // Width constraints
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string;
  fluid?: boolean;
  
  // Spacing
  padding?: ResponsiveValue<SpaceToken>;
  margin?: ResponsiveValue<SpaceToken>;
  
  // Display
  as?: keyof JSX.IntrinsicElements;
  center?: boolean;
  
  // Style
  background?: ColorToken;
  border?: boolean;
  borderRadius?: RadiusToken;
  shadow?: ShadowToken;
  
  // Layout
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
}

type ResponsiveValue<T> = T | { sm?: T; md?: T; lg?: T; xl?: T };
```

### 2. Grid System Specification
```typescript
interface GridProps {
  // Grid definition
  columns?: ResponsiveValue<number | string>;
  rows?: ResponsiveValue<number | string>;
  
  // Spacing
  gap?: ResponsiveValue<SpaceToken>;
  columnGap?: ResponsiveValue<SpaceToken>;
  rowGap?: ResponsiveValue<SpaceToken>;
  
  // Alignment
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
  placeItems?: string;
  
  // Auto flow
  autoFlow?: 'row' | 'column' | 'dense';
  autoColumns?: string;
  autoRows?: string;
  
  // Areas (advanced)
  areas?: string[];
  
  // Responsive
  breakpoints?: BreakpointConfig;
}
```

### HTML Mockup: Responsive Grid Layout
```html
<!-- Grid - Responsive Layout Example -->
<div class="container container--xl">
  <div class="grid grid--responsive">
    <!-- Main content area -->
    <div class="grid__item grid__item--main">
      <article class="content">
        <h1>Main Content</h1>
        <p>This area spans 8 columns on desktop, full width on mobile</p>
      </article>
    </div>
    
    <!-- Sidebar -->
    <aside class="grid__item grid__item--sidebar">
      <div class="sidebar">
        <h2>Sidebar</h2>
        <p>4 columns on desktop, hidden on mobile</p>
      </div>
    </aside>
  </div>
</div>

<style>
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

.container--xl {
  max-width: 1280px;
}

.grid {
  display: grid;
  gap: var(--spacing-lg);
}

.grid--responsive {
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid--responsive {
    grid-template-columns: repeat(12, 1fr);
  }
  
  .grid__item--main {
    grid-column: span 8;
  }
  
  .grid__item--sidebar {
    grid-column: span 4;
  }
}

@media (max-width: 767px) {
  .grid__item--sidebar {
    display: none;
  }
}
</style>
```

## Modal System Architecture

### 1. Modal Component Specification
```typescript
interface ModalProps {
  // Control
  open: boolean;
  onClose: () => void;
  
  // Content
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  
  // Behavior
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  preventScroll?: boolean;
  
  // Appearance
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  scrollBehavior?: 'inside' | 'outside';
  
  // Animation
  animation?: 'fade' | 'scale' | 'slide';
  animationDuration?: number;
  
  // Accessibility
  role?: 'dialog' | 'alertdialog';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  
  // Advanced
  portal?: boolean;
  portalTarget?: HTMLElement;
  zIndex?: number;
}
```

### 2. Modal HTML Mockup
```html
<!-- Modal - Open State -->
<div class="modal-root" data-state="open">
  <!-- Backdrop -->
  <div 
    class="modal__backdrop" 
    aria-hidden="true"
    data-state="visible"
  ></div>
  
  <!-- Modal Container -->
  <div 
    class="modal__container"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
  >
    <div class="modal modal--md" data-state="open">
      <!-- Header -->
      <div class="modal__header">
        <h2 id="modal-title" class="modal__title">
          Confirm Action
        </h2>
        <button 
          class="modal__close"
          aria-label="Close dialog"
          type="button"
        >
          <svg><!-- close icon --></svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="modal__content" id="modal-description">
        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
      </div>
      
      <!-- Footer -->
      <div class="modal__footer">
        <button class="button button--secondary">
          Cancel
        </button>
        <button class="button button--danger">
          Delete
        </button>
      </div>
    </div>
  </div>
</div>

<style>
.modal-root {
  position: fixed;
  inset: 0;
  z-index: var(--z-index-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.modal__backdrop[data-state="visible"] {
  opacity: 1;
}

.modal {
  background: var(--color-surface-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-height: calc(100vh - 2 * var(--spacing-md));
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  opacity: 0;
  transition: all 0.2s ease;
}

.modal[data-state="open"] {
  transform: scale(1);
  opacity: 1;
}

.modal--md {
  width: 100%;
  max-width: 500px;
}

/* Focus trap styles */
.modal:focus {
  outline: none;
}

.modal__close:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
```

## Navigation Components

### 1. Breadcrumb Specification
```typescript
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
  
  // Behavior
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
  
  // Styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'arrows';
  
  // Render props
  renderItem?: (item: BreadcrumbItem) => React.ReactNode;
  renderCollapsed?: (items: BreadcrumbItem[]) => React.ReactNode;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  current?: boolean;
}
```

### 2. TabNavigation Mockup
```html
<!-- TabNavigation - With Overflow -->
<div class="tab-navigation" role="tablist">
  <button class="tab-navigation__scroll-button" aria-label="Scroll left">
    <svg><!-- chevron left --></svg>
  </button>
  
  <div class="tab-navigation__wrapper">
    <div class="tab-navigation__list">
      <button 
        role="tab"
        aria-selected="true"
        aria-controls="panel-1"
        class="tab tab--active"
      >
        Overview
      </button>
      <button 
        role="tab"
        aria-selected="false"
        aria-controls="panel-2"
        class="tab"
      >
        Analytics
      </button>
      <button 
        role="tab"
        aria-selected="false"
        aria-controls="panel-3"
        class="tab"
      >
        Settings
      </button>
      <!-- More tabs... -->
    </div>
    
    <!-- Active indicator -->
    <div 
      class="tab-navigation__indicator"
      style="transform: translateX(0px); width: 80px;"
    ></div>
  </div>
  
  <button class="tab-navigation__scroll-button" aria-label="Scroll right">
    <svg><!-- chevron right --></svg>
  </button>
  
  <!-- Dropdown for overflow items -->
  <div class="tab-navigation__more">
    <button class="tab-navigation__more-button" aria-label="More tabs">
      More (3)
    </button>
  </div>
</div>

<!-- Tab panels -->
<div id="panel-1" role="tabpanel" aria-labelledby="tab-1">
  <!-- Content -->
</div>
```

### 3. Drawer Component Specification
```typescript
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  
  // Position
  placement?: 'left' | 'right' | 'top' | 'bottom';
  
  // Size
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  
  // Behavior
  modal?: boolean; // overlay backdrop
  persistent?: boolean; // stays open
  temporary?: boolean; // closes on route change
  
  // Animation
  animation?: 'slide' | 'push';
  animationDuration?: number;
  
  // Content
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

## Popover & Tooltip System

### 1. Unified Positioning Engine
```typescript
interface PositionConfig {
  placement: Placement;
  offset?: number;
  flip?: boolean;
  preventOverflow?: boolean;
  arrow?: boolean;
  boundary?: 'viewport' | 'scrollParent' | HTMLElement;
}

type Placement = 
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';
```

### 2. Tooltip Mockup
```html
<!-- Tooltip - Visible State -->
<div class="tooltip-trigger-wrapper">
  <button 
    class="button"
    aria-describedby="tooltip-1"
  >
    Hover me
  </button>
  
  <div 
    id="tooltip-1"
    role="tooltip"
    class="tooltip tooltip--top"
    style="--tooltip-x: 50px; --tooltip-y: -40px;"
  >
    <div class="tooltip__content">
      This is helpful information
    </div>
    <div class="tooltip__arrow"></div>
  </div>
</div>

<style>
.tooltip {
  position: absolute;
  z-index: var(--z-index-tooltip);
  pointer-events: none;
  transform: translate(var(--tooltip-x), var(--tooltip-y));
  opacity: 0;
  transition: opacity 0.15s ease;
}

.tooltip[data-state="visible"] {
  opacity: 1;
}

.tooltip__content {
  background: var(--color-surface-inverted);
  color: var(--color-text-inverted);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  max-width: 250px;
}

.tooltip__arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--color-surface-inverted);
  transform: rotate(45deg);
}

.tooltip--top .tooltip__arrow {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
}
</style>
```

## Responsive Patterns

### Breakpoint System
```typescript
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Utility hook
const useBreakpoint = (breakpoint: keyof typeof breakpoints) => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const query = `(min-width: ${breakpoints[breakpoint]})`;
    const media = window.matchMedia(query);
    
    setMatches(media.matches);
    
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [breakpoint]);
  
  return matches;
};
```

## Success Criteria
1. All layout components support responsive design
2. Modal system handles focus management properly
3. Navigation components are fully keyboard accessible
4. Popovers/tooltips position correctly in all scenarios
5. Drawer supports all edge positions
6. Container system provides consistent spacing
7. Grid system works with CSS Grid under the hood
8. All components support RTL layouts